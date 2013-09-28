var util = require("../../util"),
    Digraph = require("graphlib").Digraph,
    topsort = require("graphlib").alg.topsort,
    nodesFromList = require("graphlib").filter.nodesFromList;

module.exports = sortLayer;

function sortLayer(g, weights) {
  var cg = (g.graph().constraintGraph
      ? g.graph().constraintGraph.filterNodes(nodesFromList(g.nodes()))
      : new Digraph());

  var bs = {};
  var deg = {};
  var lists = {};
  var pos = {},
      nextPos = 0;
  g.nodes().forEach(function(u) {
    var ws = weights[u];
    deg[u] = ws ? ws.length : 0;
    bs[u] = (deg[u] > 0 ? util.sum(ws) / deg[u] : 0);
    lists[u] = [u];
    pos[u] = g.node(u).order;
    if (pos[u] >= nextPos) nextPos = pos[u] + 1;
  });

  var violated;
  while ((violated = findViolatedConstraint(cg, bs)) !== undefined) {
    var source = cg.source(violated),
        sourceDeg = deg[source],
        target = cg.target(violated),
        targetDeg = deg[target];

    var v;
    while ((v = cg.addNode(null)) && g.hasNode(v)) {
      cg.delNode(v);
    }
    pos[v] = nextPos++;

    // Collapse barycenter and list
    deg[v] = sourceDeg + targetDeg;
    delete deg[source];
    delete deg[target];
    bs[v] = (bs[source] * sourceDeg + bs[target] * targetDeg) / deg[v];
    delete bs[source];
    delete bs[target];
    lists[v] = [].concat(lists[source], lists[target]);
    delete lists[source];
    delete lists[target];

    // Collapse node in constraint graph
    // TODO original paper removes self loops, but it is not obvious when this would happen
    cg.inEdges(source).forEach(function(e) {
      cg.delEdge(e);
      cg.addEdge(null, cg.source(e), v);
    });
    cg.outEdges(target).forEach(function(e) {
      cg.delEdge(e);
      cg.addEdge(null, v, cg.target(e));
    });
    cg.delNode(source);
    cg.delNode(target);
    if (cg.incidentEdges(v).length === 0) { cg.delNode(v); }
  }

  var bsKeys = Object.keys(bs);
  bsKeys.sort(function(x, y) {
    return bs[x] - bs[y] || pos[x] - pos[y];
  });

  var i = 0;
  bsKeys.forEach(function(u) {
    lists[u].forEach(function(v) {
      g.node(v).order = i++;
    });
  });
}

function findViolatedConstraint(cg, bs) {
  var us = topsort(cg);
  for (var i = 0; i < us.length; ++i) {
    var u = us[i];
    var inEdges = cg.inEdges(u);
    for (var j = 0; j < inEdges.length; ++j) {
      var e = inEdges[j];
      if (bs[cg.source(e)] >= bs[u]) {
        return e;
      }
    }
  }
}
