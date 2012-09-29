/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  var svg = createSVGElement("svg");
  document.documentElement.appendChild(svg);

  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    defaultStr(attrs, "label", u.id().toString());
    defaultInt(attrs, "width", 0);
    defaultInt(attrs, "height", 0);

    defaultInt(attrs, "weight", 1);

    defaultVal(attrs, "color", "#FFF");
    defaultVal(attrs, "fontname", "Times New Roman");
    defaultInt(attrs, "fontsize", 14);

    var text = createTextNode(u);
    svg.appendChild(text);

    var bbox = text.getBBox();
    attrs.width = Math.max(attrs.width, bbox.width);
    attrs.height = Math.max(attrs.height, bbox.height);
    svg.removeChild(text);
  });

  document.documentElement.removeChild(svg);
}
