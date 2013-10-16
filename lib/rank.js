/* jshint -W079 */
var util = require("./util"),
    acyclic = require("./acyclic"),
    components = require("graphlib").alg.components,
    filter = require("graphlib").filter,
    PriorityQueue = require("cp-data").PriorityQueue,
    Set = require("cp-data").Set;

module.exports = rank;

function rank(g) {
  g = g.filterNodes(util.filterNonSubgraphs(g));

  var reduced = combineRanks(g);

  initRank(reduced);

  components(reduced).forEach(function(cmpt) {
    var subgraph = reduced.filterNodes(filter.nodesFromList(cmpt));
    feasibleTree(subgraph);
    normalize(subgraph);
  });

  expandRanks(reduced, g);
}

/*
 * If there are rank constraints on nodes, then build a condensed graph,
 * with one node per rank set.  Modify edges to that the minimum rank
 * will be ranked before any others and the maximum rank will be ranked
 * after any others.
 */
function combineRanks(g) {
  var needsReduction = false,
      nodes = g.nodes();
  for (var i = 0, il = nodes.length; i < il; ++i) {
    if ("prefRank" in g.node(nodes[i])) {
      needsReduction = true;
      break;
    }
  }

  if (!needsReduction) { return g; }

  g = g.copy();
  g.graph({ compoundNodes: [] });

  var prefRankToNode = {};
  g.eachNode(function(u, value) {
    var rank = value.prefRank,
        newU;

    if (rank !== undefined) {
      newU = prefRankToNode[rank];
      if (newU === undefined) {
        newU = prefRankToNode[rank] = g.addNode(null, { originalNodes: [] });
        g.graph().compoundNodes.push(newU);
      }

      // Fixup all edges to point to new compound node.
      g.inEdges(u).forEach(function(e) {
        if (rank === "min") {
          // Ensure that all edges to min are reversed
          g.addEdge(null, newU, g.source(e), g.edge(e));
        } else {
          g.addEdge(null, g.source(e), newU, g.edge(e));
        }
        g.delEdge(e);
      });
      g.outEdges(u).forEach(function(e) {
        if (rank === "max") {
          // Ensure that all edges from max are reversed
          g.addEdge(null, g.target(e), newU, g.edge(e));
        } else {
          g.addEdge(null, newU, g.target(e), g.edge(e));
        }
        g.delEdge(e);
      });

      // Save original node and remove it from reduced graph
      g.node(newU).originalNodes.push(u);
      g.delNode(u);
    }
  });

  var minNode = prefRankToNode.min;
  if (minNode !== undefined) {
    g.nodes().forEach(function(u) { g.addEdge(null, minNode, u, { minLen: 0 }); });
  }

  var maxNode = prefRankToNode.max;
  if (maxNode !== undefined) {
    g.nodes().forEach(function(u) { g.addEdge(null, u, maxNode, { minLen: 0 }); });
  }

  acyclic(g, false);

  return g;
}

/*
 * If the argument graph was a reduced version of some original graph
 * then copy assigned ranks from it to the original.  Otherwise, the
 * ranks are already assigned.
 */
function expandRanks(g, original) {
  if (g.graph().compoundNodes) {
    g.graph().compoundNodes.forEach(function(u) {
      var value = g.node(u);
      value.originalNodes.forEach(function(v) {
        original.node(v).rank = value.rank;
      });
    });
  }
}

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
    var value = g.edge(e);
    var minLen = "minLen" in value ? value.minLen : 1;
    minRank[target] = Math.max(minRank[target], rank + minLen);
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
      minLen.push(minLenMap[id] = { u: u, v: v, len: 0 });
    }
    minLenMap[id].len = Math.max(minLenMap[id].len, ("minLen" in edge ? edge.minLen : 1));
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
