var _ = require("lodash"),
    expect = require("./chai").expect,
    normalize = require("../lib/normalize"),
    Digraph = require("graphlib").Digraph;

describe("normalize", function() {
  var g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultEdgeLabel(function() { return {}; });
  });

  describe("run", function() {
    it("does not change a short edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 1 });
      g.setEdge("a", "b");

      normalize.run(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(1);
    });

    it("splits a two layer edge into two segments", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b");

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.getNode(successor).dummy).to.be.true;
      expect(g.getNode(successor).rank).to.equal(1);
      expect(g.successors(successor)).to.eql(["b"]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });
  });

  describe("undo", function() {
    it("reverses the run operation", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b");

      normalize.run(g);
      normalize.undo(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });
  });
});

function incidentNodes(edge) {
  return { v: edge.v, w: edge.w };
}
