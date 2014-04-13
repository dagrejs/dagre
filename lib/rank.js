var util = require('./util'),
    acyclic = require('./rank/acyclic'),
    initRank = require('./rank/initRank'),
    feasibleTree = require('./rank/feasibleTree'),
    constraints = require('./rank/constraints'),
    nestingGraph = require('./rank/nestingGraph'),
    simplex = require('./rank/simplex'),
    components = require('graphlib').alg.components,
    topsort = require('graphlib').alg.topsort,
    filter = require('graphlib').filter;

exports.run = run;
exports.restoreEdges = restoreEdges;

/*
 * Heuristic function that assigns a rank to each node of the input graph with
 * the intent of minimizing edge lengths, while respecting the `minLen`
 * attribute of incident edges.
 *
 * Pre-conditions:
 *
 *  * Each edge in the input graph must have an assigned 'minLen' attribute
 *
 * Post-conditions:
 *
 *  * Each node will have assigned `rank`, `minRank`, and `maxRank` attributes.
 *    For simple nodes `rank = minRank = maxRank`. For composite nodes
 *    `minRank` is the minimum rank for any node that is a descedant of the
 *    node and similarly `maxRank` is the maximum rank. The inequality
 *    `minRank <= rank <= maxRank` will always hold.
 *  * Composite nodes will have assigned `borderNodeTop` and `borderNodeBottom`
 *    attributes, where `borderNodeTop` is a node at the top of the subgraph
 *    (its rank is equal to `minRank`) and `borderNodeBottom` is the bottom
 *    node of the subgraph.
 *  * The graph will be assigned an attribute `maxRank` that indicates the last
 *    rank assigned to any node in the graph. Ranks are assumed to start from
 *    rank 0, so there is no `minRank` attribute.
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

  // Normalize ranks
  normalizeRanks(g);

  // Remove empty layers which may have been introduced by the nesting graph.
  util.time('nestingGraph.removeEmptyLayers', nestingGraph.removeEmptyLayers)(g);

  // Normalize ranks
  normalizeRanks(g);

  // Assign min and max ranks to all nodes
  assignMinMaxRanks(g);
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
          z = addDummyNode(g, e, u, v, a, 2, false, idGen),
          parent = g.parent(u);
      g.parent(x, parent);
      g.parent(y, parent);
      g.parent(z, parent);
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
      g.parent(dummy, g.parent(u));
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

  // Correct top border nodes
  var nodes = topsort(subgraph),
      u,
      attrs;

  function rank(v) { return subgraph.node(v).rank; }

  for (var i = nodes.length - 1; i >= 0; --i) {
    u = nodes[i];
    attrs = subgraph.node(u);
    if (attrs.nestingGraphTop) {
      attrs.rank = util.min(subgraph.successors(u).map(rank)) - 1;
    }
  }
}

function normalizeRanks(g) {
  var simpleNodes = g.nodes().filter(function(u) { return !g.children(u).length; });
  var m = util.min(simpleNodes.map(function(u) { return g.node(u).rank; }));
  simpleNodes.forEach(function(u) {
    g.node(u).rank -= m;
  });
}

function assignMinMaxRanks(g) {
  // Post-order traversal ensures that we can bubble up min and max ranks.
  var maxRank = 0;
  function dfs(u) {
    var children = g.children(u),
        attrs = g.node(u);
    if (!children.length) {
      attrs.minRank = attrs.maxRank = attrs.rank;
    } else {
      attrs.minRank = Number.MAX_VALUE;
      attrs.maxRank = 0;
      children.forEach(function(v) {
        dfs(v);
        attrs.minRank = Math.min(attrs.minRank, g.node(v).minRank);
        attrs.maxRank = Math.max(attrs.maxRank, g.node(v).maxRank);
      });
    }
    maxRank = Math.max(maxRank, attrs.maxRank);
  }
  g.children(null).forEach(dfs);
  g.graph().maxRank = maxRank;
}
