var _ = require("lodash");

module.exports = normalize;

/*
 * Adjusts ranks for all nodes in the graph such that all are >= 0 and at least
 * one has rank 0.
 *
 * Pre-conditions:
 *
 *    - Graph must have at least one node
 *    - Graph nodes must be objects with a "rank" attribute
 *
 * Post-conditions:
 *
 *    - Graph node ranks will be adjusted as described above.
 */
function normalize(g) {
  var min = _.min(_.map(g.nodes(), function(node) { return node.label.rank; }));
  _.each(g.nodeIds(), function(v) {
    g.updateNode(v, function(label) {
      label.rank -= min;
      return label;
    });
  });
}
