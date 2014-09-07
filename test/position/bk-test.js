var _ = require("lodash"),
    expect = require("../chai").expect,
    buildLayerMatrix = require("../../lib/util").buildLayerMatrix,
    bk = require("../../lib/position/bk"),
    collectType1Conflicts = bk.collectType1Conflicts,
    addType1Conflict = bk.addType1Conflict,
    hasType1Conflict = bk.hasType1Conflict,
    verticalAlignment = bk.verticalAlignment,
    horizontalCompaction = bk.horizontalCompaction,
    alignCoordinates = bk.alignCoordinates,
    balance = bk.balance,
    findSmallestWidthAlignment = bk.findSmallestWidthAlignment,
    Digraph = require("graphlib").Digraph;

describe("position/bk", function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
  });

  describe("collectType1Conflicts", function() {
    var layering;

    beforeEach(function() {
      g
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

  describe("horizonalCompaction", function() {
    it("places the center of a single node graph as origin (0,0)", function() {
      g.setNode("a", { rank: 0, order: 0, align: "a", root: "a" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g));
      expect(xs.a).to.equal(0);
    });

    it("separates adjacent nodes by specified node separation", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100, align: "a", root: "a" });
      g.setNode("b", { rank: 0, order: 1, width: 200, align: "b", root: "b" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g), { nodesep: 100 });
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(100 / 2 + 100 + 200 / 2);
    });

    it("separates adjacent edges by specified node separation", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100, align: "a", root: "a", dummy: true });
      g.setNode("b", { rank: 0, order: 1, width: 200, align: "b", root: "b", dummy: true });

      var xs = horizontalCompaction(g, buildLayerMatrix(g), { edgesep: 20 });
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(100 / 2 + 20 + 200 / 2);
    });

    it("aligns the centers of nodes in the same block", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100, align: "b", root: "a" });
      g.setNode("b", { rank: 1, order: 0, width: 200, align: "a", root: "a" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g));
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(0);
    });

    it("separates blocks with the appropriate separation", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100, align: "b", root: "a" });
      g.setNode("b", { rank: 1, order: 1, width: 200, align: "a", root: "a" });
      g.setNode("c", { rank: 1, order: 0, width:  50, align: "c", root: "c" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g), { nodesep: 75 });
      expect(xs.a).to.equal(50 / 2 + 75 + 200 / 2);
      expect(xs.b).to.equal(50 / 2 + 75 + 200 / 2);
      expect(xs.c).to.equal(0);
    });

    it("separates classes with the appropriate separation", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100, align: "a", root: "a" });
      g.setNode("b", { rank: 0, order: 1, width: 200, align: "d", root: "b" });
      g.setNode("c", { rank: 1, order: 0, width:  50, align: "c", root: "c" });
      g.setNode("d", { rank: 1, order: 1, width:  80, align: "b", root: "b" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g), { nodesep: 75 });
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(100 / 2 + 75 + 200 / 2);
      expect(xs.c).to.equal(100 / 2 + 75 + 200 / 2 - 80 / 2 - 75 - 50 / 2);
      expect(xs.d).to.equal(100 / 2 + 75 + 200 / 2);
    });

    it("shifts classes by max sep from the adjacent block #1", function() {
      g.setNode("a", { rank: 0, order: 0, width:  50, align: "c", root: "a" });
      g.setNode("b", { rank: 0, order: 1, width: 150, align: "d", root: "b" });
      g.setNode("c", { rank: 1, order: 0, width:  60, align: "a", root: "a" });
      g.setNode("d", { rank: 1, order: 1, width:  70, align: "b", root: "b" });

      var xs =horizontalCompaction(g, buildLayerMatrix(g), { nodesep: 75 });
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(50 / 2 + 75 + 150 / 2);
      expect(xs.c).to.equal(0);
      expect(xs.d).to.equal(50 / 2 + 75 + 150 / 2);
    });

    it("shifts classes by max sep from the adjacent block #2", function() {
      g.setNode("a", { rank: 0, order: 0, width:  50, align: "c", root: "a" });
      g.setNode("b", { rank: 0, order: 1, width:  70, align: "d", root: "b" });
      g.setNode("c", { rank: 1, order: 0, width:  60, align: "a", root: "a" });
      g.setNode("d", { rank: 1, order: 1, width: 150, align: "b", root: "b" });

      var xs = horizontalCompaction(g, buildLayerMatrix(g), { nodesep: 75 });
      expect(xs.a).to.equal(0);
      expect(xs.b).to.equal(50 / 2 + 75 + 150 / 2);
      expect(xs.c).to.equal(0);
      expect(xs.d).to.equal(50 / 2 + 75 + 150 / 2);
    });
  });

  describe("alignCoordinates", function() {
    it("aligns a single node", function() {
      var xss = {
        ul: { a:  50 },
        ur: { a: 100 },
        dl: { a:  50 },
        dr: { a: 200 }
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).to.eql({ a: 50 });
      expect(xss.ur).to.eql({ a: 50 });
      expect(xss.dl).to.eql({ a: 50 });
      expect(xss.dr).to.eql({ a: 50 });
    });

    it("aligns multiple nodes", function() {
      var xss = {
        ul: { a:  50, b: 1000 },
        ur: { a: 100, b:  900 },
        dl: { a: 150, b:  800 },
        dr: { a: 200, b:  700 }
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).to.eql({ a:  50, b: 1000 });
      expect(xss.ur).to.eql({ a: 200, b: 1000 });
      expect(xss.dl).to.eql({ a:  50, b:  700 });
      expect(xss.dr).to.eql({ a: 500, b: 1000 });
    });
  });

  describe("findSmallestWidthAlignment", function() {
    it("finds the alignment with the smallest width", function() {
      g.setNode("a", { width: 50 });
      g.setNode("b", { width: 50 });

      var xss = {
        ul: { a:  0, b: 1000 },
        ur: { a: -5, b: 1000 },
        dl: { a:  5, b: 2000 },
        dr: { a:  0, b:  200 },
      };

      expect(findSmallestWidthAlignment(g, xss)).to.eql(xss.dr);
    });

    it("takes node width into account", function() {
      g.setNode("a", { width:  50 });
      g.setNode("b", { width:  50 });
      g.setNode("c", { width: 200 });

      var xss = {
        ul: { a:  0, b: 100, c: 75 },
        ur: { a:  0, b: 100, c: 80 },
        dl: { a:  0, b: 100, c: 85 },
        dr: { a:  0, b: 100, c: 90 },
      };

      expect(findSmallestWidthAlignment(g, xss)).to.eql(xss.ul);
    });
  });

  describe("balance", function() {
    it("aligns a single node to the shared median value", function() {
      var xss = {
        ul: { a:   0 },
        ur: { a: 100 },
        dl: { a: 100 },
        dr: { a: 200 }
      };

      expect(balance(xss)).to.eql({ a: 100 });
    });

    it("aligns a single node to the average of different median values", function() {
      var xss = {
        ul: { a:   0 },
        ur: { a:  75 },
        dl: { a: 125 },
        dr: { a: 200 }
      };

      expect(balance(xss)).to.eql({ a: 100 });
    });

    it("balances multiple nodes", function() {
      var xss = {
        ul: { a:   0, b: 50 },
        ur: { a:  75, b:  0 },
        dl: { a: 125, b: 60 },
        dr: { a: 200, b: 75 }
      };

      expect(balance(xss)).to.eql({ a: 100, b: 55 });
    });
  });
});
