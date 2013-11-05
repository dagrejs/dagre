var util = require('./util'),
    acyclic = require('./acyclic'),
    initRank = require('./rank/initRank'),
    feasibleTree = require('./rank/feasibleTree'),
    simplex = require('./rank/simplex'),
    components = require('graphlib').alg.components,
    filter = require('graphlib').filter;

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
  // If there are rank constraints on nodes, then build a new graph that
  // encodes the constraints.
  var constrainedGraph = util.time('constrainRanks', constrainRanks)(g.filterNodes(util.filterNonSubgraphs(g)));

  // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
  // state until the very end.
  util.time('acyclic', acyclic)(constrainedGraph);

  // Assign an initial ranking using DFS.
  initRank(constrainedGraph);

  // For each component improve the assigned ranks.
  components(constrainedGraph).forEach(function(cmpt) {
    var subgraph = constrainedGraph.filterNodes(filter.nodesFromList(cmpt));
    rankComponent(subgraph, useSimplex);
  });

  // Update the layout graph with rakn information from the constrained graph.
  util.time('applyConstrainedGraph', applyConstrainedGraph)(constrainedGraph, g);

  // When handling nodes with constrained ranks it is possible to end up with
  // edges that point to previous ranks. Most of the subsequent algorithms assume
  // that edges are pointing to successive ranks only. Here we reverse any "back
  // edges" and mark them as such. The acyclic algorithm will reverse them as a
  // post processing step.
  util.time('reorientEdges', reorientEdges)(g);
}

function constrainRanks(g) {
  var needsReduction = false,
      nodes = g.nodes();
  for (var i = 0, il = nodes.length; i < il; ++i) {
    if ('prefRank' in g.node(nodes[i])) {
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
      if (!checkSupportedPrefRank(rank)) {
        return;
      }

      newU = prefRankToNode[rank];
      if (newU === undefined) {
        newU = prefRankToNode[rank] = g.addNode(null, { originalNodes: [] });
        g.graph().compoundNodes.push(newU);
      }

      // Fixup all edges to point to new compound node.
      g.inEdges(u).forEach(function(e) {
        var value = { minLen: g.edge(e).minLen };
        if (rank === 'min') {
          // Ensure that all edges to min are reversed
          g.addEdge(null, newU, g.source(e), value);
        } else {
          g.addEdge(null, g.source(e), newU, value);
        }
        g.delEdge(e);
      });
      g.outEdges(u).forEach(function(e) {
        var value = { minLen: g.edge(e).minLen };
        if (rank === 'max') {
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

  return g;
}

function checkSupportedPrefRank(prefRank) {
  if (prefRank !== 'min' && prefRank !== 'max' && prefRank.indexOf('same_') !== 0) {
    console.error('Unsupported rank type: ' + prefRank);
    return false;
  }
  return true;
}

function applyConstrainedGraph(constrained, original) {
  if (constrained.graph().compoundNodes) {
    constrained.graph().compoundNodes.forEach(function(u) {
      var value = constrained.node(u);
      value.originalNodes.forEach(function(v) {
        original.node(v).rank = value.rank;
      });
    });
  }
}

function reorientEdges(g) {
  g.eachEdge(function(e, u, v, value) {
    if (g.node(u).rank > g.node(v).rank) {
      g.delEdge(e);
      value.reversed = true;
      g.addEdge(e, v, u, value);
    }
  });
}

function rankComponent(subgraph, useSimplex) {
  var spanningTree = feasibleTree(subgraph);

  if (useSimplex) {
    util.log(1, 'Using network simplex for ranking');
    simplex(subgraph, spanningTree);
  }
  normalize(subgraph);
}

function normalize(g) {
  var m = util.min(g.nodes().map(function(u) { return g.node(u).rank; }));
  g.eachNode(function(u, node) { node.rank -= m; });
}
