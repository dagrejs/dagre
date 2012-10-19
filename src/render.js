/*
 * Renders the given graph to the given svg node.
 */
dagre.render = function(g, svg) {
  var arrowheads = {};
  var svgDefs = createSVGElement("defs");
  svg.appendChild(svgDefs);

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
