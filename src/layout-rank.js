dagre.layout.rank = (function() {
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

  function feasibleTree(g) {
    // TODO make minLength configurable per edge
    var minLength = 1;
    var tree = dagre.util.prim(g, function(u, v) {
      return Math.abs(u.attrs.rank - v.attrs.rank) - minLength;
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u.id()] = true;
      u.attrs.rank = rank;

      tree[u.id()].forEach(function(vId) {
        console.log(tree);
        if (!(vId in visited)) {
          var v = g.node(vId);
          dfs(v, rank + (g.hasEdge(u, v) ? minLength : -minLength));
        }
      });
    }

    dfs(g.nodes()[0], 0);

    console.log(dagre.graph.write(g));

    return tree;
  }

  function normalize(g) {
    var m = min(g.nodes().map(function(u) { return u.attrs.rank; }));
    g.nodes().forEach(function(u) {
      u.attrs.rank -= m;
    });
  }

  return function(g) {
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      initRank(subgraph);
      var tree = feasibleTree(subgraph);
      normalize(subgraph);
      subgraph.nodes().forEach(function(u) {
        g.node(u.id()).attrs.rank = u.attrs.rank;
      });
    });
  };
})();
