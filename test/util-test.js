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

describe("dagre.util.prim", function() {
  it("returns a deterministic minimal spanning tree", function() {
    var g = dagre.graph.read("graph { A -- B [weight=1]; A -- C [weight=2]; B -- D [weight=3]; C -- D [weight=4]; }");
    var st = dagre.util.prim(g, function(u, v) { return u.edges(v)[0].attrs.weight; });
    Object.keys(st).forEach(function(x) { st[x].sort(); });
    assert.deepEqual({A: ["B", "C"], B: ["A", "D"], C: ["A"], D: ["B"]}, st);
  });

  it("returns a single field for a single node graph", function() {
    var g = dagre.graph.read("graph { A }");
    assert.deepEqual({A: []}, dagre.util.prim(g));
  });
});
