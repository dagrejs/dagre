var expect = require("../chai").expect,
    longestPath = require("../../lib/rank/longest-path"),
    normalize = require("../../lib/rank/util").normalize,
    Digraph = require("graphlib").Digraph;

describe("longestPath", function() {
  var g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1 }; });
  });

  it("can assign a rank to a single node graph", function() {
    g.setNode("a");
    longestPath(g);
    normalize(g);
    expect(g.getNode("a").rank).to.equal(0);
  });

  it("can assign ranks to unconnected nodes", function() {
    g.setNode("a");
    g.setNode("b");
    longestPath(g);
    normalize(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(0);
  });

  it("can assign ranks to connected nodes", function() {
    g.setEdge("a", "b");
    longestPath(g);
    normalize(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(1);
  });

  it("can assign ranks for a diamond", function() {
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);
    longestPath(g);
    normalize(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(1);
    expect(g.getNode("c").rank).to.equal(1);
    expect(g.getNode("d").rank).to.equal(2);
  });

  it("uses the minlen attribute on the edge", function() {
    g.setPath(["a", "b", "d"]);
    g.setEdge("a", "c");
    g.setEdge("c", "d", { minlen: 2 });
    longestPath(g);
    normalize(g);
    expect(g.getNode("a").rank).to.equal(0);
    // longest path biases towards the lowest rank it can assign
    expect(g.getNode("b").rank).to.equal(2);
    expect(g.getNode("c").rank).to.equal(1);
    expect(g.getNode("d").rank).to.equal(3);
  });
});
