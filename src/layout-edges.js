/*
 * For each edge in the graph, this function assigns one or more points to the
 * points attribute. This function requires that the nodes in the graph have
 * their x and y attributes assigned. Dummy nodes should be marked with the
 * dummy attribute.
 */
dagre.layout.edges = (function() {
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
    collapseDummyNodes(g);
  };
})();
