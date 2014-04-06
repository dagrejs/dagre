/*
 * Adds a simple ranked node to the graph. If the order is specified it is also
 * added to the node.
 */
exports.addSimpleNode = function(g, u, rank, order) {
  var attrs = { rank: rank, minRank: rank, maxRank: rank };
  if (arguments.length > 3) {
    attrs.order = order;
  }
  g.addNode(u, attrs);
};

/*
 * Adds a compound node to the graph that consists of the given children. This
 * function ensures that appropriate rank information is set up for the
 * compound node.
 */
exports.addCompoundNode = function(g, u, vs) {
  var attrs = { minRank: 0, maxRank: 0 };
  g.addNode(u, attrs);
  vs.forEach(function(v) {
    attrs.minRank = Math.min(attrs.minRank, g.node(v).minRank);
    attrs.maxRank = Math.max(attrs.maxRank, g.node(v).maxRank);
    g.parent(v, u);
  });
};
