/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  // Minimum separation between adjacent nodes in the same rank
  defaultInt(g.attrs, "nodeSep", 50);

  // Minimum separation between edges in the same rank
  defaultInt(g.attrs, "edgeSep", 10);

  // Minimum separation between ranks
  defaultInt(g.attrs, "rankSep", 30);

  // Number of passes to take during the ordering phase to optimize layout
  defaultInt(g.attrs, "orderIters", 24);

  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    // Text label to display for the node
    defaultStr(attrs, "label", u.id().toString());
  });
}
