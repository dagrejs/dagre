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

function normalizeEdge(g, edge) {
  var v = edge.v,
      vRank = g.getNode(v).rank,
      w = edge.w,
      wRank = g.getNode(w).rank;

  if (wRank === vRank + 1) return;

  g.removeEdge(v, w);

  var dummy;
  for (++vRank; vRank < wRank; ++vRank) {
    dummy = util.addDummyNode(g);
    dummy.label.rank = vRank;
    g.setEdge(v, dummy.v);
    v = dummy.v;
  }

  g.setEdge(v, w);
}

function undo(g) {
  _.each(g.nodes(), function(node) {
    var label = node.label;
    if (label.dummy) {
      var v = node.v,
          u = g.predecessors(v)[0],
          w = g.successors(v)[0];
      g.removeNode(v);
      g.setEdge(u, w);
    }
  });
}
