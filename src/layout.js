dagre.layout = function() {
}

/*
 * Makes the input graph acyclic by reversing edges as needed. This algorithm
 * does not attempt to reverse the minimal set of edges (feedback arc set
 * problem) because an exact algorithm is NP-complete.
 */
dagre.layout.acyclic = function(g) {
  var onStack = {};
  var visited = {};

  function dfs(u) {
    if (u in visited)
      return;

    visited[u] = true;
    onStack[u] = true;
    u.outEdges().forEach(function(e) {
      var v = e.head();
      if (v in onStack) {
        u.removeSuccessor(v);

        // If u === v then this edge was a self loop in which case it should be
        // removed altogether. Otherwise, we need to reverse the edge.
        if (u !== v) {
          var e2 = u.inEdge(v);
          if (e2) {
            e2.attrs.weight = parseInt(e2.attrs.weight) + parseInt(e.attrs.weight);
          } else {
            u.addPredecessor(v, { weight: parseInt(e.attrs.weight) });
          }
        }
      } else {
        dfs(v);
      }
    });

    delete onStack[u];
  }

  g.nodes().forEach(function(u) {
    dfs(u);
  });
}
