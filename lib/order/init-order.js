var _ = require("lodash");

module.exports = initOrder;

function initOrder(g) {
  var visited = {},
      maxRank = _.max(_.map(g.nodes(), function(node) { return node.label.rank; })),
      layers = _.map(_.range(maxRank + 1), function() { return 0; });

  function dfs(v) {
    if (_.has(visited, v)) return;
    visited[v] = true;
    var label = g.getNode(v);
    label.order = layers[label.rank]++;
    _.each(g.successors(v), dfs);
  }

  _.each(g.sources(), dfs);
}
