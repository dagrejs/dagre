/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, graphAttrs, nodeAttrs, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

  function intersect(rect, point) {
    var x = rect.x;
    var y = rect.y;

    // For now we only support rectangles

    // Rectangle intersection algorithm from:
    // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
    var dx = point.x - x;
    var dy = point.y - y;
    var w = rect.width / 2;
    var h = rect.height / 2;

    var sx, sy;
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      // Intersection is top or bottom of rect.
      if (dy < 0) {
        h = -h;
      }
      sx = dy === 0 ? 0 : h * dx / dy;
      sy = h;
    } else {
      // Intersection is left or right of rect.
      if (dx < 0) {
        w = -w;
      }
      sx = w;
      sy = dx === 0 ? 0 : w * dy / dx;
    }

    return {x: x + sx, y: y + sy};
  }

  function createSVGElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function createLabel(id, label) {
    if (label[0] === '<') {
      return createHTMLLabel(id, label);
    } else {
      return createTextLabel(label);
    }
  }

  function createHTMLLabel(id, label) {
    var fo = createSVGElement("foreignObject");
    var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    div.innerHTML = label;
    var body = document.querySelector('body');

    // We use temp div to try to apply most styling before placing the HTML block
    var tempDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    tempDiv.setAttribute("id", "node-" + id);
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

  function createTextLabel(label) {
    var text = createSVGElement("text");
    text.setAttribute("x", 0);
    text.setAttribute("text-anchor", "middle");

    var lines = label.split("\\n");
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
    var dimensions = {};
    g.nodes().forEach(function(u) {
      var group = createSVGElement("g");
      group.setAttribute("id", "node-" + u);
      group.setAttribute("class", "node");
      svg.appendChild(group);

      var rect = createSVGElement("rect");
      var label = createLabel(u, nodeAttrs[u].label);

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
      dimensions[u] = { width: rectBBox.width, height: rectBBox.height };
    });
    return dimensions;
  }

  function drawEdges() {
    g.edges().forEach(function(e) {
      var path = createSVGElement("path");
      path.setAttribute("id", "edge-" + e);
      path.setAttribute("class", "edge");
      svg.appendChild(path);

      var pathStyle = window.getComputedStyle(path);
      var arrowhead = createArrowhead(pathStyle.stroke);

      path.setAttribute("style", ["marker-end: url(#" + arrowhead + ")"].join("; "));
    });
  }

  function positionNodes(coords) {
    keys(coords).forEach(function(u) {
      var group = svg.querySelector("#node-" + u);
      group.setAttribute("transform", "translate(" + coords[u].x + "," + coords[u].y + ")");
    });
  }

  function pointStr(point) {
    return point.x + "," + point.y;
  }

  function layoutEdges(g, coords, dimensions, points) {
    g.edges().forEach(function(e) {
      var path = svg.querySelector("#edge-" + e);
      var ps = points[e] || [];

      // TODO handle self loops

      var edge = g.edge(e);

      ps.push(intersect(toRect(edge.target, coords, dimensions), ps.length > 0 ? ps[ps.length - 1] : coords[edge.source]));
      var origin = intersect(toRect(edge.source, coords, dimensions), ps[0]);

      path.setAttribute("d", "M " + pointStr(origin) + " L " + ps.map(pointStr).join(" "));
    });
  }

  function toRect(u, coords, dimensions) {
    return {
      x: coords[u].x,
      y: coords[u].y,
      width: dimensions[u].width,
      height: dimensions[u].height
    };
  }

  var dimensions = drawNodes();
  drawEdges();

  var result = dagre.layout()
                    .apply(g, dimensions);

  positionNodes(result.coords);
  layoutEdges(g, result.coords, dimensions, result.points);
}
