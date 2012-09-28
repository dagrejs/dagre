/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g) {
  var svg = createSVGElement("svg");
  document.documentElement.appendChild(svg);

  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    attrs.label = "label" in attrs ? attrs.label.toString() : u.id().toString();
    attrs.width = "width" in attrs ? parseInt(attrs.width) : 0;
    attrs.height = "height" in attrs ? parseInt(attrs.height) : 0;

    if (!("color" in attrs)) { attrs.color = "#FFF"; }
    if (!("fontname" in attrs)) { attrs.fontname = "Times New Roman"; }
    attrs.fontsize = "fontsize" in attrs ? parseInt(attrs.fontsize) : 14;

    var text = createTextNode(u);
    svg.appendChild(text);

    var bbox = text.getBBox();
    attrs.width = Math.max(attrs.width, bbox.width);
    attrs.height = Math.max(attrs.height, bbox.height);
    svg.removeChild(text);
  });

  document.documentElement.removeChild(svg);
}
