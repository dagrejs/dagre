dagre.layout.rank = (function() {
  function initRank(g) {
    var pq = priorityQueue();
    g.nodes().forEach(function(u) {
      pq.add(u, g.edges(null, u).length);
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
        throw new Error("Input graph is not acyclic: " + g.toString());
      }

      current.forEach(function(u) {
        g.edges(u, null).forEach(function(e) {
          var edge = g.edge(e);
          var target = edge.target;
          pq.decrease(target, pq.priority(target) - 1);
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
      return Math.abs(ranks[u] - ranks[v]) - minLength;
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u] = true;
      ranks[u] = rank;

      tree[u].forEach(function(v) {
        if (!(v in visited)) {
          dfs(v, rank + (g.edges(u, v).length ? minLength : -minLength));
        }
      });
    }

    dfs(g.nodes()[0], 0);

    return tree;
  }

  function normalize(g, ranks) {
    var m = min(values(ranks));
    g.nodes().forEach(function(u) {
      ranks[u] -= m;
    });
  }

  return function(g) {
    var ranks = initRank(g);
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      var tree = feasibleTree(subgraph, ranks);
      normalize(subgraph, ranks);
    });
    return ranks;
  };
})();
