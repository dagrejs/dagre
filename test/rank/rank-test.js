var _ = require("lodash"),
    expect = require("../chai").expect,
    rank = require("../../lib/rank"),
    Graph = require("graphlib").Graph;

describe("rank", function() {
  var RANKERS = [
        "longest-path", "tight-tree",
        "network-simplex", "unknown-should-still-work"
      ],
      g;

  beforeEach(function() {
    g = new Graph()
      .setGraph({})
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);
  });

  _.each(RANKERS, function(ranker) {
    describe(ranker, function() {
      it("respects the minlen attribute", function() {
        g.graph().ranker = ranker;
        rank(g);
        _.each(g.edges(), function(e) {
          var vRank = g.node(e.v).rank,
              wRank = g.node(e.w).rank;
          expect(wRank - vRank).to.be.gte(g.edge(e).minlen);
        });
      });

      it("can rank a single node graph", function() {
        var g = new Graph().setGraph({}).setNode("a", {});
        rank(g, ranker);
        expect(g.node("a").rank).to.equal(0);
      });
    });
  });
});
