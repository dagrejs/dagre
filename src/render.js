/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var _padding = 5;

  function _createSVGElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  g.nodes().forEach(function(u) {
    var group = _createSVGElement("g");
    svg.appendChild(group);

    var x = u.attrs.x - (u.attrs.width / 2) - _padding;
    var y = u.attrs.y - (u.attrs.height / 2) - _padding;
    group.setAttribute("transform", "translate(" + x + "," + y + ")");

    var rect = _createSVGElement("rect");
    rect.setAttribute("y",  -_padding);
    rect.setAttribute("width", u.attrs.width + 2 * _padding);
    rect.setAttribute("height", u.attrs.height + 2 * _padding);
    rect.setAttribute("rx", "5");
    rect.setAttribute("style", ["fill: " + u.attrs.color,
                                "stroke-width: 1.5px",
                                "stroke: black"].join("; "));
    group.appendChild(rect);

    var text = _createSVGElement("text");
    text.textContent = u.attrs.label;
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("x", _padding + u.attrs.width / 2);
    text.setAttribute("y", _padding + u.attrs.height / 2);
    group.appendChild(text);
  });
}
