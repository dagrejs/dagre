// NOTE: This is not yet working, it's a stub.

var _ = require("lodash"),
    acyclic = require("./acyclic"),
    normalize = require("./normalize"),
    rank = require("./rank"),
    Digraph = require("graphlib").Digraph;

module.exports = layout;

function layout(g) {
  var layoutGraph = buildLayoutGraph(g);
  runLayout(layoutGraph);
  updateInputGraph(g, layoutGraph);
}

function runLayout(g) {
  acyclic.apply(g);
  rank(g, g.getGraph("ranker"));
  normalize.apply(g);
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(inputGraph, layoutGraph) {
  _.each(inputGraph.nodes(), function(node) {
    var inputLabel = node.label.dagre = {},
        layoutLabel = layoutGraph.getNode(node.v);

    inputLabel.x = layoutLabel.x;
    inputLabel.y = layoutLabel.y;
  });
}

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph) {
  var g = new Digraph();

  _.each(inputGraph.nodes(), function(node) {
    var label = node.label;
    g.setNode(node.v, {
      width: label.width,
      height: label.height
    });
  });

  _.each(inputGraph.edges(), function(edge) {
    var label = edge.label;
    g.setEdge(edge.v, edge.w, {
      minlen: label.minlen || 1,
      weight: label.weight || 1
    });
  });

  return g;
}
