var _ = require("lodash"),
    postorder = require("graphlib").alg.postorder;

module.exports = longestPath;

/*
 * Updates the graph with ranks assigned based on the longest-path algorithm.
 *
 * Pre-conditions:
 *
 *    - Graph must be directed
 *    - Graph must be acyclic
 *    - Graph nodes must be objects
 *    - Graph edges must have a minlen attribute
 *
 * Post-conditions:
 *
 *    - Graph nodes will have a "rank" attribute based on the results of the
 *      algorithm.
 */
function longestPath(g) {
  _.each(postorder(g, g.sources()), function(v) {
    var label = g.getNode(v),
        outEdges = g.outEdges(v);

    if (!outEdges.length) {
      label.rank = 0;
    } else {
      label.rank = _.min(_.map(outEdges, _.partial(predecessorRank, g)));
    }
  });
}

function predecessorRank(g, edge) {
  return g.getNode(edge.w).rank - edge.label.minlen;
}
