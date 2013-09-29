var util = require("../../util"),
    Digraph = require("graphlib").Digraph,
    topsort = require("graphlib").alg.topsort,
    nodesFromList = require("graphlib").filter.nodesFromList;

module.exports = sortLayer;

function sortLayer(g, weights) {
  var result = sortLayerSubgraph(g, null, weights);
  result.list.forEach(function(u, i) {
    g.node(u).order = i;
  });
}

function sortLayerSubgraph(g, sg, weights) {
  var cg = (g.graph().constraintGraph
      ? g.graph().constraintGraph.filterNodes(nodesFromList(g.nodes()))
      : new Digraph());

  var nodeData = {};
  g.children(sg).forEach(function(u) {
    if (g.children(u).length) {
      nodeData[u] = sortLayerSubgraph(g, u, weights);
    } else {
      var ws = weights[u];
      nodeData[u] = {
        degree: ws.length,
        barycenter: ws.length > 0 ? util.sum(ws) / ws.length : 0,
        list: [u]
      };
    }
  });

  var violated;
  while ((violated = findViolatedConstraint(cg, nodeData)) !== undefined) {
    var source = cg.source(violated),
        target = cg.target(violated);

    var v;
    while ((v = cg.addNode(null)) && g.hasNode(v)) {
      cg.delNode(v);
    }

    // Collapse barycenter and list
    nodeData[v] = mergeNodeData(nodeData[source], nodeData[target]);
    delete nodeData[source];
    delete nodeData[target];

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

  var keys = Object.keys(nodeData);
  keys.sort(function(x, y) {
    return nodeData[x].barycenter - nodeData[y].barycenter;
  });

  return keys.map(function(u) { return nodeData[u]; })
             .reduce(mergeNodeData);
}

function mergeNodeData(lhs, rhs) {
  return {
    degree: lhs.degree + rhs.degree,
    barycenter: (lhs.barycenter * lhs.degree + rhs.barycenter * rhs.degree) /
                (lhs.degree + rhs.degree),
    list: lhs.list.concat(rhs.list)
  };
}

function findViolatedConstraint(cg, nodeData) {
  var us = topsort(cg);
  for (var i = 0; i < us.length; ++i) {
    var u = us[i];
    var inEdges = cg.inEdges(u);
    for (var j = 0; j < inEdges.length; ++j) {
      var e = inEdges[j];
      if (nodeData[cg.source(e)].barycenter >= nodeData[u].barycenter) {
        return e;
      }
    }
  }
}
