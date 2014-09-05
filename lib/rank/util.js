var _ = require("lodash");

module.exports = {
  normalize: normalize,
  slack: slack
};

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
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

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
function slack(g, edge) {
  return g.getNode(edge.w).rank - g.getNode(edge.v).rank - edge.label.minlen;
}
