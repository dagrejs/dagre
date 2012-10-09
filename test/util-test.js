require("./common");

var assert2 = require("assert");

describe("dagre.util.components", function() {
  it("returns all nodes in a connected graph", function() {
    var g = dagre.graph.read("digraph { A -> B -> C; }");
    var cmpts = dagre.util.components(g);
    assert.deepEqual(cmpts.map(function(cmpt) { return ids(cmpt).sort(); }),
                     [["A", "B", "C"]]);
  });

  it("returns maximal subsets of connected nodes", function() {
    var g = dagre.graph.read("digraph { A -> B -> C; D -> E; F }");
    var cmpts = dagre.util.components(g).sort(function(x, y) { return y.length - x.length; });
    assert2.deepEqual(cmpts.map(function(cmpt) { return ids(cmpt).sort(); }),
                     [["A", "B", "C"], ["D", "E"], ["F"]]);
  });
});
