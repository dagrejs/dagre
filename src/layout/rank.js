dagre.layout.rank = (function() {
  function initRank(g, nodeMap, edgeMap) {
    var minRank = {};
    var pq = priorityQueue();

    g.nodes().forEach(function(u) {
      pq.add(u, g.edges(null, u).length);
      minRank[u] = 0;
    });

    while (pq.size() > 0) {
      var minId = pq.min();
      if (pq.priority(minId) > 0) {
        throw new Error("Input graph is not acyclic: " + dagre.graph.write(g));
      }
      pq.removeMin();

      var rank = minRank[minId];
      nodeMap[minId].rank = rank;

      g.outEdges(minId).forEach(function(e) {
        var edge = g.edge(e);
        var target = edge.target;
        minRank[target] = Math.max(minRank[target], rank + (edgeMap[e].minLen || 1));
        pq.decrease(target, pq.priority(target) - 1);
      });
    }
  }

  function feasibleTree(g, nodeMap, edgeMap) {
    // Precompute minimum lengths for each directed edge
    var minLen = {};
    g.edges().forEach(function(e) {
      var edge = edgeMap[e];
      var id = incidenceId(edge.source.id, edge.target.id);
      minLen[id] = Math.max(minLen[id] || 1, edge.minLen || 1);
    });

    var tree = dagre.util.prim(g, function(u, v) {
      return Math.abs(nodeMap[u].rank - nodeMap[v].rank) - minLen[incidenceId(u, v)];
    });

    var visited = {};
    function dfs(u, rank) {
      visited[u] = true;
      nodeMap[u].rank = rank;

      tree[u].forEach(function(v) {
        if (!(v in visited)) {
          var delta = minLen[incidenceId(u, v)];
          dfs(v, rank + (g.edges(u, v).length ? delta : -delta));
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

  function undoAcyclic(g, reversed) {
    reversed.forEach(function(e) {
      var edge = g.edge(e);
      g.delEdge(e);
      g.addEdge(e, edge.target, edge.source);
    });
  }

  /*
   * This id can be used to group (in an undirected manner) multi-edges
   * incident on the same two nodes.
   */
  function incidenceId(u, v) {
    return u < v ?  u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u;
  }

  return function(g, nodeMap, edgeMap) {
    var reversed = acyclic(g);
    initRank(g, nodeMap, edgeMap);
    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      feasibleTree(subgraph, nodeMap, edgeMap);
      normalize(subgraph, nodeMap);
    });
    undoAcyclic(g, reversed);
  };
})();
