var _ = require("lodash");

module.exports = assignLowLim;

/*
 * Assigns "low", "lim", and "parent" attributes to each node in the input
 * tree.
 *
 * Pre-conditions:
 *
 *    - Input graph must be a tree (undirected graph)
 *    - The root must be in the tree
 *
 * Post-conditions:
 *
 *    - Each node in the tree is assigned the following attributes:
 *      - "lim" is the postorder traversal number of the node, starting at
 *        index 1.
 *      - "low" is the least postorder traversal number for any descendant of
 *        the node.
 *      - "parent" is the parent of this node in the postorder traveral. If
 *        this node is the root, the parent is not defined.
 */
function assignLowLim(tree, root) {
  postorder(tree, {}, 1, root);
}

function postorder(tree, visited, nextLim, v, parent) {
  var low = nextLim,
      label = tree.getNode(v);

  visited[v] = true;
  _.each(tree.neighbors(v), function(w) {
    if (!_.has(visited, w)) {
      nextLim = postorder(tree, visited, nextLim, w, v);
    }
  });

  label.low = low;
  label.lim = nextLim++;
  if (arguments.length > 4) {
    label.parent = parent;
  }

  return nextLim;
}
