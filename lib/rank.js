var util = require("./util"),
    components = require("graphlib").alg.components,
    filter = require("graphlib").filter,
    PriorityQueue = require("graphlib").data.PriorityQueue,
    /* jshint -W079 */
    Set = require("graphlib").data.Set;

module.exports = function(g, debugLevel) {
  var timer = util.createTimer(debugLevel >= 1);
  timer.wrap("Rank phase", function() {
    g = g.filterNodes(util.filterNonSubgraphs(g));

    initRank(g);

    components(g).forEach(function(cmpt) {
      var subgraph = g.filterNodes(filter.nodesFromList(cmpt));
      feasibleTree(subgraph);
      normalize(subgraph);
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

  function updateTargetNode(e) {
    var rank = g.node(g.source(e)).rank;
    var target = g.target(e);
    minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
    pq.decrease(target, pq.priority(target) - 1);
  }

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error("Input graph is not acyclic: " + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(updateTargetNode);
  }
}

function feasibleTree(g) {
  var remaining = new Set(g.nodes()),
      minLen = []; // Array of {u, v, len}

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
  remaining.remove(g.nodes()[0]);

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var result,
        eSlack = Number.POSITIVE_INFINITY;
    minLen.forEach(function(mle /* minLen entry */) {
      if (remaining.has(mle.u) !== remaining.has(mle.v)) {
        var mleSlack = slack(mle);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = { treeNode: mle.u, graphNode: mle.v, len: mle.len};
          } else {
            result = { treeNode: mle.v, graphNode: mle.u, len: -mle.len };
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
    g.node(result.graphNode).rank = g.node(result.treeNode).rank + result.len;
  }
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
