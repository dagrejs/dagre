var _ = require("lodash"),
    expect = require("../chai").expect,
    buildLayerMatrix = require("../../lib/util").buildLayerMatrix,
    markType1Conflicts = require("../../lib/position/bk").markType1Conflicts,
    Digraph = require("graphlib").Digraph;

describe("position/bk", function() {
  describe("markType1Conflicts", function() {
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

      markType1Conflicts(g, layering);

      expect(g.getEdge("a", "c").type1Conflict).to.be.undefined;
      expect(g.getEdge("b", "d").type1Conflict).to.be.undefined;
    });

    it("does not mark type-0 conflicts (no dummies)", function() {
      markType1Conflicts(g, layering);
      expect(g.getEdge("a", "d").type1Conflict).to.be.undefined;
      expect(g.getEdge("b", "c").type1Conflict).to.be.undefined;
    });

    _.each(["a", "b", "c", "d"], function(v) {
      it("does not mark type-0 conflicts (" + v + " is dummy)", function() {
        g.getNode(v).dummy = true;

        markType1Conflicts(g, layering);
        expect(g.getEdge("a", "d").type1Conflict).to.be.undefined;
        expect(g.getEdge("b", "c").type1Conflict).to.be.undefined;
      });
    });

    _.each(["a", "b", "c", "d"], function(v) {
      it("does mark type-1 conflicts (" + v + " is non-dummy)", function() {
        _.each(["a", "b", "c", "d"], function(w) {
          if (v !== w) {
            g.getNode(w).dummy = true;
          }
        });

        markType1Conflicts(g, layering);
        if (v === "a" || v === "d") {
          expect(g.getEdge("a", "d").type1Conflict).to.be.true;
          expect(g.getEdge("b", "c").type1Conflict).to.be.undefined;
        } else {
          expect(g.getEdge("a", "d").type1Conflict).to.be.undefined;
          expect(g.getEdge("b", "c").type1Conflict).to.be.true;
        }
      });
    });

    it("does not mark type-2 conflicts (all dummies)", function() {
      _.each(["a", "b", "c", "d"], function(v) {
        g.getNode(v).dummy = true;
      });

      markType1Conflicts(g, layering);
      expect(g.getEdge("a", "d").type1Conflict).to.be.undefined;
      expect(g.getEdge("b", "c").type1Conflict).to.be.undefined;
    });
  });
});
