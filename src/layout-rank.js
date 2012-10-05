dagre.layout.rank = (function() {
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
    var pq = dagre.priorityQueue();
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
    initRank(g);
    addSelfLoops(g, selfLoops);
  }
})();
