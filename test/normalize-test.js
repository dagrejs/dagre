var expect = require("./chai").expect;
var normalize = require("../lib/normalize");
var Graph = require("@dagrejs/graphlib").Graph;

describe("normalize", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ multigraph: true, compound: true }).setGraph({});
  });

  describe("run", function() {
    it("does not change a short edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 1 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.edges().map(incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.node("a").rank).to.equal(0);
      expect(g.node("b").rank).to.equal(1);
    });

    it("splits a two layer edge into two segments", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.node(successor).dummy).to.equal("edge");
      expect(g.node(successor).rank).to.equal(1);
      expect(g.successors(successor)).to.eql(["b"]);
      expect(g.node("a").rank).to.equal(0);
      expect(g.node("b").rank).to.equal(2);

      expect(g.graph().dummyChains).to.have.length(1);
      expect(g.graph().dummyChains[0]).to.equal(successor);
    });

    it("assigns width = 0, height = 0 to dummy nodes by default", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { width: 10, height: 10 });

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      var successor = g.successors("a")[0];
      expect(g.node(successor).width).to.equal(0);
      expect(g.node(successor).height).to.equal(0);
    });

    it("assigns width and height from the edge for the node on labelRank", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", { width: 20, height: 10, labelRank: 2 });

      normalize.run(g);

      var labelV = g.successors(g.successors("a")[0])[0];
      var labelNode = g.node(labelV);
      expect(labelNode.width).to.equal(20);
      expect(labelNode.height).to.equal(10);
    });

    it("preserves the weight for the edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { weight: 2 });

      normalize.run(g);

      expect(g.successors("a")).to.have.length(1);
      expect(g.edge("a", g.successors("a")[0]).weight).to.equal(2);
    });
  });

  describe("undo", function() {
    it("reverses the run operation", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);
      normalize.undo(g);

      expect(g.edges().map(incidentNodes)).to.eql([{ v: "a", w: "b" }]);
      expect(g.node("a").rank).to.equal(0);
      expect(g.node("b").rank).to.equal(2);
    });

    it("restores previous edge labels", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { foo: "bar" });

      normalize.run(g);
      normalize.undo(g);

      expect(g.edge("a", "b").foo).equals("bar");
    });

    it("collects assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      var dummyLabel = g.node(g.neighbors("a")[0]);
      dummyLabel.x = 5;
      dummyLabel.y = 10;

      normalize.undo(g);

      expect(g.edge("a", "b").points).eqls([{ x: 5, y: 10 }]);
    });

    it("merges assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      var aSucLabel = g.node(g.neighbors("a")[0]);
      aSucLabel.x = 5;
      aSucLabel.y = 10;

      var midLabel = g.node(g.successors(g.successors("a")[0])[0]);
      midLabel.x = 20;
      midLabel.y = 25;

      var bPredLabel = g.node(g.neighbors("b")[0]);
      bPredLabel.x = 100;
      bPredLabel.y = 200;

      normalize.undo(g);

      expect(g.edge("a", "b").points)
        .eqls([{ x: 5, y: 10 }, { x: 20, y: 25 }, { x: 100, y: 200 }]);
    });

    it("sets coords and dims for the label, if the edge has one", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { width: 10, height: 20, labelRank: 1 });

      normalize.run(g);

      var labelNode = g.node(g.successors("a")[0]);
      labelNode.x = 50;
      labelNode.y = 60;
      labelNode.width = 20;
      labelNode.height = 10;

      normalize.undo(g);

      expect(pick(g.edge("a", "b"), ["x", "y", "width", "height"])).eqls({
        x: 50, y: 60, width: 20, height: 10
      });
    });

    it("sets coords and dims for the label, if the long edge has one", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", { width: 10, height: 20, labelRank: 2 });

      normalize.run(g);

      var labelNode = g.node(g.successors(g.successors("a")[0])[0]);
      labelNode.x = 50;
      labelNode.y = 60;
      labelNode.width = 20;
      labelNode.height = 10;

      normalize.undo(g);

      expect(pick(g.edge("a", "b"), ["x", "y", "width", "height"])).eqls({
        x: 50, y: 60, width: 20, height: 10
      });
    });

    it("restores multi-edges", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {}, "bar");
      g.setEdge("a", "b", {}, "foo");

      normalize.run(g);

      var outEdges = g.outEdges("a").sort((a, b) => a.name.localeCompare(b.name));
      expect(outEdges).to.have.length(2);

      var barDummy = g.node(outEdges[0].w);
      barDummy.x = 5;
      barDummy.y = 10;

      var fooDummy = g.node(outEdges[1].w);
      fooDummy.x = 15;
      fooDummy.y = 20;

      normalize.undo(g);

      expect(g.hasEdge("a", "b")).to.be.false;
      expect(g.edge("a", "b", "bar").points).eqls([{ x: 5, y: 10 }]);
      expect(g.edge("a", "b", "foo").points).eqls([{ x: 15, y: 20 }]);
    });
  });
});

function incidentNodes(edge) {
  return { v: edge.v, w: edge.w };
}

function pick(obj, keys) {
  const picked = {};

  for (const key of keys) {
    picked[key] = obj[key];
  }

  return picked;
}
