/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  function _appendMarkers() {
    var svgDefs = createSVGElement("defs");
    svg.appendChild(svgDefs);

    var arrowMarker = createSVGElement("marker");
    var arrowAttrs = {
      id: "arrowhead",
      viewBox: "0 0 10 10",
      refX: 8,
      refY: 5,
      markerUnits: "strokeWidth",
      markerWidth: 8,
      markerHeight: 5,
      orient: "auto"
    };
    Object.keys(arrowAttrs).forEach(function(k) {
      arrowMarker.setAttribute(k, arrowAttrs[k]);
    });
    svgDefs.appendChild(arrowMarker);

    var path = createSVGElement("path");
    path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    arrowMarker.appendChild(path);
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
      rect.setAttribute("style", ["fill: " + u.attrs.color,
                                  "stroke-width: " + u.attrs.strokewidth,
                                  "stroke: black"].join("; "));
      group.appendChild(rect);

      var text = createTextNode(u);
      group.appendChild(text);
    });
  }

  function _renderEdges() {
    g.edges().forEach(function(e) {
      var path = createSVGElement("path");
      path.setAttribute("d", e.attrs.path);
      path.setAttribute("style", ["fill: none",
                                  "stroke-width: 1.5px",
                                  "stroke: black",
                                  "marker-end: url(#arrowhead)"].join("; "));
      svg.appendChild(path);
    });
  }

  _appendMarkers();
  _renderNodes();
  _renderEdges();
}
