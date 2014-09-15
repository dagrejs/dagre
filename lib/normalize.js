"use strict";

var _ = require("lodash"),
    util = require("./util");

module.exports = {
  run: run,
  undo: undo
};

/*
 * Breaks any long edges in the graph into short segments that span 1 layer
 * each. This operation is undoable with the denormalize function.
 *
 * Pre-conditions:
 *
 *    1. The input graph is a DAG.
 *    2. Each node in the graph has a "rank" property.
 *
 * Post-condition:
 *
 *    1. All edges in the graph have a length of 1.
 *    2. Dummy nodes are added where edges have been split into segments.
 */
function run(g) {
  _.each(g.edges(), function(edge) { normalizeEdge(g, edge); });
}

function normalizeEdge(g, e) {
  var v = e.v,
      vRank = g.getNode(v).rank,
      w = e.w,
      wRank = g.getNode(w).rank,
      name = e.name,
      edgeLabel = g.getEdge(e),
      labelRank = edgeLabel.labelRank;

  if (wRank === vRank + 1) return;

  g.removeEdge(e);

  var dummy, attrs;
  for (++vRank; vRank < wRank; ++vRank) {
    attrs = { width: 0, height: 0, edgeLabel: edgeLabel, rank: vRank };
    dummy = util.addDummyNode(g, "edge", attrs, "_d");
    if (vRank === labelRank) {
      attrs.width = edgeLabel.width;
      attrs.height = edgeLabel.height;
      attrs.dummy = "edge-label";
    }
    g.setEdge(v, dummy, { weight: edgeLabel.weight }, name);
    v = dummy;
  }

  g.setEdge(v, w, { weight: edgeLabel.weight }, name);
}

function undo(g) {
  _.each(g.nodes(), function(v) {
    var node = g.getNode(v);
    if (node.dummy === "edge" || node.dummy === "edge-label") {
      var inEdge = g.inEdges(v)[0],
          inEdgeLabel = g.getEdge(inEdge),
          outEdge = g.outEdges(v)[0],
          outEdgeLabel = g.getEdge(outEdge),
          label = _.clone(node.edgeLabel);
      label.points = _.compact(_.flatten([inEdgeLabel.points,
                                          { x: node.x, y: node.y },
                                          outEdgeLabel.points]));
      if (node.dummy === "edge-label") {
        label.x = node.x;
        label.y = node.y;
      }
      g.removeNode(v);
      g.setEdge(inEdge.v, outEdge.w, label, inEdge.name);
    }
  });
}
