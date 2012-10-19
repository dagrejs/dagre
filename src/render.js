/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

  function createArrowhead(color) {
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

  function drawNodes() {
    g.nodes().forEach(function(u) {
      var group = createSVGElement("g");
      group.setAttribute("id", "node-" + u.id());

      var rect = createSVGElement("rect");
      rect.setAttribute("x", -(u.attrs.marginX + u.attrs.width / 2 + u.attrs.strokeWidth / 2));
      rect.setAttribute("y",  -(u.attrs.marginY + u.attrs.height / 2 + u.attrs.strokeWidth / 2));
      rect.setAttribute("width", u.attrs.width + 2 * u.attrs.marginX + u.attrs.strokeWidth);
      rect.setAttribute("height", u.attrs.height + 2 * u.attrs.marginY + u.attrs.strokeWidth);
      rect.setAttribute("style", ["fill: " + u.attrs.fill,
                                  "stroke-width: " + u.attrs.strokeWidth,
                                  "stroke: " + u.attrs.color].join("; "));
      group.appendChild(rect);

      var svgNode = createSVGNode(u);
      if(svgNode.nodeName === "foreignObject") {
        svgNode.setAttribute("x", -(u.attrs.width / 2 + u.attrs.strokeWidth / 2));
        svgNode.setAttribute("y",  -(u.attrs.height / 2 + u.attrs.strokeWidth / 2));
        svgNode.setAttribute("width", u.attrs.width);
        svgNode.setAttribute("height", u.attrs.height);
      }
      group.appendChild(svgNode);
      svg.appendChild(group);
    });
  }

  function drawEdges() {
    g.edges().forEach(function(e) {
      var path = createSVGElement("path");
      path.setAttribute("id", "edge-" + e.id());

      var arrowhead = createArrowhead(e.attrs.color);

      path.setAttribute("style", ["fill: none",
                                  "stroke-width: " + e.attrs.strokeWidth,
                                  "stroke: " + e.attrs.color,
                                  "marker-end: url(#" + arrowhead + ")"].join("; "));
      svg.appendChild(path);
    });
  }

  function positionNodes() {
    g.nodes().forEach(function(u) {
      var group = svg.querySelector("#node-" + u.id());
      group.setAttribute("transform", "translate(" + u.attrs.x + "," + u.attrs.y + ")");
    });
  }

  function layoutEdges() {
    g.edges().forEach(function(e) {
      var path = svg.querySelector("#edge-" + e.id());
      var points = e.attrs.points.split(" ");
      if (e.attrs.type === "line") {
        path.setAttribute("d", "M " + points[0] + " L " + points.slice(1).join(" "));
      } else if (e.attrs.type === "curve") {
        path.setAttribute("d", "M " + points[0] + " C " + points.slice(1).join(" "));
      }
    });
  }

  dagre.preLayout(g);
  drawNodes();
  drawEdges();
  dagre.layout(g);
  positionNodes();
  layoutEdges();
}
