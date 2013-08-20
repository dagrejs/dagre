var common = require("../common"),
    assert = require("chai").assert,
    graph = common.requireSrc("./lib/graph"),
    prim = common.requireSrc("./lib/algo/prim");

describe("algo/prim", function() {
  it("returns a deterministic minimal spanning tree", function() {
    var g = graph();
    [1, 2, 3, 4].forEach(function(u) { g.addNode(u); });
    g.addEdge("12", 1, 2);
    g.addEdge("13", 1, 3);
    g.addEdge("24", 2, 4);
    g.addEdge("34", 3, 4);
    var weights = { 12: 1, 13: 2, 24: 3, 34: 4 };

    var st = prim(g, function(u, v) { return weights[[u,v].sort().join("")]; });
    Object.keys(st).forEach(function(x) { st[x].sort(); });
    assert.deepEqual({1: [2, 3], 2: [1, 4], 3: [1], 4: [2]}, st);
  });

  it("returns a single field for a single node graph", function() {
    var g = graph();
    g.addNode(1);
    assert.deepEqual({1: []}, prim(g));
  });
});
