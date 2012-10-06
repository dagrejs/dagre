/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  var svg = createSVGElement("svg");
  document.documentElement.appendChild(svg);

  defaultInt(g.attrs, "nodeSep", 50);

  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    defaultStr(attrs, "label", u.id().toString());
    defaultInt(attrs, "width", 0);
    defaultInt(attrs, "height", 0);
    defaultInt(attrs, "marginX", 10);
    defaultInt(attrs, "marginY", 10);
    defaultFloat(attrs, "strokeWidth", 1.5);

    defaultInt(attrs, "weight", 1);

    defaultVal(attrs, "color", "#333");
    defaultVal(attrs, "fontColor", "#333");
    defaultVal(attrs, "fill", "#fff");
    defaultVal(attrs, "fontName", "Times New Roman");
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

    defaultStr(attrs, "color", "#333");

    defaultFloat(attrs, "strokeWidth", 1.5);
  });

  document.documentElement.removeChild(svg);
}
