var assert = require("../chai").assert,
    Digraph = require("graphlib").Digraph,
    feasibleTree = require("../../lib/rank/feasibleTree");

describe("feasibleTree", function() {
  it("creates a tree for a trivial input graph", function() {
    var g = new Digraph();
    g.addNode("a", { rank: 0 });
    g.addNode("b", { rank: 1 });
    g.addEdge(null, "a", "b", { minLen: 1 });
    feasibleTree(g);
    assert.equal(g.node("b").rank, g.node("a").rank + 1);
  });

  it("respects multiple minLens for a pair of nodes", function() {
    var g = new Digraph();
    g.addNode("a", { rank: 0 });
    g.addNode("b", { rank: 6 });
    g.addEdge(null, "a", "b", { minLen: 1 });
    g.addEdge(null, "a", "b", { minLen: 2 });
    g.addEdge(null, "a", "b", { minLen: 6 });
    feasibleTree(g);
    assert.equal(g.node("b").rank, g.node("a").rank + 6);
  });

  it("tightens edges with slack", function() {
    var g = new Digraph();
    g.addNode("a", { rank: 0 });
    g.addNode("b", { rank: 12 });
    g.addNode("c", { rank: 1 });
    g.addEdge(null, "a", "b", { minLen: 6 });
    g.addEdge(null, "a", "c", { minLen: 1 });
    feasibleTree(g);
    assert.equal(g.node("b").rank, g.node("a").rank + 6);
    // This wasn"t tightened, but should not have changed either
    assert.equal(g.node("c").rank, g.node("a").rank + 1);
  });

  it("correctly constructs a feasible tree", function() {
    // This example came from marcello3d. The previous feasibleTree
    // implementation incorrectly shifted just the the node being added to
    // the tree, which broke the scan for edges with minimum slack.
    var g = new Digraph();
    g.addNode("a", { rank: 0 });
    g.addNode("b", { rank: 6 });
    g.addNode("c", { rank: 0 });
    g.addNode("d", { rank: 2 });
    g.addNode("e", { rank: 4 });
    g.addEdge(null, "a", "b", { minLen: 2 });
    g.addEdge(null, "c", "b", { minLen: 2 });
    g.addEdge(null, "c", "d", { minLen: 2 });
    g.addEdge(null, "d", "e", { minLen: 2 });
    g.addEdge(null, "e", "b", { minLen: 2 });
    feasibleTree(g);

    assert.equal(g.node("d").rank, g.node("c").rank + 2);
    assert.equal(g.node("e").rank, g.node("c").rank + 4);
    assert.equal(g.node("b").rank, g.node("c").rank + 6);
  });
});
