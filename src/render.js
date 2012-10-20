/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

  function intersect(u, point) {
    var uAttrs = u.attrs;
    var x = uAttrs.x;
    var y = uAttrs.y;

    // For now we only support rectangles

    // Rectangle intersection algorithm from:
    // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
    var dx = point.x - x;
    var dy = point.y - y;
    var w = uAttrs.width / 2;
    var h = uAttrs.height / 2;

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

  function createLabel(node, x) {
    if(node.attrs.label[0] === '<') {
      return createHTMLLabel(node);
    } else {
      return createTextLabel(node, 0);
    }
  }

  function createHTMLLabel(node){
    var fo = createSVGElement("foreignObject");
    var div = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    div.innerHTML = node.attrs.label;
    var body = document.querySelector('body');

    // We use temp div to try to apply most styling before placing the HTML block
    var tempDiv = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    tempDiv.setAttribute("id", "node-" + node.id());
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

  function createTextLabel(node, x) {
    var text = createSVGElement("text");
    text.setAttribute("x", 0);
    text.setAttribute("text-anchor", "middle");

    var lines = node.attrs.label.split("\\n");
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
    g.nodes().forEach(function(u) {
      var group = createSVGElement("g");
      group.setAttribute("id", "node-" + u.id());
      group.setAttribute("class", "node");
      svg.appendChild(group);

      var rect = createSVGElement("rect");
      var label = createLabel(u);

      group.appendChild(rect);
      group.appendChild(label);

      var labelBBox = label.getBBox();

      rect.setAttribute("x", -(labelBBox.width / 2 + u.attrs.marginX));
      rect.setAttribute("y", -(labelBBox.height / 2 + u.attrs.marginY));
      rect.setAttribute("width", labelBBox.width + u.attrs.marginX * 2);
      rect.setAttribute("height", labelBBox.height + u.attrs.marginY * 2);

      label.setAttribute("x", -(labelBBox.width / 2));
      label.setAttribute("y", -(labelBBox.height / 2));

      var rectBBox = rect.getBBox();
      if (!("width" in u.attrs)) {
        u.attrs.width = rectBBox.width;
      }
      if (!("height" in u.attrs)) {
        u.attrs.height = rectBBox.height;
      }
    });
  }

  function drawEdges() {
    g.edges().forEach(function(e) {
      var path = createSVGElement("path");
      path.setAttribute("id", "edge-" + e.id());
      path.setAttribute("class", "edge");
      svg.appendChild(path);

      var pathStyle = window.getComputedStyle(path);
      var arrowhead = createArrowhead(pathStyle.stroke);

      path.setAttribute("style", ["marker-end: url(#" + arrowhead + ")"].join("; "));
    });
  }

  function positionNodes() {
    g.nodes().forEach(function(u) {
      var group = svg.querySelector("#node-" + u.id());
      group.setAttribute("transform", "translate(" + u.attrs.x + "," + u.attrs.y + ")");
    });
  }

  function pointStr(point) {
    return point.x + "," + point.y;
  }

  function layoutEdges() {
    g.edges().forEach(function(e) {
      var path = svg.querySelector("#edge-" + e.id());
      var points = e.attrs.points || [];

      // TODO handle self loops

      points.push(intersect(e.head(), points.length > 0 ? points[points.length - 1] : e.tail().attrs));
      var origin = intersect(e.tail(), points[0]);

      path.setAttribute("d", "M " + pointStr(origin) + " L " + points.map(pointStr).join(" "));
    });
  }

  dagre.preLayout(g);
  drawNodes();
  drawEdges();
  dagre.layout(g);
  positionNodes();
  layoutEdges();
}
