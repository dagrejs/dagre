dagre.layout = (function() {
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
    g.edges().forEach(function(e) {
      var prefix = "_dummy-" + e.id() + "-";
      var u = e.tail();
      var sinkRank = ranks[e.head().id()];
      if (ranks[u.id()] + 1 < sinkRank) {
        g.removeEdge(e);
        e.attrs.edgeId = e.id();
        for (var rank = ranks[u.id()] + 1; rank < sinkRank; ++rank) {
          var vId = prefix + rank;
          var v = g.addNode(vId, { dummy: true,
                                   height: 0,
                                   width: 0,
                                   marginX: 0,
                                   marginY: 0 });
          ranks[vId] = rank;
          g.addEdge(null, u, v, e.attrs);
          u = v;
        }
        g.addEdge(null, u, e.head(), e.attrs);
      }
    });
  }

  function collapseDummyNodes(g) {
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
        points.push({x: e.head().attrs.x, y: e.head().attrs.y});
        e = e.head().outEdges()[0];
        g.removeNode(e.tail());
      }
      while (e.head().attrs.dummy);
      var e2 = g.addEdge(rootEdge.attrs.edgeId, root, e.head(), e.attrs);
      e2.attrs.points = points;
    }

    function dfs(u) {
      if (!(u.id() in visited)) {
        visited[u.id()] = true;
        u.outEdges().forEach(function(e) {
          var v = e.head();
          if (v.attrs.dummy) {
            collapseChain(e);
          } else {
            dfs(v);
          }
        });
      }
    }

    g.nodes().forEach(function(u) {
      if (!u.attrs.dummy) {
        dfs(u);
      }
    });
  }

  return function(g) {
    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    var selfLoops = removeSelfLoops(g);
    var reversed = acyclic(g);

    var ranks = dagre.layout.rank(g);
    addDummyNodes(g, ranks);
    var layering = dagre.layout.order(g, g.attrs.orderIters, ranks);
    dagre.layout.position(g, layering);

    collapseDummyNodes(g);
    undoAcyclic(g, reversed);
    addSelfLoops(g, selfLoops);
  };
})();
