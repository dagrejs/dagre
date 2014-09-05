var _ = require("lodash"),
    expect = require("./chai").expect,
    normalGraph = require("../lib/normal-graph"),
    Digraph = require("graphlib").Digraph;

describe("normalGraph", function() {
  var g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultEdgeLabel(function() { return {}; });
  });

  describe("normalize", function() {
    it("does not change a short edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 1 });
      g.setEdge("a", "b");

      normalGraph.normalize(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(1);
    });

    it("splits a two layer edge into two segments", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b");

      normalGraph.normalize(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.getNode(successor).dummy).to.be.true;
      expect(g.getNode(successor).rank).to.equal(1);
      expect(g.successors(successor)).to.eql(["b"]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });
  });

  describe("denormalize", function() {
    it("reverses the normalize operation", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b");

      normalGraph.normalize(g);
      normalGraph.denormalize(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });
  });
});

function incidentNodes(edge) {
  return { v: edge.v, w: edge.w };
}
