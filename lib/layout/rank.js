var util = require("../util"),
    components = require("graphlib").alg.components,
    PriorityQueue = require("graphlib").data.PriorityQueue,
    Set = require("graphlib").data.Set,
    Digraph = require("graphlib").Digraph;

module.exports = function(g, debugLevel) {
  var timer = util.createTimer(debugLevel >= 1);
  timer.wrap("Rank phase", function() {
    initRank(g);

    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      var tree = feasibleTree(subgraph);
      console.log("Feasible tree: " + JSON.stringify(tree, null, 4));
      // while (true) {
      // var e = leave_edge(subgraph);
      // if (e == null) { break; }
      // var f = enter_edge(e);
      // exchange(e, f);
      // }
      normalize(subgraph);
      // balance(subgraph);
    });
  })();
};

function initRank(g) {
  var minRank = {};
  var pq = new PriorityQueue();

  g.eachNode(function(u) {
    pq.add(u, g.inEdges(u).length);
    minRank[u] = 0;
  });

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error("Input graph is not acyclic: " + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(function(e) {
      var target = g.target(e);
      minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
      pq.decrease(target, pq.priority(target) - 1);
    });
  }
}

function feasibleTree(g) {
  var remaining = new Set(g.nodes()),
      minLen = [], // Array of {u, v, len}
      tree = new Digraph();

  // Collapse multi-edges and precompute the minLen, which will be the
  // max value of minLen for any edge in the multi-edge.
  var minLenMap = {};
  g.eachEdge(function(e, u, v, edge) {
    var id = incidenceId(u, v);
    if (!(id in minLenMap)) {
      minLen.push(minLenMap[id] = { u: u, v: v, len: 1 });
    }
    minLenMap[id].len = Math.max(minLenMap[id].len, edge.minLen || 1);
  });

  function slack(mle /* minLen entry*/) {
    return Math.abs(g.node(mle.u).rank - g.node(mle.v).rank) - mle.len;
  }

  // Remove arbitrary node - it is effectively the root of the spanning tree.
  var root = g.nodes()[0];
  remaining.remove();
  tree.addNode(root, g.node(root));

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var result,
        eSlack = Number.POSITIVE_INFINITY;
    minLen.forEach(function(mle /* minLen entry */) {
      if (remaining.has(mle.u) !== remaining.has(mle.v)) {
        var mleSlack = slack(mle);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = { mle: mle, treeNode: mle.u, graphNode: mle.v, len: mle.len};
          } else {
            result = { mle: mle, treeNode: mle.v, graphNode: mle.u, len: -mle.len };
          }
          eSlack = mleSlack;
        }
      }
    });

    return result;
  }

  while (remaining.size() > 0) {
    var result = findMinSlack();
    remaining.remove(result.graphNode);
    tree.addNode(result.graphNode);
    tree.addEdge(result.mle.u, result.mle.v);
    g.node(result.graphNode).rank = g.node(result.treeNode).rank + result.len;
  }

  return tree;
}

function normalize(g) {
  var m = util.min(g.nodes().map(function(u) { return g.node(u).rank; }));
  g.eachNode(function(u, node) { node.rank -= m; });
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return u < v ?  u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u;
}
