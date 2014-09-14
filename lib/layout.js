"use strict";

var _ = require("lodash"),
    acyclic = require("./acyclic"),
    normalize = require("./normalize"),
    rank = require("./rank"),
    normalizeRanks = require("./util").normalizeRanks,
    removeEmptyRanks = require("./util").removeEmptyRanks,
    nestingGraph = require("./nesting-graph"),
    order = require("./order"),
    position = require("./position"),
    util = require("./util"),
    Graph = require("graphlib").Graph;

module.exports = layout;

function layout(g, opts) {
  var time = opts && opts.debugTiming ? util.time : util.notime;
  time("layout", function() {
    var layoutGraph = time("  buildLayoutGraph",
                               function() { return buildLayoutGraph(g); });
    time("  runLayout",        function() { runLayout(layoutGraph, time); });
    time("  updateInputGraph", function() { updateInputGraph(g, layoutGraph); });
  });
}

function runLayout(g, time) {
  time("    makeSpaceForEdgeLabels", function() { makeSpaceForEdgeLabels(g); });
  time("    acyclic",                function() { acyclic.run(g); });
  time("    nestingGraph.run",       function() { nestingGraph.run(g); });
  time("    rank",                   function() { rank(util.asNonCompoundGraph(g)); });
  time("    nestingGraph.cleanup",   function() { nestingGraph.cleanup(g); });
  time("    removeEmptyRanks",       function() { removeEmptyRanks(g); });
  time("    normalizeRanks",         function() { normalizeRanks(g); });
  time("    normalize.run",          function() { normalize.run(g); });
  time("    order",                  function() { order(g); });
  time("    position",               function() { position(g); });
  time("    removeBorderNodes",      function() { removeBorderNodes(g); });
  time("    normalize.undo",         function() { normalize.undo(g); });
  time("    assignNodeIntersects",   function() { assignNodeIntersects(g); });
  time("    reversePoints",          function() { reversePointsForReversedEdges(g); });
  time("    acyclic.undo",           function() { acyclic.undo(g); });
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

    if (inputLabel) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
    }
  });

  _.each(inputGraph.edges(), function(e) {
    var inputLabel = inputGraph.getEdge(e),
        layoutLabel = layoutGraph.getEdge(e);

    inputLabel.points = layoutLabel.points;
  });
}

var graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"],
    graphDefaults = { ranksep: 50 },
    graphAttrs = ["ranker", "rankdir"],
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
  var g = new Graph({ multigraph: true, compound: true });

  g.setGraph(_.merge({},
    graphDefaults,
    selectNumberAttrs(inputGraph.getGraph(), graphNumAttrs),
    _.pick(inputGraph.getGraph(), graphAttrs)));

  _.each(inputGraph.nodes(), function(v) {
    var label = inputGraph.getNode(v);
    g.setNode(v, selectNumberAttrs(label, nodeNumAttrs));
    g.setParent(v, inputGraph.getParent(v));
  });

  _.each(inputGraph.edges(), function(e) {
    var label = inputGraph.getEdge(e);
    g.setEdge(e, _.defaults(selectNumberAttrs(label, edgeNumAttrs), edgeDefaults));
  });

  return g;
}

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 */
function makeSpaceForEdgeLabels(g) {
  var graphLabel = g.getGraph();
  graphLabel.ranksep /= 2;
  _.each(g.edges(), function(e) {
    g.getEdge(e).minlen *= 2;
  });
}

function assignNodeIntersects(g) {
  _.each(g.edges(), function(e) {
    var edge = g.getEdge(e),
        nodeV = g.getNode(e.v),
        nodeW = g.getNode(e.w),
        p1, p2;
    if (!edge.points) {
      edge.points = [];
      p1 = nodeW;
      p2 = nodeV;
    } else {
      p1 = edge.points[0];
      p2 = edge.points[edge.points.length - 1];
    }
    edge.points.unshift(util.intersectRect(nodeV, p1));
    edge.points.push(util.intersectRect(nodeW, p2));
  });
}

function reversePointsForReversedEdges(g) {
  _.each(g.edges(), function(e) {
    var edge = g.getEdge(e);
    if (edge.reversed) {
      edge.points.reverse();
    }
  });
}

function removeBorderNodes(g) {
  _.each(g.nodes(), function(v) {
    if (g.getNode(v).dummy === "border") {
      g.removeNode(v);
    }
  });
}

function selectNumberAttrs(obj, attrs) {
  return _.mapValues(_.pick(obj, attrs), Number);
}
