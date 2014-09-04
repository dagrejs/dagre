var _ = require("lodash"),
    Graph = require("graphlib").Graph,
    rankUtil = require("./util");

module.exports = feasibleTree;

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    - Graph must be a DAG
 *    - Graph must be connected
 *    - Graph must have at least one node
 *    - Graph nodes must be objects
 *    - Graph nodes must have been previously ranked
 *    - Graph edges must have a minlen attribute
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges. Each edge has the label {v, w}, which indicates which directed edge
 * is represented in the original graph.
 */
function feasibleTree(g) {
  var tree = new Graph()
    .setDefaultNodeLabel(function() { return {}; })
    .setDefaultEdgeLabel(function() { return {}; });

  // Choose arbitrary node from which to start our tree
  var start = g.nodes()[0];
  tree.setNode(start.v);

  var edge, delta;
  while (tightTree(tree, g) < g.nodeCount()) {
    edge = findMinSlackEdge(tree, g);
    delta = tree.hasNode(edge.v) ? rankUtil.slack(g, edge) : -rankUtil.slack(g, edge);
    shiftRanks(tree, g, delta);
  }

  return tree;
}

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
function tightTree(tree, g) {
  _.each(tree.nodeIds(), _.partial(addNeighborsToTightTree, tree, g));
  return tree.nodeCount();
}

/*
 * Tries to add neighbors of v to the tree if the neighbor is connected by a
 * tight edge. Recursively scans from the neighbor for additional tight edges.
 */
function addNeighborsToTightTree(tree, g, v) {
  _.each(g.nodeEdges(v), function(edge) {
    var w = (v === edge.v) ? edge.w : edge.v;
    if (!tree.hasNode(w) && !rankUtil.slack(g, edge)) {
      tree.setNode(w);
      tree.setEdge(v, w, { v: edge.v, w: edge.w });
      addNeighborsToTightTree(tree, g, w);
    }
  });
}

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(tree, g) {
  return _.min(g.edges(), function(edge) {
    if (tree.hasNode(edge.v) !== tree.hasNode(edge.w)) {
      return rankUtil.slack(g, edge);
    }
  });
}

function shiftRanks(tree, g, delta) {
  _.each(tree.nodeIds(), function(v) {
    g.updateNode(v, function(label) {
      label.rank += delta;
      return label;
    });
  });
}
