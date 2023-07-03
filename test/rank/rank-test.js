var expect = require("../chai").expect;
var rank = require("../../lib/rank");
var Graph = require("@dagrejs/graphlib").Graph;

describe("rank", () => {
  var RANKERS = [
    "longest-path", "tight-tree",
    "network-simplex", "unknown-should-still-work"
  ];
  var g;

  beforeEach(() => {
    g = new Graph()
      .setGraph({})
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({ minlen: 1, weight: 1 }))
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);
  });

  RANKERS.forEach(ranker => {
    describe(ranker, () => {
      it("respects the minlen attribute", () => {
        g.graph().ranker = ranker;
        rank(g);
        g.edges().forEach(e => {
          var vRank = g.node(e.v).rank;
          var wRank = g.node(e.w).rank;
          expect(wRank - vRank).to.be.gte(g.edge(e).minlen);
        });
      });

      it("can rank a single node graph", () => {
        var g = new Graph().setGraph({}).setNode("a", {});
        rank(g, ranker);
        expect(g.node("a").rank).to.equal(0);
      });
    });
  });
});
