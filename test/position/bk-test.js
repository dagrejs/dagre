var _ = require("lodash"),
    expect = require("../chai").expect,
    buildLayerMatrix = require("../../lib/util").buildLayerMatrix,
    bk = require("../../lib/position/bk"),
    collectType1Conflicts = bk.collectType1Conflicts,
    addType1Conflict = bk.addType1Conflict,
    hasType1Conflict = bk.hasType1Conflict,
    verticalAlignment = bk.verticalAlignment,
    Digraph = require("graphlib").Digraph;

describe("position/bk", function() {
  describe("collectType1Conflicts", function() {
    var g;
    var layering;

    beforeEach(function() {
      g = new Digraph()
        .setDefaultEdgeLabel(function() { return {}; })
        .setNode("a", { rank: 0, order: 0 })
        .setNode("b", { rank: 0, order: 1 })
        .setNode("c", { rank: 1, order: 0 })
        .setNode("d", { rank: 1, order: 1 })
        // Set up crossing
        .setEdge("a", "d")
        .setEdge("b", "c");

      layering = buildLayerMatrix(g);
    });

    it("does not mark edges that have no conflict", function() {
      g.removeEdge("a", "d");
      g.removeEdge("b", "c");
      g.setEdge("a", "c");
      g.setEdge("b", "d");

      var conflicts = collectType1Conflicts(g, layering);
      expect(hasType1Conflict(conflicts, "a", "c")).to.be.false;
      expect(hasType1Conflict(conflicts, "b", "d")).to.be.false;
    });

    it("does not mark type-0 conflicts (no dummies)", function() {
      var conflicts = collectType1Conflicts(g, layering);
      expect(hasType1Conflict(conflicts, "a", "d")).to.be.false;
      expect(hasType1Conflict(conflicts, "b", "c")).to.be.false;
    });

    _.each(["a", "b", "c", "d"], function(v) {
      it("does not mark type-0 conflicts (" + v + " is dummy)", function() {
        g.getNode(v).dummy = true;

        var conflicts = collectType1Conflicts(g, layering);
        expect(hasType1Conflict(conflicts, "a", "d")).to.be.false;
        expect(hasType1Conflict(conflicts, "b", "c")).to.be.false;
      });
    });

    _.each(["a", "b", "c", "d"], function(v) {
      it("does mark type-1 conflicts (" + v + " is non-dummy)", function() {
        _.each(["a", "b", "c", "d"], function(w) {
          if (v !== w) {
            g.getNode(w).dummy = true;
          }
        });

        var conflicts = collectType1Conflicts(g, layering);
        if (v === "a" || v === "d") {
          expect(hasType1Conflict(conflicts, "a", "d")).to.be.true;
          expect(hasType1Conflict(conflicts, "b", "c")).to.be.false;
        } else {
          expect(hasType1Conflict(conflicts, "a", "d")).to.be.false;
          expect(hasType1Conflict(conflicts, "b", "c")).to.be.true;
        }
      });
    });

    it("does not mark type-2 conflicts (all dummies)", function() {
      _.each(["a", "b", "c", "d"], function(v) {
        g.getNode(v).dummy = true;
      });

      var conflicts = collectType1Conflicts(g, layering);
      expect(hasType1Conflict(conflicts, "a", "d")).to.be.false;
      expect(hasType1Conflict(conflicts, "b", "c")).to.be.false;
      collectType1Conflicts(g, layering);
    });
  });

  describe("hasType1Conflict", function() {
    it("can test for a type-1 conflict regardless of edge orientation", function() {
      var conflicts = {};
      addType1Conflict(conflicts, "b", "a");
      expect(hasType1Conflict(conflicts, "a", "b")).to.be.true;
      expect(hasType1Conflict(conflicts, "b", "a")).to.be.true;
    });

    it("works for multiple conflicts with the same node", function() {
      var conflicts = {};
      addType1Conflict(conflicts, "a", "b");
      addType1Conflict(conflicts, "a", "c");
      expect(hasType1Conflict(conflicts, "a", "b")).to.be.true;
      expect(hasType1Conflict(conflicts, "a", "c")).to.be.true;
    });
  });

  describe("verticalAlignment", function() {
    var g;

    beforeEach(function() {
      g = new Digraph();
    });

    it("Aligns with itself if the node has no adjacencies", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("a");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("b");
      expect(g.getNode("b").root).to.equal("b");
    });

    it("Aligns with its sole adjacency", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });
      g.setEdge("a", "b");

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("b");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("a");
      expect(g.getNode("b").root).to.equal("a");
    });

    it("aligns with its left median when possible", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setEdge("a", "c");
      g.setEdge("b", "c");

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("c");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("b");
      expect(g.getNode("b").root).to.equal("b");
      expect(g.getNode("c").align).to.equal("a");
      expect(g.getNode("c").root).to.equal("a");
    });

    it("aligns with its right median when left is unavailable", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setEdge("a", "c");
      g.setEdge("b", "c");

      var layering = buildLayerMatrix(g),
          conflicts = {};

      addType1Conflict(conflicts, "a", "c");

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("a");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("c");
      expect(g.getNode("b").root).to.equal("b");
      expect(g.getNode("c").align).to.equal("b");
      expect(g.getNode("c").root).to.equal("b");
    });

    it("aligns with neither median if both are unavailable", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setNode("d", { rank: 1, order: 1 });
      g.setEdge("a", "d");
      g.setEdge("b", "c");
      g.setEdge("b", "d");

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      // c will align with b, so d will not be able to align with a, because
      // (a,d) and (c,b) cross.
      expect(g.getNode("a").align).to.equal("a");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("c");
      expect(g.getNode("b").root).to.equal("b");
      expect(g.getNode("c").align).to.equal("b");
      expect(g.getNode("c").root).to.equal("b");
      expect(g.getNode("d").align).to.equal("d");
      expect(g.getNode("d").root).to.equal("d");
    });

    it("aligns with the single median for an odd number of adjacencies", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 0, order: 2 });
      g.setNode("d", { rank: 1, order: 0 });
      g.setEdge("a", "d");
      g.setEdge("b", "d");
      g.setEdge("c", "d");

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("a");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("d");
      expect(g.getNode("b").root).to.equal("b");
      expect(g.getNode("c").align).to.equal("c");
      expect(g.getNode("c").root).to.equal("c");
      expect(g.getNode("d").align).to.equal("b");
      expect(g.getNode("d").root).to.equal("b");
    });

    it("aligns blocks across multiple layers", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });
      g.setNode("c", { rank: 1, order: 1 });
      g.setNode("d", { rank: 2, order: 0 });
      g.setPath(["a", "b", "d"]);
      g.setPath(["a", "c", "d"]);

      var layering = buildLayerMatrix(g),
          conflicts = {};

      verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(g.getNode("a").align).to.equal("b");
      expect(g.getNode("a").root).to.equal("a");
      expect(g.getNode("b").align).to.equal("d");
      expect(g.getNode("b").root).to.equal("a");
      expect(g.getNode("c").align).to.equal("c");
      expect(g.getNode("c").root).to.equal("c");
      expect(g.getNode("d").align).to.equal("a");
      expect(g.getNode("d").root).to.equal("a");
    });
  });
});
