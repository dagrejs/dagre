var _ = require("lodash"),
    expect = require("./chai").expect,
    normalize = require("../lib/normalize"),
    Graph = require("graphlib").Graph;

describe("normalize", function() {
  var g;

  beforeEach(function() {
    g = new Graph();
  });

  describe("run", function() {
    it("does not change a short edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 1 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(1);
    });

    it("splits a two layer edge into two segments", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.getNode(successor).dummy).to.be.true;
      expect(g.getNode(successor).rank).to.equal(1);
      expect(g.successors(successor)).to.eql(["b"]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });

    it("assigns width = 0, height = 0 to dummy nodes for an edge with no label", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.getNode(successor).width).to.equal(0);
      expect(g.getNode(successor).height).to.equal(0);
    });
  });

  describe("undo", function() {
    it("reverses the run operation", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);
      normalize.undo(g);

      expect(_.map(g.edges(), incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(2);
    });

    it("restores previous edge labels", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { foo: "bar" });

      normalize.run(g);
      normalize.undo(g);

      expect(g.getEdge("a", "b").foo).equals("bar");
    });

    it("collects assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      var dummyLabel = g.getNode(g.neighbors("a")[0]);
      dummyLabel.x = 5;
      dummyLabel.y = 10;

      normalize.undo(g);

      expect(g.getEdge("a", "b").points).eqls([{ x: 5, y: 10 }]);
    });

    it("merges assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      var aSucLabel = g.getNode(g.neighbors("a")[0]);
      aSucLabel.x = 5;
      aSucLabel.y = 10;

      var midLabel = g.getNode(g.successors(g.successors("a")[0])[0]);
      midLabel.x = 20;
      midLabel.y = 25;

      var bPredLabel = g.getNode(g.neighbors("b")[0]);
      bPredLabel.x = 100;
      bPredLabel.y = 200;

      normalize.undo(g);

      expect(g.getEdge("a", "b").points)
        .eqls([{ x: 5, y: 10 }, { x: 20, y: 25 }, { x: 100, y: 200 }]);
    });
  });
});

function incidentNodes(edge) {
  return { v: edge.v, w: edge.w };
}
