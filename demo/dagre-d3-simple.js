
/*
 * Render a pure graphviz definition to the svg specified by svg selector.
 */
function renderDotToD3(graphDef, svgSelector) {
  var result = dagre.dot.toObjects(graphDef);
  renderObjsToD3({nodes: result.nodes, edges: result.edges}, svgSelector);
}

/*
 *  Render javascript edges and nodes to the svg.  This method should be more
 *  convenient when data was serialized as json and node definitions would be duplicated
 *  if edges had direct references to nodes.  See state-graph-js.html for example.
 */
function renderDagreToD3(nodeData, edgeData, svgSelector) {

  var nodeRefs = [];
  var edgeRefs = [];

  edgeData.forEach(function(e){
    edgeRefs.push({
      source: nodeData[e.source],
      target: nodeData[e.target],
      label: e.label,
      id: e.id
    });
  });

  for (var nodeKey in nodeData) {
    if (nodeData.hasOwnProperty(nodeKey)) {
      nodeRefs.push(nodeData[nodeKey]);
    }
  }

  renderObjsToD3({nodes: nodeRefs, edges: edgeRefs}, svgSelector);
}

/*
 *  Render javscript objects to svg, as produced by  dagre.dot.  See
 *  sentence-tokenization.html for example.
 */
function renderObjsToD3(graphData, svgSelector) {

  var nodeData = graphData.nodes;
  var edgeData = graphData.edges;

  var svg = d3.select(svgSelector);

  if (svg.select("#arrowhead").empty()) {
    console.log("appending marker");
    svg.append('svg:defs').append('svg:marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerUnits', 'strokewidth')
      .attr('markerWidth', 8)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .attr('style', 'fill: #333')
      .append('svg:path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');
  }

  svg.selectAll("g").remove();

  var svgGroup = svg.append("g");
  var nodes = svgGroup
    .selectAll("g .node")
    .data(nodeData);

  var nodeEnter = nodes
    .enter()
    .append("g")
    .attr("class", function (d) {
      if (d.nodeclass) {
        return "node " + d.nodeclass;
      } else {
        return "node";
      }
    })
    .attr("id", function (d) {
      return "node-" + d.id;
    })
    .each(function (d) {
      d.nodePadding = 10;
    });
  nodeEnter.append("rect");
  addLabels(nodeEnter);
  nodes.exit().remove();

  var edges = svgGroup
    .selectAll("g .edge")
    .data(edgeData);

  var edgeEnter = edges
    .enter()
    .append("g")
    .attr("class", "edge")
    .attr("id", function (d) {
      return "edge-" + d.id;
    })
    .each(function (d) {
      d.nodePadding = 0;
    });

  edgeEnter
    .append("path")
    .attr("marker-end", "url(#arrowhead)");
  addLabels(edgeEnter);
  edges.exit().remove();

  var labelGroup = svgGroup.selectAll("g.label");

  var foLabel = labelGroup
    .selectAll(".htmllabel")
    // TODO find a better way to get the dimensions for foriegnObjects
    .attr("width", "100000");

  foLabel
    .select("div")
    .html(function (d) {
      return d.label;
    })
    .each(function (d) {
      d.width = this.clientWidth;
      d.height = this.clientHeight;
      d.nodePadding = 0;
    });

  foLabel
    .attr("width", function (d) {
      return d.width;
    })
    .attr("height", function (d) {
      return d.height;
    });

  var textLabel = labelGroup
    .filter(function (d) {
      return d.label && d.label[0] !== "<";
    });

  textLabel
    .select("text")
    .attr("text-anchor", "left")
    .append("tspan")
    .attr("dy", "1em")
    .text(function (d) {
      return d.label;
    });

  labelGroup
    .each(function (d) {
      var bbox = this.getBBox();
      d.bbox = bbox;

      d.width = bbox.width + 2 * d.nodePadding;
      d.height = bbox.height + 2 * d.nodePadding;

    });

  // Add zoom behavior to the SVG canvas
  svgGroup.attr("transform", "translate(5, 5)");
  svg.call(d3.behavior.zoom().on("zoom", function redraw() {
    svgGroup.attr("transform",
      "translate(" + d3.event.translate + ")"
        + " scale(" + d3.event.scale + ")");
  }));

  // Run the actual layout
  dagre.layout()
    .nodes(nodeData)
    .edges(edgeData)
    .run();

  edgeEnter
    .selectAll("circle.cp")
    .data(function (d) {
      d.dagre.points.forEach(function (p) {
        p.parent = d;
      });
      return d.dagre.points.slice(0).reverse();
    })
    .enter()
    .append("circle")
    .attr("class", "cp");

  nodes
    .attr("transform", function (d) {
      return "translate(" + d.dagre.x + "," + d.dagre.y + ")";
    })
    .selectAll("g.node rect")
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", function (d) {
      return -(d.bbox.width / 2 + d.nodePadding);
    })
    .attr("y", function (d) {
      return -(d.bbox.height / 2 + d.nodePadding);
    })
    .attr("width", function (d) {
      return d.width;
    })
    .attr("height", function (d) {
      return d.height;
    });

  edges
    .selectAll("path")
    .attr("d", function (d) {
      var points = d.dagre.points.slice(0);
      points.unshift(dagre.util.intersectRect(d.source.dagre, points[0]));

      var preTarget = points[points.length - 2];
      var target = dagre.util.intersectRect(d.target.dagre, points[points.length - 1]);

      var deltaX = preTarget.x - target.x;
      var deltaY = preTarget.y - target.y;

      var m = 2 / Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

      points.push({
          x: target.x + m * deltaX,
          y: target.y + m * deltaY
        }
      );

      return d3.svg.line()
        .x(function (e) {
          return e.x;
        })
        .y(function (e) {
          return e.y;
        })
        .interpolate("bundle")
        .tension(.8)
        (points);
    });

  edges
    .selectAll("circle")
    .attr("r", 5)
    .attr("cx", function (d) {
      return d.x;
    })
    .attr("cy", function (d) {
      return d.y;
    });

  svgGroup
    .selectAll("g.label rect")
    .attr("x", function (d) {
      return -d.nodePadding;
    })
    .attr("y", function (d) {
      return -d.nodePadding;
    })
    .attr("width", function (d) {
      return d.width;
    })
    .attr("height", function (d) {
      return d.height;
    });

  nodes
    .selectAll("g.label")
    .attr("transform", function (d) {
      return "translate(" + (-d.bbox.width / 2) + "," + (-d.bbox.height / 2) + ")";
    });

  edges
    .selectAll("g.label")
    .attr("transform", function (d) {
      var points = d.dagre.points;

      if (points.length > 1) {
        var x = (points[0].x + points[1].x) / 2;
        var y = (points[0].y + points[1].y) / 2;
        return "translate(" + (-d.bbox.width / 2 + x) + "," + (-d.bbox.height / 2 + y) + ")";
      } else {
        return "translate(" + (-d.bbox.width / 2 + points[0].x) + "," + (-d.bbox.height / 2 + points[0].y) + ")";
      }
    });
}

function addLabels(selection) {

  var labelGroup = selection
    .append("g")
    .attr("class", "label");
  labelGroup.append("rect");

  var foLabel = labelGroup
    .filter(function (d) {
      return d.label && d.label[0] === "<";
    })
    .append("foreignObject")
    .attr("class", "htmllabel");

  foLabel
    .append("xhtml:div")
    .style("float", "left");

  labelGroup
    .filter(function (d) {
      return d.label && d.label[0] !== "<";
    })
    .append("text")
}