var _ = require("lodash");

module.exports = calcCutValue;

/*
 * Calculates the "cut value" for the specified edge in the tree.
 *
 * When a tree edge is removed the tree breaks into two separate components,
 * the head component and the tail component. The head component is the
 * component on the head side of the broken edge, while the tail component is
 * the component on the tail side of the broken edge. The cut value for the
 * tree edge is defined as the sum of the weights of the edges pointing from the
 * tail component to the head component minus the sum of the weights of the
 * edges pointing from the head component to the tail component, including the
 * weight of the tree edge.
 *
 * We use the incremental algorithm presented in the Gansner paper cited below
 * to generate the cut values. We assume that all of the children of the child
 * node have already had their cut values assigned.
 *
 * For a more detailed treatment, please see Gansner, et al., "A Techinque for
 * Drawing irected Graphs."
 *
 * Pre-conditions:
 *
 *    - Tree must be a tree (undirected graph)
 *    - Tree nodes must have assigned low, lim, and parent attributes
 *    - Graph edges must all have assigned weights
 *    - All descendent tree edges of the child node must have a cutvalue
 *      assigned
 *    - Graph must be directed and acyclic
 *    - The edge must exist both in the tree and in the graph
 *
 * Post-conditions:
 *
 *    - Both the tree and the graph are unchanged.
 *
 * Returns the cut value for the edge.
 */
function calcCutValue(tree, g, child) {
  var childLab = tree.getNode(child),
      parent = childLab.parent,
      // True if the child is on the tail end of the edge in the directed graph
      childIsTail = true,
      // The graph's view of the edge we're inspect
      graphEdge = g.getEdge(child, parent),
      cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g.getEdge(parent, child);
  }

  cutValue = graphEdge.weight;

  _.each(g.nodeEdges(child), function(edge) {
    var isOutEdge = edge.v === child,
        other = isOutEdge ? edge.w : edge.v;

    if (other !== parent) {
      var pointsToHead = isOutEdge === childIsTail,
          otherWeight = edge.label.weight;

      cutValue += pointsToHead ? otherWeight : -otherWeight;
      if (isTreeEdge(tree, child, other)) {
        var otherCutValue = tree.getEdge(child, other).cutvalue;
        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
      }
    }
  });

  return cutValue;
}

/*
 * Returns true if the edge is in the tree.
 */
function isTreeEdge(tree, u, v) {
  return tree.hasEdge(u, v);
}
