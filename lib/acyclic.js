var util = require("./util");

module.exports = acyclic;
module.exports.undo = undo;

function acyclic(g) {
  var onStack = {},
      visited = {},
      reverseCount = 0,
      selfLoops;
  
  if (arguments.length === 1) {
    saveSelfLoops = true;
  }

  selfLoops = g.graph()._acyclicSelfLoops;
  if (selfLoops === undefined) {
    selfLoops = g.graph()._acyclicSelfLoops = [];
  }

  function dfs(u) {
    if (u in visited) return;
    visited[u] = onStack[u] = true;
    g.outEdges(u).forEach(function(e) {
      var t = g.target(e),
          value;

      if (u === t) {
        selfLoops.push({ e: e, u: u, v: t, value: g.edge(e) });
        g.delEdge(e);
      } else if (t in onStack) {
        value = g.edge(e);
        g.delEdge(e);
        value.reversed = !value.reversed;
        ++reverseCount;
        g.addEdge(e, t, u, value);
      } else {
        dfs(t);
      }
    });

    delete onStack[u];
  }

  g.eachNode(function(u) { dfs(u); });

  util.log(2, "Acyclic Phase: reversed " + reverseCount + " edge(s)");

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

  // Restore self-loops
  if (g.graph()._acyclicSelfLoops) {
    g.graph()._acyclicSelfLoops.forEach(function(descr) {
      // It's possible that the removed edge collides with an auto-assigned id,
      // so we check and remove such cases here.
      if (g.hasEdge(descr.e)) {
        g.addEdge(null, g.source(descr.e), g.target(descr.e), g.edge(descr.e));
        g.delEdge(descr.e);
      }
      g.addEdge(descr.e, descr.u, descr.v, descr.value);
    });
  }
}
