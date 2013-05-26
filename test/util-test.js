require("./common");

var assert2 = require("assert");

describe("dagre.util.sum", function() {
  it("returns the sum of all elements in the array", function() {
    assert.equal(dagre.util.sum([1,2,3,4]), 10);
  });

  it("returns 0 if there are no elements in the array", function() {
    assert.equal(dagre.util.sum([]), 0);
  });
});

describe("dagre.util.components", function() {
  it("returns all nodes in a connected graph", function() {
    var g = dagre.graph();
    [1, 2, 3].forEach(function(u) { g.addNode(u); });
    g.addEdge("A", 1, 2);
    g.addEdge("B", 2, 3);
    var cmpts = dagre.util.components(g);
    assert.deepEqual(cmpts.map(function(cmpt) { return cmpt.sort(); }),
                     [[1, 2, 3]]);
  });

  it("returns maximal subsets of connected nodes", function() {
    var g = dagre.graph();
    [1, 2, 3, 4, 5, 6].forEach(function(u) { g.addNode(u); });
    g.addEdge("A", 1, 2);
    g.addEdge("B", 2, 3);
    g.addEdge("C", 4, 5);

    var cmpts = dagre.util.components(g).sort(function(x, y) { return y.length - x.length; });
    assert2.deepEqual(cmpts.map(function(cmpt) { return cmpt.sort(); }),
                     [[1, 2, 3], [4, 5], [6]]);
  });
});

describe("dagre.util.prim", function() {
  it("returns a deterministic minimal spanning tree", function() {
    var g = dagre.graph();
    [1, 2, 3, 4].forEach(function(u) { g.addNode(u); });
    g.addEdge("12", 1, 2);
    g.addEdge("13", 1, 3);
    g.addEdge("24", 2, 4);
    g.addEdge("34", 3, 4);
    var weights = { 12: 1, 13: 2, 24: 3, 34: 4 };

    var st = dagre.util.prim(g, function(u, v) { return weights[[u,v].sort().join("")]; });
    Object.keys(st).forEach(function(x) { st[x].sort(); });
    assert.deepEqual({1: [2, 3], 2: [1, 4], 3: [1], 4: [2]}, st);
  });

  it("returns a single field for a single node graph", function() {
    var g = dagre.graph();
    g.addNode(1);
    assert.deepEqual({1: []}, dagre.util.prim(g));
  });
});
