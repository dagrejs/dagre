/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

  function _createArrowhead(color) {
    colorId = color.replace(/#/, "");
    if (!(colorId in arrowheads)) {
      var name = "arrowhead-" + colorId;
      arrowheads[colorId] = name;
      var arrowMarker = createSVGElement("marker");
      var arrowAttrs = {
        id: name,
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerUnits: "strokeWidth",
        markerWidth: 8,
        markerHeight: 5,
        orient: "auto",
        style: "fill: " + color
      };
      Object.keys(arrowAttrs).forEach(function(k) {
        arrowMarker.setAttribute(k, arrowAttrs[k]);
      });
      svgDefs.appendChild(arrowMarker);

      var path = createSVGElement("path");
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      arrowMarker.appendChild(path);
    }
    return arrowheads[colorId];
  }

  function _renderNodes() {
    g.nodes().forEach(function(u) {
      var group = createSVGElement("g");
      svg.appendChild(group);

      var x = u.attrs.x;
      var y = u.attrs.y;
      group.setAttribute("transform", "translate(" + x + "," + y + ")");

      var rect = createSVGElement("rect");
      rect.setAttribute("x", -(u.attrs.marginX + u.attrs.width / 2 + u.attrs.strokewidth / 2));
      rect.setAttribute("y",  -(u.attrs.marginY + u.attrs.height / 2 + u.attrs.strokewidth / 2));
      rect.setAttribute("width", u.attrs.width + 2 * u.attrs.marginX + u.attrs.strokewidth);
      rect.setAttribute("height", u.attrs.height + 2 * u.attrs.marginY + u.attrs.strokewidth);
      rect.setAttribute("style", ["fill: " + u.attrs.fill,
                                  "stroke-width: " + u.attrs.strokewidth,
                                  "stroke: " + u.attrs.color].join("; "));
      group.appendChild(rect);

      var text = createTextNode(u);
      group.appendChild(text);
    });
  }

  function _renderEdges() {
    g.edges().forEach(function(e) {
      var path = createSVGElement("path");
      var arrowhead = _createArrowhead(e.attrs.color);

      var points = e.attrs.points.split(" ");
      if (e.attrs.type === "line") {
        path.setAttribute("d", "M " + points[0] + " L " + points.slice(1).join(" "));
      } else if (e.attrs.type === "curve") {
        path.setAttribute("d", "M " + points[0] + " C " + points.slice(1).join(" "));
      }
      path.setAttribute("style", ["fill: none",
                                  "stroke-width: " + e.attrs.strokewidth,
                                  "stroke: " + e.attrs.color,
                                  "marker-end: url(#" + arrowhead + ")"].join("; "));
      svg.appendChild(path);
    });
  }

  _renderNodes();
  _renderEdges();
}
