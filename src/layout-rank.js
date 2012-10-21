dagre.layout.rank = (function() {
  function initRank(g) {
    var pq = priorityQueue();
    g.nodes().forEach(function(u) {
      pq.add(u.id(), u.inDegree());
    });

    var ranks = {};
    var current = [];
    var rankNum = 0;
    while (pq.size() > 0) {
      for (var minId = pq.min(); pq.priority(minId) === 0; minId = pq.min()) {
        pq.removeMin();
        ranks[minId] = rankNum;
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

    return ranks;
  }

  function feasibleTree(g, ranks) {
    // TODO make minLength configurable per edge
    var minLength = 1;
    var tree = dagre.util.prim(g, function(u, v) {
      return Math.abs(ranks[u.id()] - ranks[v.id()]) - minLength;
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u.id()] = true;
      ranks[u.id()] = rank;

      tree[u.id()].forEach(function(vId) {
        if (!(vId in visited)) {
          var v = g.node(vId);
          dfs(v, rank + (g.hasEdge(u, v) ? minLength : -minLength));
        }
      });
    }

    dfs(g.nodes()[0], 0);

    return tree;
  }

  function normalize(g, ranks) {
    var m = min(values(ranks));
    g.nodes().forEach(function(u) {
      ranks[u.id()] -= m;
    });
  }

  return function(g) {
    var ranks = {};
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      ranks = initRank(subgraph);
      var tree = feasibleTree(subgraph, ranks);
      normalize(subgraph, ranks);
    });
    return ranks;
  };
})();
