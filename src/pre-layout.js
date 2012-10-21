/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    // Text label to display for the node
    defaultStr(attrs, "label", u.id().toString());
  });
}
