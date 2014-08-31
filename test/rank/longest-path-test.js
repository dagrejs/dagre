var expect = require("../chai").expect,
    longestPath = require("../../lib/rank/longest-path"),
    Digraph = require("graphlib").Digraph;

describe("rank.longestPath", function() {
  it("can assign a rank to a single node graph", function() {
    var g = new Digraph()
      .setNode("n1", {});
    longestPath(g);
    expect(g.getNode("n1").rank).to.equal(0);
  });

  it("can assign a ranks to connected nodes", function() {
    var g = new Digraph()
      .setNode("n1", {})
      .setNode("n2", {})
      .setEdge("n1", "n2", { minlen: 1 });
    longestPath(g);
    expect(g.getNode("n1").rank).to.equal(g.getNode("n2").rank - 1);
  });

  it("can assign ranks for a diamond", function() {
    var g = new Digraph()
      .setNode("n1", {})
      .setNode("n2", {})
      .setNode("n3", {})
      .setNode("n4", {})
      .setEdge("n1", "n2", { minlen: 1 })
      .setEdge("n1", "n3", { minlen: 1 })
      .setEdge("n2", "n4", { minlen: 1 })
      .setEdge("n3", "n4", { minlen: 1 });
    longestPath(g);
    expect(g.getNode("n1").rank).to.equal(g.getNode("n4").rank - 2);
    expect(g.getNode("n2").rank).to.equal(g.getNode("n4").rank - 1);
    expect(g.getNode("n3").rank).to.equal(g.getNode("n4").rank - 1);
  });

  it("uses the minlen attribute on the edge", function() {
    var g = new Digraph()
      .setNode("n1", {})
      .setNode("n2", {})
      .setNode("n3", {})
      .setNode("n4", {})
      .setEdge("n1", "n2", { minlen: 1 })
      .setEdge("n1", "n3", { minlen: 1 })
      .setEdge("n2", "n4", { minlen: 1 })
      .setEdge("n3", "n4", { minlen: 2 });
    longestPath(g);
    expect(g.getNode("n1").rank).to.equal(g.getNode("n4").rank - 3);
    expect(g.getNode("n2").rank).to.equal(g.getNode("n4").rank - 1);
    expect(g.getNode("n3").rank).to.equal(g.getNode("n4").rank - 2);
  });
});
