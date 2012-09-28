/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var _padding = 5;

  g.nodes().forEach(function(u) {
    var group = createSVGElement("g");
    svg.appendChild(group);

    var x = u.attrs.x;
    var y = u.attrs.y;
    group.setAttribute("transform", "translate(" + x + "," + y + ")");

    var rect = createSVGElement("rect");
    rect.setAttribute("x", -(_padding + u.attrs.width / 2));
    rect.setAttribute("y",  -(_padding + u.attrs.height / 2));
    rect.setAttribute("width", u.attrs.width + 2 * _padding);
    rect.setAttribute("height", u.attrs.height + 2 * _padding);
    rect.setAttribute("rx", "5");
    rect.setAttribute("style", ["fill: " + u.attrs.color,
                                "stroke-width: 1.5px",
                                "stroke: black"].join("; "));
    group.appendChild(rect);

    var text = createTextNode(u);
    group.appendChild(text);
  });
}
