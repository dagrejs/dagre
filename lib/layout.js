// NOTE: This is not yet working, it's a stub.

var _ = require("lodash"),
    acyclic = require("./acyclic"),
    normalize = require("./normalize"),
    rank = require("./rank"),
    order = require("./order"),
    position = require("./position"),
    Graph = require("graphlib").Graph;

module.exports = layout;

function layout(g) {
  var layoutGraph = buildLayoutGraph(g);
  runLayout(layoutGraph);
  updateInputGraph(g, layoutGraph);
}

function runLayout(g) {
  acyclic.run(g);
  rank(g, g.getGraph("ranker"));
  normalize.run(g);
  order(g);
  position(g);
  normalize.undo(g);
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(inputGraph, layoutGraph) {
  _.each(inputGraph.nodes(), function(v) {
    var inputLabel = inputGraph.getNode(v),
        layoutLabel = layoutGraph.getNode(v);

    inputLabel.x = layoutLabel.x;
    inputLabel.y = layoutLabel.y;
  });
}

var graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"],
    nodeNumAttrs = ["width", "height"],
    edgeNumAttrs = ["minlen", "weight"],
    edgeDefaults = { minlen: 1, weight: 1 };

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph) {
  var g = new Graph().setGraph();

  g.setGraph(selectNumberAttrs(inputGraph.getGraph(), graphNumAttrs));

  _.each(inputGraph.nodes(), function(v) {
    var label = inputGraph.getNode(v);
    g.setNode(v, selectNumberAttrs(label, nodeNumAttrs));
  });

  _.each(inputGraph.edges(), function(e) {
    var label = inputGraph.getEdge(e);
    g.setEdge(e.v, e.w, _.defaults(selectNumberAttrs(label, edgeNumAttrs), edgeDefaults));
  });

  return g;
}

function selectNumberAttrs(obj, attrs) {
  return _.mapValues(_.pick(obj, attrs), Number);
}
