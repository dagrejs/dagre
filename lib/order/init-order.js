"use strict";

var _ = require("lodash");

module.exports = initOrder;

function initOrder(g) {
  var visited = {},
      maxRank = _.max(_.map(g.nodes(), function(v) { return g.getNode(v).rank; })),
      layers = _.map(_.range(maxRank + 1), function() { return 0; });

  function dfs(v) {
    if (_.has(visited, v)) return;
    visited[v] = true;
    var node = g.getNode(v);
    node.order = layers[node.rank]++;
    _.each(g.successors(v), dfs);
  }

  _.each(g.sources(), dfs);
}
