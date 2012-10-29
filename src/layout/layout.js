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
      posDir = null,
      // How much debug information to include?
      debugLevel = 0;

  // Phase functions
  var
      rank = dagre.layout.rank(),
      order = dagre.layout.order(),
      position = dagre.layout.position();

  // This layout object
  var self = {};

  self.nodes = function(x) {
    if (!arguments.length) return nodes;
    nodes = x;
    return self;
  };

  self.edges = function(x) {
    if (!arguments.length) return edges;
    edges = x;
    return self;
  };

  self.orderIters = function(x) {
    if (!arguments.length) return order.iterations();
    order.iterations(x);
    return self;
  }

  self.nodeSep = function(x) {
    if (!arguments.length) return position.nodeSep();
    position.nodeSep(x);
    return self;
  };

  self.edgeSep = function(x) {
    if (!arguments.length) return position.edgeSep();
    position.edgeSep(x);
    return self;
  }

  self.rankSep = function(x) {
    if (!arguments.length) return position.rankSep();
    position.rankSep(x);
    return self;
  }

  self.posDir = function(x) {
    if (!arguments.length) return position.direction();
    position.direction(x);
    return self;
  }

  self.debugLevel = function(x) {
    if (!arguments.length) return debugLevel;
    debugLevel = x;
    rank.debugLevel(x);
    order.debugLevel(x);
    position.debugLevel(x);
    return self;
  }

  self.run = function() {
    var timer = createTimer();
    
    // Build internal graph
    var g = init();

    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    // Reverse edges to get an acyclic graph, we keep the graph in an acyclic
    // state until the very end.
    acyclic(g);

    // Determine the rank for each node. Nodes with a lower rank will appear
    // above nodes of higher rank.
    rank.run(g);

    // Normalize the graph by ensuring that every edge is proper (each edge has
    // a length of 1). We achieve this by adding dummy nodes to long edges,
    // thus shortening them.
    normalize(g);

    // Order the nodes so that edge crossings are minimized.
    order.run(g);

    // Find the x and y coordinates for every node in the graph.
    position.run(g);

    // De-normalize the graph by removing dummy nodes and augmenting the
    // original long edges with coordinate information.
    undoNormalize(g);

    // Reverse edges that were revered previously to get an acyclic graph.
    undoAcyclic(g);

    if (debugLevel >= 1) {
      console.log("Total layout time: " + timer.elapsedString());
    }
  };

  return self;

  // Build graph and save mapping of generated ids to original nodes and edges
  function init() {
    var g = dagre.graph();

    var nextId = 0;

    // Tag each node so that we can properly represent relationships when
    // we add edges. Also copy relevant dimension information.
    nodes.forEach(function(u) {
      var id = "id" in u ? u.id : "_N" + nextId++;
      u.dagre = { id: id, width: u.width, height: u.height };
      g.addNode(id, u.dagre);
    });

    edges.forEach(function(e) {
      var source = e.source.dagre.id;
      if (!g.hasNode(source)) {
        throw new Error("Source node for '" + e + "' not in node list");
      }

      var target = e.target.dagre.id;
      if (!g.hasNode(target)) {
        throw new Error("Target node for '" + e + "' not in node list");
      }

      e.dagre = {
        points: []
      };

      // Track edges that aren't self loops - layout does nothing for self
      // loops, so they can be skipped.
      if (source !== target) {
        var id = "id" in e ? e.id : "_E" + nextId++;
        // TODO should we use prototypal inheritance for this?
        if (e.minLen) {
          e.dagre.minLen = e.minLen;
        }
        g.addEdge(id, source, target, e.dagre);
      }
    });

    return g;
  }

  function acyclic(g) {
    var onStack = {};
    var visited = {};

    function dfs(u) {
      if (u in visited)
        return;

      visited[u] = true;
      onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var v = g.target(e);
        if (v in onStack) {
          var edge = g.edge(e);
          g.delEdge(e);
          edge.reversed = true;
          g.addEdge(e, v, u, edge);
        } else {
          dfs(v);
        }
      });

      delete onStack[u];
    }

    g.nodes().forEach(function(u) {
      dfs(u);
    });
  }

  function undoAcyclic(g) {
    g.edges().forEach(function(e) {
      var edge = g.edge(e);
      if (edge.reversed) {
        var source = g.source(e);
        var target = g.target(e);
        delete edge.reversed;

        // Reverse the points array because it was populated for the reversed
        // edge.
        edge.points.reverse();
        g.delEdge(e);
        g.addEdge(e, target, source, edge);
      }
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function normalize(g) {
    g.edges().forEach(function(e) {
      var source = g.source(e);
      var target = g.target(e);
      var sourceRank = g.node(source).rank;
      var targetRank = g.node(target).rank;
      if (sourceRank + 1 < targetRank) {
        var prefix = "_D-" + e + "-";
        for (var u = source, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
          var v = prefix + rank;
          var node = { width: 0,
                       height: 0,
                       edgeId: e,
                       edge: g.edge(e),
                       source: g.source(e),
                       target: g.target(e),
                       index: i,
                       rank: rank,
                       dummy: true };
          g.addNode(v, node);
          g.addEdge(u + " -> " + v, u, v, {});
          u = v;
        }
        g.addEdge(u + " -> " + target, u, target, {});
        g.delEdge(e);
      }
    });
  }

  function undoNormalize(g) {
    var visited = {};

    g.nodes().forEach(function(u) {
      var node = g.node(u);
      if (node.dummy) {
        if (!g.hasEdge(node.edgeId)) {
          g.addEdge(node.edgeId, node.source, node.target, node.edge);
        }
        var points = g.edge(node.edgeId).points;
        points[node.index] = { x: node.x, y: node.y };
        g.delNode(u);
      }
    });
  }
}
