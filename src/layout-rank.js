dagre.layout.rank = (function() {
  function acyclic(g) {
    var onStack = {};
    var visited = {};

    function dfs(u) {
      if (u in visited)
        return;

      visited[u.id()] = true;
      onStack[u.id()] = true;
      u.outEdges().forEach(function(e) {
        var v = e.head();
        if (v.id() in onStack) {
          g.removeEdge(e);
          e.attrs.reverse = true;

          // If this is not a self-loop add the reverse edge to the graph
          if (u.id() !== v.id()) {
            u.addPredecessor(v, e.attrs);
          }
        } else {
          dfs(v);
        }
      });

      delete onStack[u.id()];
    }

    g.nodes().forEach(function(u) {
      dfs(u);
    });
  }

  function reverseAcyclic(g) {
    g.edges().forEach(function(e) {
      if (e.attrs.reverse) {
        g.removeEdge(e);
        g.addEdge(e.head(), e.tail(), e.attrs);
        delete e.attrs.reverse;
      }
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
      g.addEdge(e.head(), e.tail(), e.attrs);
    });
  }

  function initRank(g) {
    var pq = priorityQueue();
    g.nodes().forEach(function(u) {
      pq.add(u.id(), u.inDegree());
    });

    var current = [];
    var rankNum = 0;
    while (pq.size() > 0) {
      for (var minId = pq.min(); pq.priority(minId) === 0; minId = pq.min()) {
        pq.removeMin();
        g.node(minId).attrs.rank = rankNum;
        current.push(minId);
      }

      if (current.length === 0) {
        throw new Error("Input graph is not acyclic: " + dagre.graph.write(g));
      }

      current.forEach(function(uId) {
        g.node(uId).outEdges().forEach(function(e) {
          var headId = e.head().id();
          pq.decrease(headId, pq.priority(headId) - 1);
        });
      });

      current = [];
      ++rankNum;
    }
  }

  return function(g) {
    var selfLoops = removeSelfLoops(g);
    acyclic(g);
    initRank(g);
    reverseAcyclic(g);
    addSelfLoops(g, selfLoops);

    var layering = [];
    g.nodes().forEach(function(u) {
      var rank = u.attrs.rank;
      layering[rank] = layering[rank] || [];
      layering[rank].push(u);
    });
    return layering;
  }
})();
