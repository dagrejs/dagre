dagre.layout = function() {
  // External configuration
  var
      // Nodes to lay out. At minimum must have `width` and `height` attributes.
      nodes = [],
      // Edges to lay out. At mimimum must have `source` and `target` attributes.
      edges = [],
      // Min separation between adjacent nodes in the same rank.
      nodeSep = 50,
      // Min separation between adjacent edges in the same rank.
      edgeSep = 10,
      // Min separation between ranks.
      rankSep = 30,
      // Number of passes to take during the ordering phase.
      orderIters = 24,
      // Debug positioning with a particular direction (up-left, up-right, down-left, down-right).
      posDir = null;

  // Internal state
  var
      // Graph used to determine relationships quickly
      g,
      // Map to original nodes using graph ids
      nodeMap,
      // Map to original edges using graph ids
      edgeMap;

  // This layout object
  var layout = {};

  layout.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    return layout;
  }

  layout.edges = function(x) {
    if (!arguments.length) return edges;
    edges = x;
    return layout;
  }

  layout.nodeSep = function(x) {
    if (!arguments.length) return nodeSep;
    nodeSep = x;
    return layout;
  }

  layout.edgeSep = function(x) {
    if (!arguments.length) return edgeSep;
    edgeSep = x;
    return layout;
  }

  layout.rankSep = function(x) {
    if (!arguments.length) return rankSep;
    rankSep = x;
    return layout;
  }

  layout.orderIters = function(x) {
    if (!arguments.length) return orderIters;
    orderIters = x;
    return layout;
  }

  layout.posDir = function(x) {
    if (!arguments.length) return posDir;
    posDir = x;
    return layout;
  }

  layout.run = function() {
    // Build internal graph
    init();

    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    dagre.layout.rank(g, nodeMap, edgeMap);
    addDummyNodes();
    var layering = dagre.layout.order(g, orderIters, nodeMap);
    dagre.layout.position(g, layering, nodeMap, rankSep, nodeSep, edgeSep, posDir);
    collapseDummyNodes();

    resetInternalState();
  };

  function resetInternalState() {
    g = dagre.graph();
    nodeMap = {};
    edgeMap = {};
  }

  // Build graph and save mapping of generated ids to original nodes and edges
  function init() {
    resetInternalState();

    var nextId = 0;

    // Tag each node so that we can properly represent relationships when
    // we add edges. Also copy relevant dimension information.
    nodes.forEach(function(u) {
      var id = nextId++;
      nodeMap[id] = u.dagre = { id: id, width: u.width, height: u.height };
      g.addNode(id);
    });

    edges.forEach(function(e) {
      var source = e.source.dagre.id;
      if (!(source in nodeMap)) {
        throw new Error("Source node for '" + e + "' not in node list");
      }

      var target = e.target.dagre.id;
      if (!(target in nodeMap)) {
        throw new Error("Target node for '" + e + "' not in node list");
      }

      // Track edges that aren't self loops - layout does nothing for self
      // loops, so they can be skipped.
      if (source !== target) {
        var id = nextId++;
        // TODO should we use prototypal inheritance for this?
        edgeMap[id] = e.dagre = {
          points: [],
          source: nodeMap[source],
          target: nodeMap[target],
        };
        if (e.minLen) {
          e.dagre.minLen = e.minLen;
        }
        g.addEdge(id, source, target);
      }
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function addDummyNodes() {
    g.edges().forEach(function(e) {
      var edge = g.edge(e);
      var sourceRank = nodeMap[edge.source].rank;
      var targetRank = nodeMap[edge.target].rank;
      var delta = sourceRank < targetRank ? 1 : -1;
      if (sourceRank + delta !== targetRank) {
        var prefix = "D-" + e + "-";
        g.delEdge(e);
        for (var u = edge.source, rank = sourceRank + delta, i = 0; rank !== targetRank; rank += delta, ++i) {
          var v = prefix + rank;
          g.addNode(v);
          nodeMap[v] = { width: 0,
                         height: 0,
                         edge: e,
                         index: i,
                         rank: rank,
                         dummy: true };
          g.addEdge(u + " -> " + v, u, v);
          u = v;
        }
        g.addEdge(u + " -> " + edge.target, u, edge.target);
      }
    });
  }

  function collapseDummyNodes() {
    var visited = {};

    values(nodeMap).forEach(function(u) {
      if (u.dummy) {
        var e = u.edge;
        var points = edgeMap[e].points;
        points[u.index] = { x: u.x, y: u.y };
      }
    });
  }

  return layout;
}
