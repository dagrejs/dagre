function createSVGElement(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/*
 * Performs some of the common rendering that is used by both preLayout and
 * render.
 */
function createTextNode(node, x) {
  var fontSize = node.attrs.fontsize;
  var text = createSVGElement("text");
  text.setAttribute("font-family", node.attrs.fontname);
  text.setAttribute("font-size", fontSize);
  text.setAttribute("text-anchor", "middle");

  var firstLine = true;
  var lines = node.attrs.label.split("\n");
  lines.forEach(function(line) {
    var tspan = createSVGElement("tspan");
    tspan.textContent = line;
    if (!firstLine) {
      tspan.setAttribute("x", x || 0);
      tspan.setAttribute("dy", "1em");
    }
    text.appendChild(tspan);
    firstLine = false;
  });

  // TODO This constant yields consistently better vertical centering. I
  // suspect it is related to vertical spacing, but I don't know where to get
  // the appropriate value programmatically.
  var adjustConstant = 2;
  text.setAttribute("y", fontSize - adjustConstant - (fontSize * lines.length / 2));

  return text;
}
