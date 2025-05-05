import * as dagre from 'dagre';
import * as d3 from 'd3';
import * as v from "./graphVariants.js";

// Create a new directed graph
const g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({
  rankdir: 'LR',
  nodesep: 50,
  edgesep: 10,
  ranksep: 75,
});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(() => ({}));

// change variant to what I want to test
const variant = v.variant1to4;

// Add nodes to the graph
variant.nodes.forEach(node => {
  g.setNode(node.id, {
    label: node.label,
    width: node.width,
    height: node.height
  });
});

// Add edges to the graph
variant.edges.forEach((edge, i) => {
  g.setEdge(edge.source, edge.target, {
    weight: edge.weight || 1,
    minlen: 1, // Default minimum length
    id: `e${i}`  // Generate a unique ID for each edge
  });
});

// Calculate layout (this assigns positions to nodes)
dagre.layout(g);

visualizeGraph(g, false);

function visualizeGraph(g, log) {
  if (log) {
    // Display the graph info in the console for testing
    console.log("Graph layout complete");
    console.log("Nodes:", g.nodes().map(n => {
      const node = g.node(n);
      return {
        id: n,
        label: node.label,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height
      };
    }));

    console.log("Edges:", g.edges().map(e => {
      const edge = g.edge(e);
      return {
        source: e.v,
        target: e.w,
        points: edge.points
      };
    }));
  }
  // Visualize the graph using D3.js
  const graphDiv = document.getElementById('graph');
  graphDiv.innerHTML = ''; // Clear any existing content

  // Create an SVG element
  const svg = d3.select('#graph')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .append('g');

  // Create a group for the entire graph
  const graphGroup = svg.append('g');

  // Add zoom behavior
  const zoom = d3.zoom()
    .on('zoom', (event) => {
      graphGroup.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Center the graph initially
  const graphWidth = g.graph().width || 1200;
  const graphHeight = g.graph().height || 800;
  const containerWidth = graphDiv.clientWidth;
  const containerHeight = graphDiv.clientHeight;
  const initialScale = 0.75;

  // Initial transform to center the graph
  svg.call(
    zoom.transform,
    d3.zoomIdentity
      .translate((containerWidth - graphWidth * initialScale) / 2, (containerHeight - graphHeight * initialScale) / 2)
      .scale(initialScale)
  );

  // Add edges as paths with arrow markers
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 9)
    .attr('refY', 5)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#999');

  // Add edges to the visualization
  g.edges().forEach(e => {
    const edge = g.edge(e);
    const points = edge.points || [];

    if (points.length > 0) {
      // Create a path generator
      const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis);

      // Add the edge path
      graphGroup.append('g')
        .attr('class', 'edge')
        .append('path')
        .attr('d', lineGenerator(points))
        .attr('marker-end', 'url(#arrowhead)');
    }
  });

  // Add nodes to the visualization
  g.nodes().forEach(v => {
    const node = g.node(v);

    // Node group
    const nodeGroup = graphGroup.append('g')
      .attr('class', 'node')
      .attr('transform', `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`);

    // Node rectangle
    nodeGroup.append('rect')
      .attr('width', node.width)
      .attr('height', node.height)
      .attr('rx', 5)
      .attr('ry', 5);

    // Node label
    nodeGroup.append('text')
      .attr('x', node.width / 2)
      .attr('y', node.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(node.label);
  });
}