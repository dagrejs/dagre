/*
 * Pre-layout transforms such as determining the dimensions for each node in
 * the graph. This node requires access to a DOM (via `document`).
 */
dagre.preLayout = function(g, svg) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.documentElement.appendChild(svg);

  g.nodes().forEach(function(u) {
    var attrs = u.attrs;

    attrs.label = "label" in attrs ? attrs.label.toString() : u.id().toString();
    attrs.width = "width" in attrs ? parseInt(attrs.width) : 0;
    attrs.height = "height" in attrs ? parseInt(attrs.height) : 0;

    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = u.attrs.label;
    svg.appendChild(text);

    var bbox = text.getBBox();
    attrs.width = Math.max(attrs.width, bbox.width);
    attrs.height = Math.max(attrs.height, bbox.height);
    svg.removeChild(text);
  });

  document.documentElement.removeChild(svg);
}
