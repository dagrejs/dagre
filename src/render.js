/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(nodes, edges, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

  function createSVGElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function createLabel(u) {
    if (u.label[0] === '<') {
      return createHTMLLabel(u);
    } else {
      return createTextLabel(u);
    }
  }

  function createHTMLLabel(u) {
    var fo = createSVGElement("foreignObject");
    var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    div.innerHTML = u.label;
    var body = document.querySelector('body');

    // We use temp div to try to apply most styling before placing the HTML block
    var tempDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    tempDiv.setAttribute("id", "node-" + u.id);
    tempDiv.setAttribute("class", "node");
    tempDiv.appendChild(div);
    body.appendChild(tempDiv);

    tempDiv.setAttribute("style", "width:10;float:left;");
    fo.setAttribute("width", tempDiv.clientWidth);
    fo.setAttribute("height", tempDiv.clientHeight);

    // Clean up temp div
    body.removeChild(tempDiv);
    tempDiv.removeChild(div);

    fo.appendChild(div);
    return fo;
  }

  function createTextLabel(u) {
    var text = createSVGElement("text");
    text.setAttribute("x", 0);
    text.setAttribute("text-anchor", "middle");

    var lines = u.label.split("\\n");
    lines.forEach(function(line) {
      var tspan = createSVGElement("tspan");
      tspan.textContent = line;
      tspan.setAttribute("x", 0);
      tspan.setAttribute("dy", "1em");
      text.appendChild(tspan);
    });

    return text;
  }

  function createArrowhead(color) {
    colorId = color.replace(/[#() ,]/g, "_");
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
    nodes.forEach(function(u) {
      var group = createSVGElement("g");
      group.setAttribute("id", "node-" + u.id);
      group.setAttribute("class", "node");
      svg.appendChild(group);

      var rect = createSVGElement("rect");
      var label = createLabel(u);

      group.appendChild(rect);
      group.appendChild(label);

      var labelBBox = label.getBBox();

      rect.setAttribute("x", -(labelBBox.width / 2 + 5));
      rect.setAttribute("y", -(labelBBox.height / 2 + 5));
      rect.setAttribute("width", labelBBox.width + 5 * 2);
      rect.setAttribute("height", labelBBox.height + 5 * 2);

      label.setAttribute("x", -(labelBBox.width / 2));
      label.setAttribute("y", -(labelBBox.height / 2));

      var rectBBox = rect.getBBox();
      u.width = rectBBox.width;
      u.height = rectBBox.height;
    });
  }

  function drawEdges() {
    edges.forEach(function(e) {
      var path = createSVGElement("path");
      path.setAttribute("id", "edge-" + e.id);
      path.setAttribute("class", "edge");
      svg.appendChild(path);

      var pathStyle = window.getComputedStyle(path);
      var arrowhead = createArrowhead(pathStyle.stroke);

      path.setAttribute("style", ["marker-end: url(#" + arrowhead + ")"].join("; "));
    });
  }

  function positionNodes() {
    nodes.forEach(function(u) {
      var group = svg.querySelector("#node-" + u.id);
      group.setAttribute("transform", "translate(" + u.x + "," + u.y + ")");
    });
  }

  function layoutEdges() {
    edges.forEach(function(e) {
      var path = svg.querySelector("#edge-" + e.id);

      // TODO handle self loops
      if (e.source !== e.target) {
        var points = e.points;

        points.push(intersectRect(e.target, points.length > 0 ? points[points.length - 1] : e.source));
        var origin = intersectRect(e.source, points[0]);

        path.setAttribute("d", "M " + pointStr(origin) + " L " + points.map(pointStr).join(" "));
      }
    });
  }

  drawNodes();
  drawEdges();

  dagre.layout()
    .nodes(nodes)
    .edges(edges)
    .run();

  positionNodes();
  layoutEdges();
}
