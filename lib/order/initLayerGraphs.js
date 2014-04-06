var nodesFromList = require('graphlib').filter.nodesFromList;

module.exports = initLayerGraphs;

/*
 * This function takes a compound layered graph, g, and produces an array of
 * layer graphs. Each entry in the array represents a subgraph of nodes
 * relevant for performing crossing reduction on that layer.
 *
 * Pre-conditions:
 *
 *    * The input graph must have the `maxRank` attribute
 *    * All nodes in the input graph must have `minRank` and `maxRank` attributes.
 */
function initLayerGraphs(g) {
  var ranks = [],
      maxRank = util.max(g.children(null).map(function(u) { return g.node(u).maxRank; }));

  if (maxRank === undefined || Number.isNaN(maxRank)) {
    throw new Error('At least one node in the input graph is missing a maxRank assignment');
  }

  for (var i = 0; i <= maxRank; ++i) {
    ranks[i] = [];
  }

  g.eachNode(function(u, a) {
    if (g.children(u).length) return;
    for (var i = a.minRank, il = a.maxRank; i <= il; ++i) {
      ranks[i].push(u);
      var parent = g.parent(u);
      // TODO: for deeply nested graphs it may be more efficient to use a Set.
      while (parent !== null) {
        ranks[i].push(parent);
        parent = g.parent(parent);
      }
    }
  });

  return ranks.map(function(us) { return g.filterNodes(nodesFromList(us)); });
}
