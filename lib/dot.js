var util = require("./util"),
    Graph = require("graphlib").Graph,
    dot = require("graphlib-dot");

// For now we re-export with old names for backwards compatibility
exports.toGraph = dot.parse;
exports.toGraphArray = dot.parseMany;

// This is new, so no name change
exports.write = dot.write;

// TODO: move this and the object reading stuff in layout.js to their own file.
exports.toObjects = function(str) {
  var g = exports.toGraph(str);
  var nodes = g.nodes().map(function(u) { return g.node(u); });
  var edges = g.edges().map(function(e) {
    var edge = g.edge(e);
    edge.source = g.node(g.source(e));
    edge.target = g.node(g.target(e));
    return edge;
  });
  return { nodes: nodes, edges: edges };
};
