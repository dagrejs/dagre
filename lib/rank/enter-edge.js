var _ = require("lodash"),
    rankUtil = require("./util");

module.exports = enterEdge;

/*
 * Simulates the removal of the given edge from the tight tree and returns an
 * edge from the head component to the tail component with the minimum slack.
 *
 * For a more detailed treatment, please see Gansner, et al., "A Techinque for
 * Drawing irected Graphs."
 *
 * Pre-conditions:
 *
 *    - Tree must be a tree (undirected graph)
 *    - Tree nodes must have assigned low, lim, and parent attributes
 *    - Graph edges must all have assign minlen attributes
 *    - Graph must be directed and acyclic
 *    - The edge must exist both in the tree and in the graph
 *
 * Post-conditions:
 *
 *    - Both the tree and the graph are unchanged.
 *
 * Returns the edge with the minimum slack from the head component to the tail
 * component
 */
function enterEdge(tree, g, edge) {
  var v = edge.v,
      w = edge.w,
      vLabel = tree.getNode(v),
      wLabel = tree.getNode(w),
      tailLabel = vLabel,
      flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if (vLabel.lim > wLabel.lim) {
    tailLabel = wLabel;
    flip = true;
  }

  var candidates = _.filter(g.edges(), function(edge) {
    return flip === isDescendant(tree, tree.getNode(edge.v), tailLabel) &&
           flip !== isDescendant(tree, tree.getNode(edge.w), tailLabel);
  });

  return _.min(candidates, function(edge) { return rankUtil.slack(g, edge); });
}

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
function isDescendant(tree, vLabel, rootLabel) {
  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
}
