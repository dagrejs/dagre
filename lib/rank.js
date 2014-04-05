var util = require('./util'),
    acyclic = require('./rank/acyclic'),
    initRank = require('./rank/initRank'),
    feasibleTree = require('./rank/feasibleTree'),
    constraints = require('./rank/constraints'),
    nestingGraph = require('./rank/nestingGraph'),
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
  expandSelfLoops(g);

  // If there are rank constraints on nodes, then build a new graph that
  // encodes the constraints.
  util.time('constraints.apply', constraints.apply)(g);

  expandSidewaysEdges(g);

  // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
  // state until the very end.
  util.time('acyclic', acyclic)(g);

  // Add nesting edges
  util.time('nestingGraph.augment', nestingGraph.augment)(g);

  // Convert the graph into a flat graph for ranking
  var flatGraph = g.filterNodes(util.filterNonSubgraphs(g));

  // Assign an initial ranking using DFS.
  initRank(flatGraph);

  // For each component improve the assigned ranks.
  components(flatGraph).forEach(function(cmpt) {
    var subgraph = flatGraph.filterNodes(filter.nodesFromList(cmpt));
    rankComponent(subgraph, useSimplex);
  });

  // Remove nesting edges
  util.time('nestingGraph.removeEdges', nestingGraph.removeEdges)(g);

  // Relax original constraints
  util.time('constraints.relax', constraints.relax(g));

  // When handling nodes with constrained ranks it is possible to end up with
  // edges that point to previous ranks. Most of the subsequent algorithms assume
  // that edges are pointing to successive ranks only. Here we reverse any "back
  // edges" and mark them as such. The acyclic algorithm will reverse them as a
  // post processing step.
  util.time('reorientEdges', reorientEdges)(g);

  // Remove empty layers which may have been introduced by the nesting graph.
  util.time('nestingGraph.removeEmptyLayers', nestingGraph.removeEmptyLayers)(g);
}

function restoreEdges(g) {
  acyclic.undo(g);
}

/*
 * Expand self loops into three dummy nodes. One will sit above the incident
 * node, one will be at the same level, and one below. The result looks like:
 *
 *         /--<--x--->--\
 *     node              y
 *         \--<--z--->--/
 *
 * Dummy nodes x, y, z give us the shape of a loop and node y is where we place
 * the label.
 *
 * TODO: consolidate knowledge of dummy node construction.
 * TODO: support minLen = 2
 */
function expandSelfLoops(g) {
  var idGen = util.idGen('_sl');
  g.eachEdge(function(e, u, v, a) {
    if (u === v) {
      var x = addDummyNode(g, e, u, v, a, 0, false, idGen),
          y = addDummyNode(g, e, u, v, a, 1, true, idGen),
          z = addDummyNode(g, e, u, v, a, 2, false, idGen);
      g.addEdge(idGen(), x, u, {minLen: 1, selfLoop: true});
      g.addEdge(idGen(), x, y, {minLen: 1, selfLoop: true});
      g.addEdge(idGen(), u, z, {minLen: 1, selfLoop: true});
      g.addEdge(idGen(), y, z, {minLen: 1, selfLoop: true});
      g.delEdge(e);
    }
  });
}

function expandSidewaysEdges(g) {
  var idGen = util.idGen('_se');
  g.eachEdge(function(e, u, v, a) {
    if (u === v) {
      var origEdge = a.originalEdge,
          dummy = addDummyNode(g, origEdge.e, origEdge.u, origEdge.v, origEdge.value, 0, true, idGen);
      g.addEdge(idGen(), u, dummy, {minLen: 1});
      g.addEdge(idGen(), dummy, v, {minLen: 1});
      g.delEdge(e);
    }
  });
}

function addDummyNode(g, e, u, v, a, index, isLabel, idGen) {
  return g.addNode(idGen(), {
    width: isLabel ? a.width : 0,
    height: isLabel ? a.height : 0,
    edge: { id: e, source: u, target: v, attrs: a },
    dummySegment: true,
    dummy: true,
    index: index
  });
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
