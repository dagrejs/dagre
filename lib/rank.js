var util = require("./util"),
    acyclic = require("./acyclic"),
    initRank = require("./rank/initRank"),
    feasibleTree = require("./rank/feasibleTree"),
    simplex = require("./rank/simplex"),
    components = require("graphlib").alg.components,
    filter = require("graphlib").filter;

module.exports = rank;

/*
 * Heuristic function that assigns a rank to each node of the input graph with
 * the intent of minimizing edge lengths, while respecting the `minLen`
 * attribute of incident edges.
 *
 * Prerequisites:
 *
 *  * Input graph must be acyclic
 *  * Each edge in the input graph must have an assigned 'minLen' attribute
 */
function rank(g, useSimplex) {
  var reduced = combineRanks(g.filterNodes(util.filterNonSubgraphs(g)));

  initRank(reduced);

  components(reduced).forEach(function(cmpt) {
    var subgraph = reduced.filterNodes(filter.nodesFromList(cmpt));
    var spanningTree = feasibleTree(subgraph);

    if (useSimplex) {
      simplex(subgraph, spanningTree);
    }
    normalize(subgraph);
  });

  expandRanks(reduced, g);

  orientEdges(g);
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

  if (!needsReduction) {
    return g;
  }

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
        var value = { minLen: g.edge(e).minLen };
        if (rank === "min") {
          // Ensure that all edges to min are reversed
          g.addEdge(null, newU, g.source(e), value);
        } else {
          g.addEdge(null, g.source(e), newU, value);
        }
        g.delEdge(e);
      });
      g.outEdges(u).forEach(function(e) {
        var value = { minLen: g.edge(e).minLen };
        if (rank === "max") {
          // Ensure that all edges from max are reversed
          g.addEdge(null, g.target(e), newU, value);
        } else {
          g.addEdge(null, newU, g.target(e), value);
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

/*
 * When handling nodes with constrained ranks it is possible to end up with
 * edges that point to previous ranks. Most of the subsequent algorithms assume
 * that edges are pointing to successive ranks only. Here we reverse any "back
 * edges" and mark them as such. The acyclic algorithm will reverse them as a
 * post processing step.
 */
function orientEdges(g) {
  g.eachEdge(function(e, u, v, value) {
    if (g.node(u).rank > g.node(v).rank) {
      g.delEdge(e);
      value.reversed = !value.reversed;
      g.addEdge(e, v, u, value);
    }
  });
}

function normalize(g) {
  var m = util.min(g.nodes().map(function(u) { return g.node(u).rank; }));
  g.eachNode(function(u, node) { node.rank -= m; });
}
