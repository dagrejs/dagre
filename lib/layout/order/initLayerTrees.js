var Graph = require("graphlib").Graph,
    nodesFromList = require("graphlib").filter.nodesFromList;

module.exports = initLayerTrees;

/*
 * Given a compound layered graph this function constructs an array of layered
 * trees for each layer in the graph. See Forster, "Applying Crossing Reduction
 * Strategies to Layered Compound Graphs" for details about its construction.
 */
function initLayerTrees(g) {
  // First we construct the complete tree of subgraph composition. We will then
  // create copies and prune them for each layer.
  var tree = new Graph();
  var ranks = [];

  g.nodes().forEach(function(u) { tree.addNode(u); });
  var root = tree.addNode();

  function dfs(u) {
    if (u === null) {
      g.children(u).forEach(function(v) {
        dfs(v);
        tree.addEdge(null, root, v);
      });
      return;
    }

    var value = g.node(u);
    value.minRank = ("rank" in value) ? value.rank : Number.MAX_VALUE;
    value.maxRank = ("rank" in value) ? value.rank : Number.MIN_VALUE;
    g.children(u).forEach(function(v) {
      dfs(v);
      tree.addEdge(null, u, v);
      value.minRank = Math.min(value.minRank, g.node(v).minRank);
      value.maxRank = Math.max(value.maxRank, g.node(v).maxRank);
    });

    for (var i = value.minRank; i <= value.maxRank; ++i) {
      if (!(i in ranks)) ranks[i] = [root];
      ranks[i].push(u);
    }
  }
  dfs(null);

  var layerTrees = [];
  root.maxRank = ranks.length;
  ranks.forEach(function(us, rank) {
    layerTrees[rank] = tree.filterNodes(nodesFromList(us));
  });

  g.graph().layerTrees = layerTrees;
  g.graph().layerTreeRoot = root;
}
