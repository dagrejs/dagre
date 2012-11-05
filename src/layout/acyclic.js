dagre.layout.acyclic = function() {
  // External configuration
  var debugLevel = 0;

  var self = {};

  self.debugLevel = function(x) {
    if (!arguments.length) return debugLevel;
    debugLevel = x;
    return self;
  }

  self.run = function(g) {
    var timer = debugLevel ? createTimer() : null,
        onStack = {},
        visited = {};

    function dfs(u) {
      if (u in visited) return;

      visited[u] = onStack[u] = true;
      g.outEdges(u).forEach(function(e) {
        var t = g.target(e),
            a;

        if (t in onStack) {
          a = g.edge(e);
          g.delEdge(e);
          a.reversed = true;
          g.addEdge(e, t, u, a);
        } else {
          dfs(t);
        }
      });

      delete onStack[u];
    }

    g.eachNode(function(u) { dfs(u); });

    if (timer) console.log("Acyclic time: " + timer.elapsedString());
  }

  self.undo = function(g) {
    g.eachEdge(function(e, s, t, a) {
      if (a.reversed) {
        delete a.reversed;
        g.delEdge(e);
        g.addEdge(e, t, s, a);
      }
    });
  }

  return self;
};
