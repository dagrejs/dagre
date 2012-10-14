/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  var svg = createSVGElement("svg");
  document.documentElement.appendChild(svg);

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

    // Minimum width for the node. The node will automatically be expanded if
    // it needs more space to enclose its label.
    defaultInt(attrs, "width", 0);

    // Minimum height for the node. The node will automatically be expanded if
    // it needs more space to enclose its label.
    defaultInt(attrs, "height", 0);

    // The amount of padding to add to the label when sizing the node
    defaultInt(attrs, "marginX", 5);

    // The amount of padding to add to the label when sizing the node
    defaultInt(attrs, "marginY", 5);

    // The width of the stroke used to build the shape for the node
    defaultFloat(attrs, "strokeWidth", 1.5);

    // The color to use for the stroke of the shape
    defaultVal(attrs, "color", "#333");

    // The color used to fill the interior of the node's shape
    defaultVal(attrs, "fill", "#fff");

    // The color to use for the text in the shape
    defaultVal(attrs, "fontColor", "#333");

    // The font to use for the node's label
    defaultVal(attrs, "fontName", "Times New Roman");

    // The font size to use for the node's label
    defaultInt(attrs, "fontSize", 14);

    var text = createTextNode(u);
    svg.appendChild(text);

    var bbox = text.getBBox();
    attrs.width = Math.max(attrs.width, bbox.width);
    attrs.height = Math.max(attrs.height, bbox.height);
    svg.removeChild(text);
  });

  g.edges().forEach(function(e) {
    var attrs = e.attrs;

    // The width to use for the edge's line
    defaultFloat(attrs, "strokeWidth", 1.5);

    // The color to use for the edge's line
    defaultStr(attrs, "color", "#333");
  });

  document.documentElement.removeChild(svg);
}
