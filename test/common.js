chai = require("chai"),
assert = chai.assert,
dagre = require("../index");

chai.Assertion.includeStack = true;

makeTestGraph = function(nodeMap, edgeMap) {
  if (!edgeMap) { edgeMap = {}; }

  var g = dagre.graph();
  dagre.util.keys(nodeMap).forEach(function(id) {
    nodeMap[id].id = id;
    g.addNode(id);
  });
  dagre.util.keys(edgeMap).forEach(function(id) {
    var edge = edgeMap[id];
    g.addEdge(id, edge.source, edge.target);
    edge.source = nodeMap[edge.source];
    edge.target = nodeMap[edge.target];
  });
  return g;
}
