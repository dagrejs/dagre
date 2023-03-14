"use strict";

var util = require("../util");

module.exports = initOrder;

/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
function initOrder(g) {
  var visited = {};
  var simpleNodes = g.nodes().filter(v => !g.children(v).length);
  var maxRank = Math.max(...simpleNodes.map(v => g.node(v).rank));
  var layers = util.range(maxRank + 1).map(() => []);

  function dfs(v) {
    if (visited.hasOwnProperty(v)) return;
    visited[v] = true;
    var node = g.node(v);
    if (!layers[node.rank]) {
      layers[node.rank] = [];
    }

    layers[node.rank].push(v);
    g.successors(v).forEach(dfs);
  }

  var orderedVs = simpleNodes.sort(v => g.node(v).rank);
  orderedVs.forEach(dfs);

  return layers;
}
