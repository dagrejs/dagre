import {Graph} from "@dagrejs/graphlib";
import rank from "../../lib/rank";

describe("rank", () => {
    const RANKERS = [
        "longest-path", "tight-tree",
        "network-simplex", "unknown-should-still-work"
    ];
    let g: Graph;

    beforeEach(() => {
        g = new Graph()
            .setGraph({})
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({minlen: 1, weight: 1}))
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
                    const vRank = g.node(e.v).rank;
                    const wRank = g.node(e.w).rank;
                    expect(wRank - vRank).toBeGreaterThanOrEqual(g.edge(e).minlen);
                });
            });

            it("can rank a single node graph", () => {
                const g = new Graph().setGraph({}).setNode("a", {
                    rank: ranker
                });
                rank(g);
                expect(g.node("a").rank).toBe(0);
            });
        });
    });
});
