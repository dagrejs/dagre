let rank = require("../../lib/rank");
let Graph = require("@dagrejs/graphlib").Graph;

describe("rank", () => {
  let RANKERS = [
    "longest-path", "tight-tree",
    "network-simplex", "unknown-should-still-work"
  ];
  let g;

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
          let vRank = g.node(e.v).rank;
          let wRank = g.node(e.w).rank;
          expect(wRank - vRank).toBeGreaterThanOrEqual(g.edge(e).minlen);
        });
      });

      it("can rank a single node graph", () => {
        let g = new Graph().setGraph({}).setNode("a", {});
        rank(g, ranker);
        expect(g.node("a").rank).toBe(0);
      });
    });
  });
});
