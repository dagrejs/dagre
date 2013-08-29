var util = require("../util");

module.exports = instrumentedRun;
module.exports.undo = undo;

function instrumentedRun(g, debugLevel) {
  var timer = util.createTimer();
  var reverseCount = util.createTimer().wrap("Acyclic Phase", run)(g);
  if (debugLevel >= 2) console.log("Acyclic Phase: reversed " + reverseCount + " edge(s)");
}

function run(g) {
  var onStack = {},
      visited = {},
      reverseCount = 0;

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
        ++reverseCount;
        g.addEdge(e, t, u, a);
      } else {
        dfs(t);
      }
    });

    delete onStack[u];
  }

  g.eachNode(function(u) { dfs(u); });

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
