// TODO: move intersect rect to render.util
var util = require("../util"),
    layout = require("../layout/layout");

module.exports = Renderer;

function Renderer() {
  this._layout = layout();
  this._drawNode = defaultDrawNode;
  this._drawEdgeLabel = defaultDrawEdgeLabel;
  this._drawEdge = defaultDrawEdge;
  this._postProcess = defaultPostProcess;
}

Renderer.prototype.layout = function(layout) {
  if (!arguments.length) { return this._layout; }
  this._layout = layout;
  return this;
};

Renderer.prototype.drawNode = function(drawNode) {
  if (!arguments.length) { return this._drawNode; }
  this._drawNode = drawNode;
  return this;
};

Renderer.prototype.drawEdgeLabel = function(drawEdgeLabel) {
  if (!arguments.length) { return this._drawEdgeLabel; }
  this._drawEdgeLabel = drawEdgeLabel;
  return this;
};

Renderer.prototype.drawEdge = function(drawEdge) {
  if (!arguments.length) { return this._drawEdge; }
  this._drawEdge = drawEdge;
  return this;
};

Renderer.prototype.postProcess = function(postProcess) {
  if (!arguments.length) { return this._postProcess; }
  this._postProcess = postProcess;
  return this;
};

Renderer.prototype.run = function(graph, svg) {
  // First copy the input graph so that it is not changed by the rendering
  // process.
  graph = copyAndInitGraph(graph);

  // Create node and edge roots, attach labels, and capture dimension
  // information for use with layout.
  var svgNodes = createNodeRoots(graph, svg);
  var svgEdges = createEdgeRoots(graph, svg);

  drawNodes(graph, this._drawNode, svgNodes);
  drawEdgeLabels(graph, this._drawEdgeLabel, svgEdges);
  
  // Now apply the layout function
  var result = runLayout(graph, this._layout);

  drawEdges(result, this._drawEdge, svgEdges);

  // Apply the layout information to the graph
  reposition(result, svgNodes, svgEdges);

  this._postProcess(result, svg);

  return result;
};

function copyAndInitGraph(graph) {
  var copy = graph.copy();

  // Init labels if they were not present in the source graph
  copy.nodes().forEach(function(u) {
    var value = copy.node(u);
    if (value === undefined) {
      value = {};
      copy.node(u, value);
    }
    if (!("label" in value)) { value.label = ""; }
  });

  copy.edges().forEach(function(e) {
    var value = copy.edge(e);
    if (value === undefined) {
      value = {};
      copy.edge(e, value);
    }
    if (!("label" in value)) { value.label = ""; }
  });

  return copy;
}

function createNodeRoots(graph, svg) {
  return svg
    .selectAll("g .node")
    .data(graph.nodes())
    .enter()
      .append("g")
      .classed("node", true);
}

function createEdgeRoots(graph, svg) {
  return svg
    .selectAll("g .edge")
    .data(graph.edges())
    .enter()
      .insert("g", "*")
      .classed("edge", true);
}

function drawNodes(graph, drawNode, roots) {
  roots
    .each(function(u) { drawNode(graph, u, d3.select(this)); })
    .each(function(u) { calculateDimensions(this, graph.node(u)); });
}

function drawEdgeLabels(graph, drawEdgeLabel, roots) {
  roots
    .append("g")
      .each(function(e) { drawEdgeLabel(graph, e, d3.select(this)); })
      .each(function(e) { calculateDimensions(this, graph.edge(e)); });
}

function drawEdges(graph, drawEdge, roots) {
  roots.each(function(e) { drawEdge(graph, e, d3.select(this)); });
}

function calculateDimensions(group, value) {
  var bbox = group.getBBox();
  value.width = bbox.width;
  value.height = bbox.height;
}

function runLayout(graph, layout) {
  var result = layout.run(graph);

  // Copy labels to the result graph
  graph.eachNode(function(u, value) { result.node(u).label = value.label; });
  graph.eachEdge(function(e, u, v, value) { result.edge(e).label = value.label; });

  return result;
}

function reposition(graph, svgNodes, svgEdges) {
  svgNodes
    .attr("transform", function(u) {
      var value = graph.node(u);
      return "translate(" + value.x + "," + value.y + ")";
    });

  svgEdges
    .selectAll("g .edge-label")
    .attr("transform", function(e) {
      var value = graph.edge(e);
      var point = findMidPoint(value.points);
      return "translate(" + point.x + "," + point.y + ")";
    });
}

function defaultDrawNode(graph, u, root) {
  // Rect has to be created before label so that it doesn't cover it!
  var label = root.append("g")
                  .attr("class", "label");
  addLabel(graph.node(u).label, label, 10, 10);
}

function defaultDrawEdgeLabel(graph, e, root) {
  var label = root
    .append("g")
      .attr("class", "edge-label");
  addLabel(graph.edge(e).label, label, 0, 0);
}

function defaultDrawEdge(graph, e, root) {
  root
    .insert("path", "*")
    .attr("marker-end", "url(#arrowhead)")
    .attr("d", function() {
      var value = graph.edge(e);
      var source = graph.node(graph.source(e));
      var target = graph.node(graph.target(e));
      var points = value.points;

      var p0 = points.length === 0 ? target : points[0];
      var p1 = points.length === 0 ? source : points[points.length - 1];

      points.unshift(util.intersectRect(source, p0));
      // TODO: use bpodgursky's shortening algorithm here
      points.push(util.intersectRect(target, p1));

      return d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("bundle")
        .tension(0.95)
        (points);
    });
}

function defaultPostProcess(graph, root) {
  if (graph.isDirected() && root.select("#arrowhead").empty()) {
    root
      .append("svg:defs")
        .append("svg:marker")
          .attr("id", "arrowhead")
          .attr("viewBox", "0 0 10 10")
          .attr("refX", 8)
          .attr("refY", 5)
          .attr("markerUnits", "strokewidth")
          .attr("markerWidth", 8)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .attr("style", "fill: #333")
          .append("svg:path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z");
  }
}

function addLabel(label, root, marginX, marginY) {
  // Add the rect first so that it appears behind the label
  var rect = root.append("rect");
  var labelSvg = root.append("g");

  if (label[0] === "<") {
    addForeignObjectLabel(label, labelSvg);
  } else {
    addTextLabel(label, labelSvg);
  }

  var bbox = root.node().getBBox();

  labelSvg.attr("transform",
             "translate(" + (-bbox.width / 2) + "," + (-bbox.height / 2) + ")");

  rect
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", -(bbox.width / 2 + marginX))
    .attr("y", -(bbox.height / 2 + marginY))
    .attr("width", bbox.width + 2 * marginX)
    .attr("height", bbox.height + 2 * marginY);
}

function addForeignObjectLabel(label, root) {
  // TODO implementation
}

function addTextLabel(label, root) {
  root
    .append("text")
    .attr("text-anchor", "left")
    .append("tspan")
      .attr("dy", "1em")
      .text(function() { return label; });
}

function findMidPoint(points) {
  var midIdx = points.length / 2;
  if (points.length % 2) {
    return points[Math.floor(midIdx)];
  } else {
    var p0 = points[midIdx - 1];
    var p1 = points[midIdx];
    return {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2};
  }
}
