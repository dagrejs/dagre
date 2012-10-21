dagre.layout = function() {
      // Min separation between adjacent nodes in the same rank
  var nodeSep = 50,
      // Min separation between adjacent edges in the same rank
      edgeSep = 10,
      // Min separation between ranks
      rankSep = 30,
      // Number of passes to take during the ordering phase
      orderIters = 24,
      // Debug positioning with a particular direction (up-left, up-right, down-left, down-right)
      posDir = null,
      layout = {};

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

  layout.apply = function(g) {
    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    var selfLoops = removeSelfLoops(g);
    var reversed = acyclic(g);

    var ranks = dagre.layout.rank(g);
    var dummyNodes = addDummyNodes(g, ranks);
    var layering = dagre.layout.order(g, orderIters, ranks);
    var coords = dagre.layout.position(g, layering, dummyNodes, rankSep, nodeSep, edgeSep, posDir);

    collapseDummyNodes(g, dummyNodes, coords);
    undoAcyclic(g, reversed);
    addSelfLoops(g, selfLoops);

    g.nodes().forEach(function(u) {
      u.attrs.x = coords[u.id()].x;
      u.attrs.y = coords[u.id()].y;
    });
  };

  function acyclic(g) {
    var onStack = {};
    var visited = {};
    var reversed = [];

    function dfs(u) {
      if (u in visited)
        return;

      visited[u.id()] = true;
      onStack[u.id()] = true;
      u.outEdges().forEach(function(e) {
        var v = e.head();
        if (v.id() in onStack) {
          g.removeEdge(e);
          reversed.push(e.id());
          g.addEdge(e.id(), v, u, e.attrs);
        } else {
          dfs(v);
        }
      });

      delete onStack[u.id()];
    }

    g.nodes().forEach(function(u) {
      dfs(u);
    });

    return reversed;
  }

  function undoAcyclic(g, reversed) {
    reversed.forEach(function(eId) {
      var e = g.edge(eId);
      g.removeEdge(e);
      if (e.attrs.points) {
        e.attrs.points.reverse();
      }
      g.addEdge(e.id(), e.head(), e.tail(), e.attrs);
    });
  }

  function removeSelfLoops(g) {
    var selfLoops = [];
    g.nodes().forEach(function(u) {
      var es = u.outEdges(u);
      es.forEach(function(e) {
        selfLoops.push(e);
        g.removeEdge(e);
      });
    });
    return selfLoops;
  }

  function addSelfLoops(g, selfLoops) {
    selfLoops.forEach(function(e) {
      g.addEdge(e.id(), e.head(), e.tail(), e.attrs);
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function addDummyNodes(g, ranks) {
    var dummyNodes = {};

    g.edges().forEach(function(e) {
      var prefix = "_dummy-" + e.id() + "-";
      var u = e.tail();
      var sinkRank = ranks[e.head().id()];
      if (ranks[u.id()] + 1 < sinkRank) {
        g.removeEdge(e);
        e.attrs.edgeId = e.id();
        for (var rank = ranks[u.id()] + 1; rank < sinkRank; ++rank) {
          var vId = prefix + rank;
          var v = g.addNode(vId, { height: 0,
                                   width: 0 });
          dummyNodes[vId] = true;
          ranks[vId] = rank;
          g.addEdge(null, u, v, e.attrs);
          u = v;
        }
        g.addEdge(null, u, e.head(), e.attrs);
      }
    });

    return dummyNodes;
  }

  function collapseDummyNodes(g, dummyNodes, coords) {
    var visited = {};

    // Use dfs from all non-dummy nodes to find the roots of dummy chains. Then
    // walk the dummy chain until a non-dummy node is found. Collapse all edges
    // traversed into a single edge.

    function collapseChain(e) {
      var root = e.tail();
      var rootEdge = e;
      var points = [];
      do
      {
        points.push({x: coords[e.head().id()].x, y: coords[e.head().id()].y});
        e = e.head().outEdges()[0];
        g.removeNode(e.tail());
      }
      while (dummyNodes[e.head().id()]);
      var e2 = g.addEdge(rootEdge.attrs.edgeId, root, e.head(), e.attrs);
      e2.attrs.points = points;
    }

    function dfs(u) {
      if (!(u.id() in visited)) {
        visited[u.id()] = true;
        u.outEdges().forEach(function(e) {
          var v = e.head();
          if (dummyNodes[v.id()]) {
            collapseChain(e);
          } else {
            dfs(v);
          }
        });
      }
    }

    g.nodes().forEach(function(u) {
      if (!dummyNodes[u.id()]) {
        dfs(u);
      }
    });
  }

  return layout;
}
