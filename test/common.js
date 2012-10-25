chai = require("chai"),
assert = chai.assert,
dagre = require("../index");

chai.Assertion.includeStack = true;

makeTestGraph = function(nodeMap, edgeMap) {
  var g = dagre.graph();
  dagre.util.keys(nodeMap).forEach(function(id) {
    g.addNode(id);
  });
  return g;
}
