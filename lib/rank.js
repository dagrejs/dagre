var util = require('./util'),
    acyclic = require('./rank/acyclic'),
    initRank = require('./rank/initRank'),
    feasibleTree = require('./rank/feasibleTree'),
    constraints = require('./rank/constraints'),
    simplex = require('./rank/simplex'),
    components = require('graphlib').alg.components,
    filter = require('graphlib').filter;

exports.run = run;
exports.restoreEdges = restoreEdges;

/*
 * Heuristic function that assigns a rank to each node of the input graph with
 * the intent of minimizing edge lengths, while respecting the `minLen`
 * attribute of incident edges.
 *
 * Prerequisites:
 *
 *  * Each edge in the input graph must have an assigned 'minLen' attribute
 */
function run(g, useSimplex) {
  var selfLoops = removeSelfLoops(g);

  // If there are rank constraints on nodes, then build a new graph that
  // encodes the constraints.
  util.time('constraints.apply', constraints.apply)(g);

  // Since we already removed self loops before applying rank constraints we
  // know that self loops indicate sideways edges induced by rank constraints.
  // Currently we do not have any support for sideways edges, so we remove
  // them. Since the edges we remove are between collapsed nodes, we need to
  // take care to save the original edge information.
  var sidewaysEdges = removeSelfLoops(g)
    .map(function(edge) {
      return edge.value.originalEdge;
    });

  // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
  // state until the very end.
  util.time('acyclic', acyclic)(g);

  // Convert the graph into a flat graph for ranking
  var flatGraph = g.filterNodes(util.filterNonSubgraphs(g));

  // Assign an initial ranking using DFS.
  initRank(flatGraph);

  // For each component improve the assigned ranks.
  components(flatGraph).forEach(function(cmpt) {
    var subgraph = flatGraph.filterNodes(filter.nodesFromList(cmpt));
    rankComponent(subgraph, useSimplex);
  });

  // Relax original constraints
  util.time('constraints.relax', constraints.relax(g));

  // When handling nodes with constrained ranks it is possible to end up with
  // edges that point to previous ranks. Most of the subsequent algorithms assume
  // that edges are pointing to successive ranks only. Here we reverse any "back
  // edges" and mark them as such. The acyclic algorithm will reverse them as a
  // post processing step.
  util.time('reorientEdges', reorientEdges)(g);

  // Save removed edges so that they can be restored later
  g.graph().rankRemovedEdges = selfLoops.concat(sidewaysEdges);
}

function restoreEdges(g) {
  g.graph().rankRemovedEdges.forEach(function(edge) {
    // It's possible that the removed edge collides with an auto-assigned id,
    // so we check for and resolve such cases here.
    if (g.hasEdge(edge.e)) {
      g.addEdge(null, g.source(edge.e), g.target(edge.e), g.edge(edge.e));
      g.delEdge(edge.e);
    }
    g.addEdge(edge.e, edge.u, edge.v, edge.value);
  });

  acyclic.undo(g);
}

/*
 * Find any self loops and remove them from the input graph. Return the removed
 * edges in the form { e, u, v, value }.
 */
function removeSelfLoops(g) {
  var selfLoops = [];

  g.eachEdge(function(e, u, v, value) {
    if (u === v) {
      selfLoops.push({e: e, u: u, v: v, value: value});
      g.delEdge(e);
    }
  });

  return selfLoops;
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
