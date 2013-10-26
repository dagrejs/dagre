/* jshint -W079 */
var Set = require('cp-data').Set,
/* jshint +W079 */
    CDigraph = require('graphlib').CDigraph,
    rankUtil = require('./rankUtil');

module.exports = feasibleTree;

/*
 * This function produces a simple (i.e. one edge between any pair of nodes),
 * compound directed acyclic graph derived from the given input graph. The
 * "tree" is encoded through the parent / child relationships in the graph.
 *
 * The input graph should have the following properties:
 *
 *  * It is acyclic.
 *  * Each node has an object value.
 *  * Each edge in the input graph has an assigned `minLen` attribute.
 *  * Each edge *may* have a `reversed` attribute indicating that the edge's
 *    source and target have been swapped (typically to produce an acyclic
 *    input graph).
 *
 * The tree graph has the following properties:
 *
 *  * It is acyclic.
 *  * It is simple, i.e. only one edge between any pair of nodes.
 *  * It has a spanning tree representation in its parent / child
 *    relationships.
 *  * Each node's id is the same as it's id in the input graph.
 *  * Each node's value is a reference to the input graphs node value. This
 *    allows the rank to be set in the input graph nodes via the tree graph.
 *  * Each edge has a `weight` attribute which stores the number of edges
 *    that were collapsed between the incident nodes from the input graph.
 *  * Each edge has a `minLen` attribute which stores the maximum `minLen` value
 *    for all of the edges between the incident nodes in the input graph.
 *  * Each edge has a `reversed` attribute which, when true, indicates that the
 *    edge was reversed in the input graph.
 */
function feasibleTree(g, root) {
  var remaining = new Set(g.nodes()),
      tree = new CDigraph();

  g.eachNode(function(u, value) { tree.addNode(u, value); });

  g.eachEdge(function(e, u, v, value) {
    var id = incidenceId(u, v);
    if (!tree.hasEdge(id)) {
      tree.addEdge(id, u, v, {
        weight: 1,
        minLen: value.minLen,
        reversed: value.reversed
      });
    } else {
      var treeValue = tree.edge(id);
      treeValue.weight++;
      treeValue.minLen = Math.max(treeValue.minLen, value.minLen);
    }
  });

  if (arguments.length < 2) {
    // Since no root was specified, pick an arbitrary root
    root = tree.nodes()[0];
  }
  remaining.remove(root);

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var minEdge,
        minSlack = Number.POSITIVE_INFINITY;

    tree.eachEdge(function(e, u, v, value) {
      if (remaining.has(u) !== remaining.has(v)) {
        var slack = rankUtil.slack(tree, u, v, value.minLen);
        if (slack < minSlack) {
          minEdge = e;
          minSlack = slack;
        }
      }
    });

    return minEdge;
  }

  while (remaining.size() > 0) {
    var minEdge = findMinSlack(),
        minEdgeValue = tree.edge(minEdge),
        minLen = minEdgeValue.minLen,
        multiplier = minEdgeValue.reversed ? -1 : 1,
        minEdgeSource = tree.source(minEdge),
        minEdgeTarget = tree.target(minEdge);

    // Add the non-tree node as a child of the tree node
    if (remaining.has(minEdgeTarget)) {
      tree.parent(minEdgeTarget, minEdgeSource);
      tree.node(minEdgeTarget).rank = tree.node(minEdgeSource).rank + minLen * multiplier;
      remaining.remove(minEdgeTarget);
    } else {
      tree.parent(minEdgeSource, minEdgeTarget);
      tree.node(minEdgeSource).rank = tree.node(minEdgeTarget).rank - minLen * multiplier;
      remaining.remove(minEdgeSource);
    }
  }

  return tree;
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return (u < v
            ? String(u).length + ':' + u + '-' + v
            : String(v).length + ':' + v + '-' + u);
}
