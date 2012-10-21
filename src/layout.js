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

  layout.apply = function(g, dimensions) {
    if (g.nodes().length === 0) {
      // Nothing to do!
      return;
    }

    var selfLoops = removeSelfLoops(g);
    var reversed = acyclic(g);

    var ranks = dagre.layout.rank(g);
    var dummyNodes = addDummyNodes(g, ranks, dimensions);
    var layering = dagre.layout.order(g, orderIters, ranks);
    var coords = dagre.layout.position(g, layering, dummyNodes, dimensions, rankSep, nodeSep, edgeSep, posDir);
    var points = collapseDummyNodes(g, dummyNodes, coords);

    keys(coords).forEach(function(u) {
      if (u in dummyNodes) {
        delete coords[u];
      }
    });

    undoAcyclic(g, reversed, points);
    addSelfLoops(g, selfLoops);

    return { coords: coords, points: points };
  };

  function acyclic(g) {
    var onStack = {};
    var visited = {};
    var reversed = [];

    function dfs(u) {
      if (u in visited)
        return;

      visited[u] = true;
      onStack[u] = true;
      g.edges(u, null).forEach(function(e) {
        var edge = g.edge(e);
        var v = edge.target;
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

  function undoAcyclic(g, reversed, points) {
    reversed.forEach(function(e) {
      var edge = g.edge(e);
      g.delEdge(e);
      var ps = points[e];
      if (ps) {
        ps.reverse();
      }
      g.addEdge(e, edge.target, edge.source);
    });
  }

  function removeSelfLoops(g) {
    var selfLoops = [];
    g.nodes().forEach(function(u) {
      var es = g.edges(u, u);
      es.forEach(function(e) {
        var edge = g.edge(e);
        selfLoops.push({key: e, source: edge.source, target: edge.target});
        g.delEdge(e);
      });
    });
    return selfLoops;
  }

  function addSelfLoops(g, selfLoops) {
    selfLoops.forEach(function(e) {
      g.addEdge(e.key, e.source, e.target);
    });
  }

  // Assumes input graph has no self-loops and is otherwise acyclic.
  function addDummyNodes(g, ranks, dimensions) {
    var dummyNodes = {};

    g.edges().forEach(function(e) {
      var prefix = "_dummy-" + e + "-";
      var edge = g.edge(e);
      var u = edge.source;
      var sinkRank = ranks[edge.target];
      if (ranks[u] + 1 < sinkRank) {
        g.delEdge(e);
        for (var rank = ranks[u] + 1; rank < sinkRank; ++rank) {
          var v = prefix + rank;
          g.addNode(v);
          dimensions[v] = { width: 0, height: 0 };
          dummyNodes[v] = e;
          ranks[v] = rank;
          g.addEdge(u + " -> " + v, u, v);
          u = v;
        }
        g.addEdge(u + " -> " + edge.target, u, edge.target);
      }
    });

    return dummyNodes;
  }

  function collapseDummyNodes(g, dummyNodes, coords) {
    var points = {};
    var visited = {};

    // Use dfs from all non-dummy nodes to find the roots of dummy chains. Then
    // walk the dummy chain until a non-dummy node is found. Collapse all edges
    // traversed into a single edge.

    function collapseChain(e) {
      var edge = g.edge(e);
      var root = edge.source;
      var newE = dummyNodes[edge.target];
      var ps = [];
      var prev = edge.source;
      var curr = edge.target;
      do
      {
        ps.push({x: coords[curr].x, y: coords[curr].y});
        prev = curr;
        curr = g.edge(g.edges(curr, null)[0]).target;
        g.delNode(prev);
      }
      while (dummyNodes[curr]);
      g.addEdge(newE, root, curr);
      points[newE] = ps;
    }

    function dfs(u) {
      if (!(u in visited)) {
        visited[u] = true;
        g.edges(u, null).forEach(function(e) {
          var edge = g.edge(e);
          var v = edge.target;
          if (dummyNodes[v]) {
            collapseChain(e);
          } else {
            dfs(v);
          }
        });
      }
    }

    g.nodes().forEach(function(u) {
      if (!dummyNodes[u]) {
        dfs(u);
      }
    });

    return points;
  }

  return layout;
}
