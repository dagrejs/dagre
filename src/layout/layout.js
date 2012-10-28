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

  // Internal state
  var
      // Graph used to determine relationships quickly
      g,
      // Map to original nodes using graph ids
      nodeMap,
      // Map to original edges using graph ids
      edgeMap,

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
    init();

    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    var reversed = acyclic(g);

    rank.run(g, nodeMap, edgeMap);
    addDummyNodes();
    order.run(g, nodeMap);
    position.run(g, nodeMap);
    collapseDummyNodes();

    undoAcyclic(reversed);

    resetInternalState();

    if (debugLevel >= 1) {
      console.log("Total layout time: " + timer.elapsedString());
    }
  };

  return self;

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

      e.dagre = {
        points: [],
        source: nodeMap[source],
        target: nodeMap[target],
      };

      // Track edges that aren't self loops - layout does nothing for self
      // loops, so they can be skipped.
      if (source !== target) {
        var id = nextId++;
        edgeMap[id] = e.dagre;
        // TODO should we use prototypal inheritance for this?
        if (e.minLen) {
          e.dagre.minLen = e.minLen;
        }
        g.addEdge(id, source, target);
      }
    });
  }

  function acyclic(g) {
    var onStack = {};
    var visited = {};
    var reversed = [];

    function dfs(u) {
      if (u in visited)
        return;

      visited[u] = true;
      onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var v = g.target(e);
        if (v in onStack) {
          g.delEdge(e);
          reversed.push(e);
          g.addEdge(e, v, u);
        } else {
          dfs(v);
        }
      });

      delete onStack[u];
    }

    g.nodes().forEach(function(u) {
      dfs(u);
    });

    return reversed;
  }

  function undoAcyclic(reversed) {
    reversed.forEach(function(e) {
      edgeMap[e].points.reverse();
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function addDummyNodes() {
    g.edges().forEach(function(e) {
      var source = g.source(e);
      var target = g.target(e);
      var sourceRank = nodeMap[source].rank;
      var targetRank = nodeMap[target].rank;
      if (sourceRank + 1 < targetRank) {
        var prefix = "D-" + e + "-";
        g.delEdge(e);
        for (var u = source, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
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
        g.addEdge(u + " -> " + target, u, target);
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
}
