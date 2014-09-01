var _ = require("lodash"),
    initRank = require("./init-rank"),
    feasibleTree = require("./feasible-tree");

module.exports = rank;

/*
 * Assigns a rank to each node in the input graph that respects the "minlen"
 * constraint specified on edges between nodes.
 *
 * This basic structure is derived from Gansner, et al., "A Technique for
 * Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    - Graph must be directed
 *    - Graph must be acyclic
 *    - Graph must have at least one node
 *    - Graph nodes must be objects
 *    - Graph edges must have a minlen attribute
 *
 * Post-conditions:
 *
 *    - Graph nodes will have a "rank" attribute based on the results of the
 *      algorithm.
 */
function rank(g) {
  initRank(g);
  _.each(g.components(), _.partial(rankComponent, g));
}

/*
 * Helper that updates ranks for individual components in the input graph. This
 * function requires that a rank has already been assigned to all nodes in the
 * component.
 */
function rankComponent(g, cmpt) {
  var cmptMap = {},
      cmptGraph;

  _.each(cmpt, function(v) { cmptMap[v] = true; });

  cmptGraph = g.filterNodes(function(node) {
    return cmptMap[node.v];
  });

  feasibleTree(g);
}
