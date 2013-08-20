var common = require("../common"),
    assert = require("chai").assert,
    assert2 = require("assert"),
    graph = common.requireSrc("./lib/graph"),
    components = common.requireSrc("./lib/algo/components");

describe("algo/components", function() {
  it("returns all nodes in a connected graph", function() {
    var g = graph();
    [1, 2, 3].forEach(function(u) { g.addNode(u); });
    g.addEdge("A", 1, 2);
    g.addEdge("B", 2, 3);
    var cmpts = components(g);
    assert.deepEqual(cmpts.map(function(cmpt) { return cmpt.sort(); }),
                     [[1, 2, 3]]);
  });

  it("returns maximal subsets of connected nodes", function() {
    var g = graph();
    [1, 2, 3, 4, 5, 6].forEach(function(u) { g.addNode(u); });
    g.addEdge("A", 1, 2);
    g.addEdge("B", 2, 3);
    g.addEdge("C", 4, 5);

    var cmpts = components(g).sort(function(x, y) { return y.length - x.length; });
    assert2.deepEqual(cmpts.map(function(cmpt) { return cmpt.sort(); }),
                     [[1, 2, 3], [4, 5], [6]]);
  });
});
