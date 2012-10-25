dagre.layout.rank = (function() {
  function initRank(g, nodeMap) {
    var pq = priorityQueue();
    g.nodes().forEach(function(u) {
      pq.add(u, g.edges(null, u).length);
    });

    var current = [];
    var rankNum = 0;
    while (pq.size() > 0) {
      for (var minId = pq.min(); pq.priority(minId) === 0; minId = pq.min()) {
        pq.removeMin();
        nodeMap[minId].rank = rankNum;
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
  }

  function feasibleTree(g, nodeMap) {
    // TODO make minLength configurable per edge
    var minLength = 1;
    var tree = dagre.util.prim(g, function(u, v) {
      return Math.abs(nodeMap[u].rank - nodeMap[v].rank) - minLength;
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u] = true;
      nodeMap[u].rank = rank;

      tree[u].forEach(function(v) {
        if (!(v in visited)) {
          dfs(v, rank + (g.edges(u, v).length ? minLength : -minLength));
        }
      });
    }

    dfs(g.nodes()[0], 0);

    return tree;
  }

  function normalize(g, nodeMap) {
    var m = min(values(nodeMap).map(function(u) { return u.rank; }));
    values(nodeMap).forEach(function(u) { u.rank -= m; });
  }

  return function(g, nodeMap) {
    initRank(g, nodeMap);
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      feasibleTree(subgraph, nodeMap);
      normalize(subgraph, nodeMap);
    });
  };
})();
