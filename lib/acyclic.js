module.exports = acyclic;
module.exports.undo = undo;

function acyclic(g, debugLevel) {
  var onStack = {},
      visited = {},
      reverseCount = 0;

  function dfs(u) {
    if (u in visited) return;
    var fromMax = g.node(u).hasOwnProperty("prefRank") &&
      g.node(u).prefRank === "max";

    visited[u] = onStack[u] = true;
    g.outEdges(u).forEach(function(e) {
      var t = g.target(e),
          a;
      var toMin = g.node(t).hasOwnProperty("prefRank") &&
        g.node(t).prefRank === "min";

      if (t in onStack || fromMax || toMin) {
        a = g.edge(e);
        g.delEdge(e);
        a.reversed = true;
        ++reverseCount;
        g.addEdge(e, t, u, a);
      } else {
        dfs(t);
      }
    });

    delete onStack[u];
  }

  g.eachNode(function(u) { dfs(u); });

  if (debugLevel >= 2) {
    console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
  }
  return reverseCount;
}

function undo(g) {
  g.eachEdge(function(e, s, t, a) {
    if (a.reversed) {
      delete a.reversed;
      g.delEdge(e);
      g.addEdge(e, t, s, a);
    }
  });
}
