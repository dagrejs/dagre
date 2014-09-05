var _ = require("lodash"),
    expect = require("../chai").expect,
    rank = require("../../lib/rank"),
    Digraph = require("graphlib").Digraph;

describe("rank", function() {
  var RANKERS = [
        "longest-path", "tight-tree",
        "network-simplex", "unknown-should-still-work"
      ],
      g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);
  });

  _.each(RANKERS, function(ranker) {
    describe(ranker, function() {
      it("has all nodes with rank >= 0", function() {
        var nodeIds = g.nodeIds();
        rank(g, ranker);
        _.each(nodeIds, function(v) {
          expect(g.getNode(v).rank).to.be.gte(0);
        });
      });

      it("has at least one node with rank = 0", function() {
        var nodeIds = g.nodeIds();
        rank(g, ranker);

        var rankZeroNode = _.find(nodeIds, function(v) {
          return g.getNode(v).rank === 0;
        });

        expect(rankZeroNode).to.defined;
      });

      it("respects the minlen attribute", function() {
        rank(g, ranker);
        _.each(g.edges(), function(edge) {
          var vRank = g.getNode(edge.v).rank,
              wRank = g.getNode(edge.w).rank;
          expect(wRank - vRank).to.be.gte(edge.label.minlen);
        });
      });

      it("can rank a single node graph", function() {
        var g = new Digraph().setNode("a", {});
        rank(g, ranker);
        expect(g.getNode("a").rank).to.equal(0);
      });

      it("can rank a disconnected graph", function() {
        var g = new Digraph();
        g.setNode("a", {});
        g.setNode("b", {});
        rank(g, ranker);
        expect(g.getNode("a").rank).to.equal(0);
        expect(g.getNode("b").rank).to.equal(0);
      });
    });
  });
});
