import {Graph} from "@dagrejs/graphlib";
import networkSimplex from "../../lib/rank/network-simplex";
import {longestPath,} from "../../lib/rank/util";
import {normalizeRanks} from "../../lib/util";
import {Edge} from "../../lib/types";

const initLowLimValues = networkSimplex.initLowLimValues;
const initCutValues = networkSimplex.initCutValues;
const calcCutValue = networkSimplex.calcCutValue;
const leaveEdge = networkSimplex.leaveEdge;
const enterEdge = networkSimplex.enterEdge;
const exchangeEdges = networkSimplex.exchangeEdges;

describe("network simplex", () => {
    let g: Graph;
    let t: Graph;
    let gansnerGraph: Graph;
    let gansnerTree: Graph;

    beforeEach(() => {
        g = new Graph({multigraph: true})
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({minlen: 1, weight: 1}));

        t = new Graph({directed: false})
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({}));

        gansnerGraph = new Graph()
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({minlen: 1, weight: 1}))
            .setPath(["a", "b", "c", "d", "h"])
            .setPath(["a", "e", "g", "h"])
            .setPath(["a", "f", "g"]);

        gansnerTree = new Graph({directed: false})
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({}))
            .setPath(["a", "b", "c", "d", "h", "g", "e"])
            .setEdge("g", "f");
    });

    it("can assign a rank to a single node", () => {
        g.setNode("a");
        ns(g);
        expect(g.node("a").rank).toBe(0);
    });

    it("can assign a rank to a 2-node connected graph", () => {
        g.setEdge("a", "b");
        ns(g);
        expect(g.node("a").rank).toBe(0);
        expect(g.node("b").rank).toBe(1);
    });

    it("can assign ranks for a diamond", () => {
        g.setPath(["a", "b", "d"]);
        g.setPath(["a", "c", "d"]);
        ns(g);
        expect(g.node("a").rank).toBe(0);
        expect(g.node("b").rank).toBe(1);
        expect(g.node("c").rank).toBe(1);
        expect(g.node("d").rank).toBe(2);
    });

    it("uses the minlen attribute on the edge", () => {
        g.setPath(["a", "b", "d"]);
        g.setEdge("a", "c");
        g.setEdge("c", "d", {minlen: 2});
        ns(g);
        expect(g.node("a").rank).toBe(0);
        // longest path biases towards the lowest rank it can assign. Since the
        // graph has no optimization opportunities we can assume that the longest
        // path ranking is used.
        expect(g.node("b").rank).toBe(2);
        expect(g.node("c").rank).toBe(1);
        expect(g.node("d").rank).toBe(3);
    });

    it("can rank the gansner graph", () => {
        g = gansnerGraph;
        ns(g);
        expect(g.node("a").rank).toBe(0);
        expect(g.node("b").rank).toBe(1);
        expect(g.node("c").rank).toBe(2);
        expect(g.node("d").rank).toBe(3);
        expect(g.node("h").rank).toBe(4);
        expect(g.node("e").rank).toBe(1);
        expect(g.node("f").rank).toBe(1);
        expect(g.node("g").rank).toBe(2);
    });

    it("can handle multi-edges", () => {
        g.setPath(["a", "b", "c", "d"]);
        g.setEdge("a", "e", {weight: 2, minlen: 1});
        g.setEdge("e", "d");
        g.setEdge("b", "c", {weight: 1, minlen: 2}, "multi");
        ns(g);
        expect(g.node("a").rank).toBe(0);
        expect(g.node("b").rank).toBe(1);
        // b -> c has minlen = 1 and minlen = 2, so it should be 2 ranks apart.
        expect(g.node("c").rank).toBe(3);
        expect(g.node("d").rank).toBe(4);
        expect(g.node("e").rank).toBe(1);
    });

    describe("leaveEdge", () => {
        it("returns undefined if there is no edge with a negative cutvalue", () => {
            const tree = new Graph({directed: false});
            tree.setEdge("a", "b", {cutvalue: 1});
            tree.setEdge("b", "c", {cutvalue: 1});
            expect(leaveEdge(tree)).toBeUndefined();
        });

        it("returns an edge if one is found with a negative cutvalue", () => {
            const tree = new Graph({directed: false});
            tree.setEdge("a", "b", {cutvalue: 1});
            tree.setEdge("b", "c", {cutvalue: -1});
            expect(leaveEdge(tree)).toEqual({v: "b", w: "c"});
        });
    });

    describe("enterEdge", () => {
        it("finds an edge from the head to tail component", () => {
            g
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 2})
                .setNode("c", {rank: 3})
                .setPath(["a", "b", "c"])
                .setEdge("a", "c");
            t.setPath(["b", "c", "a"]);
            initLowLimValues(t, "c");

            const f = enterEdge(t, g, {v: "b", w: "c"});
            expect(undirectedEdge(f)).toEqual(undirectedEdge({v: "a", w: "b"}));
        });

        it("works when the root of the tree is in the tail component", () => {
            g
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 2})
                .setNode("c", {rank: 3})
                .setPath(["a", "b", "c"])
                .setEdge("a", "c");
            t.setPath(["b", "c", "a"]);
            initLowLimValues(t, "b");

            const f = enterEdge(t, g, {v: "b", w: "c"});
            expect(undirectedEdge(f)).toEqual(undirectedEdge({v: "a", w: "b"}));
        });

        it("finds the edge with the least slack", () => {
            g
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 1})
                .setNode("c", {rank: 3})
                .setNode("d", {rank: 4})
                .setEdge("a", "d")
                .setPath(["a", "c", "d"])
                .setEdge("b", "c");
            t.setPath(["c", "d", "a", "b"]);
            initLowLimValues(t, "a");

            const f = enterEdge(t, g, {v: "c", w: "d"});
            expect(undirectedEdge(f)).toEqual(undirectedEdge({v: "b", w: "c"}));
        });

        it("finds an appropriate edge for gansner graph #1", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t, "a");

            const f = enterEdge(t, g, {v: "g", w: "h"});
            expect(undirectedEdge(f).v).toBe("a");
            expect(["e", "f"]).toEqual(expect.arrayContaining([undirectedEdge(f).w]));
        });

        it("finds an appropriate edge for gansner graph #2", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t, "e");

            const f = enterEdge(t, g, {v: "g", w: "h"});
            expect(undirectedEdge(f).v).toBe("a");
            expect(["e", "f"]).toEqual(expect.arrayContaining([undirectedEdge(f).w]));
        });

        it("finds an appropriate edge for gansner graph #3", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t, "a");

            const f = enterEdge(t, g, {v: "h", w: "g"});
            expect(undirectedEdge(f).v).toBe("a");
            expect(["e", "f"]).toEqual(expect.arrayContaining([undirectedEdge(f).w]));
        });

        it("finds an appropriate edge for gansner graph #4", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t, "e");

            const f = enterEdge(t, g, {v: "h", w: "g"});
            expect(undirectedEdge(f).v).toBe("a");
            expect(["e", "f"]).toEqual(expect.arrayContaining([undirectedEdge(f).w]));
        });
    });

    describe("initLowLimValues", () => {
        it("assigns low, lim, and parent for each node in a tree", () => {
            const g = new Graph()
                .setDefaultNodeLabel(() => ({}))
                .setNodes(["a", "b", "c", "d", "e"])
                .setPath(["a", "b", "a", "c", "d", "c", "e"]);

            initLowLimValues(g, "a");

            const a = g.node("a");
            const b = g.node("b");
            const c = g.node("c");
            const d = g.node("d");
            const e = g.node("e");

            expect(g.nodes().map(v => g.node(v).lim).sort()).toEqual([1, 2, 3, 4, 5]);

            expect(a).toEqual({low: 1, lim: 5});

            expect(b.parent).toBe("a");
            expect(b.lim).toBeLessThan(a.lim);

            expect(c.parent).toBe("a");
            expect(c.lim).toBeLessThan(a.lim);
            expect(c.lim).not.toBe(b.lim);

            expect(d.parent).toBe("c");
            expect(d.lim).toBeLessThan(c.lim);

            expect(e.parent).toBe("c");
            expect(e.lim).toBeLessThan(c.lim);
            expect(e.lim).not.toBe(d.lim);
        });
    });

    describe("exchangeEdges", () => {
        it("exchanges edges and updates cut values and low/lim numbers", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t);

            exchangeEdges(t, g, {v: "g", w: "h"}, {v: "a", w: "e"});

            // check new cut values
            expect(t.edge("a", "b").cutvalue).toBe(2);
            expect(t.edge("b", "c").cutvalue).toBe(2);
            expect(t.edge("c", "d").cutvalue).toBe(2);
            expect(t.edge("d", "h").cutvalue).toBe(2);
            expect(t.edge("a", "e").cutvalue).toBe(1);
            expect(t.edge("e", "g").cutvalue).toBe(1);
            expect(t.edge("g", "f").cutvalue).toBe(0);

            // ensure lim numbers look right
            const lims = t.nodes().map(v => t.node(v).lim).sort();
            expect(lims).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });

        it("updates ranks", () => {
            g = gansnerGraph;
            t = gansnerTree;
            longestPath(g);
            initLowLimValues(t);

            exchangeEdges(t, g, {v: "g", w: "h"}, {v: "a", w: "e"});
            normalizeRanks(g);

            // check new ranks
            expect(g.node("a").rank).toBe(0);
            expect(g.node("b").rank).toBe(1);
            expect(g.node("c").rank).toBe(2);
            expect(g.node("d").rank).toBe(3);
            expect(g.node("e").rank).toBe(1);
            expect(g.node("f").rank).toBe(1);
            expect(g.node("g").rank).toBe(2);
            expect(g.node("h").rank).toBe(4);
        });
    });

    // Note: we use p for parent, c for child, gc_x for grandchild nodes, and o for
    // other nodes in the tree for these tests.
    describe("calcCutValue", () => {
        it("works for a 2-node tree with c -> p", () => {
            g.setPath(["c", "p"]);
            t.setPath(["p", "c"]);
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(1);
        });

        it("works for a 2-node tree with c <- p", () => {
            g.setPath(["p", "c"]);
            t.setPath(["p", "c"]);
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(1);
        });

        it("works for 3-node tree with gc -> c -> p", () => {
            g.setPath(["gc", "c", "p"]);
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("p", "c");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(3);
        });

        it("works for 3-node tree with gc -> c <- p", () => {
            g
                .setEdge("p", "c")
                .setEdge("gc", "c");
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("p", "c");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-1);
        });

        it("works for 3-node tree with gc <- c -> p", () => {
            g
                .setEdge("c", "p")
                .setEdge("c", "gc");
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("p", "c");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-1);
        });

        it("works for 3-node tree with gc <- c <- p", () => {
            g.setPath(["p", "c", "gc"]);
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("p", "c");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(3);
        });

        it("works for 4-node tree with gc -> c -> p -> o, with o -> c", () => {
            g
                .setEdge("o", "c", {weight: 7})
                .setPath(["gc", "c", "p", "o"]);
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setPath(["c", "p", "o"]);
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-4);
        });

        it("works for 4-node tree with gc -> c -> p -> o, with o <- c", () => {
            g
                .setEdge("c", "o", {weight: 7})
                .setPath(["gc", "c", "p", "o"]);
            t
                .setEdge("gc", "c", {cutvalue: 3})
                .setPath(["c", "p", "o"]);
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(10);
        });

        it("works for 4-node tree with o -> gc -> c -> p, with o -> c", () => {
            g
                .setEdge("o", "c", {weight: 7})
                .setPath(["o", "gc", "c", "p"]);
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-4);
        });

        it("works for 4-node tree with o -> gc -> c -> p, with o <- c", () => {
            g
                .setEdge("c", "o", {weight: 7})
                .setPath(["o", "gc", "c", "p"]);
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(10);
        });

        it("works for 4-node tree with gc -> c <- p -> o, with o -> c", () => {
            g
                .setEdge("gc", "c")
                .setEdge("p", "c")
                .setEdge("p", "o")
                .setEdge("o", "c", {weight: 7});
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(6);
        });

        it("works for 4-node tree with gc -> c <- p -> o, with o <- c", () => {
            g
                .setEdge("gc", "c")
                .setEdge("p", "c")
                .setEdge("p", "o")
                .setEdge("c", "o", {weight: 7});
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-8);
        });

        it("works for 4-node tree with o -> gc -> c <- p, with o -> c", () => {
            g
                .setEdge("o", "c", {weight: 7})
                .setPath(["o", "gc", "c"])
                .setEdge("p", "c");
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(6);
        });

        it("works for 4-node tree with o -> gc -> c <- p, with o <- c", () => {
            g
                .setEdge("c", "o", {weight: 7})
                .setPath(["o", "gc", "c"])
                .setEdge("p", "c");
            t
                .setEdge("o", "gc")
                .setEdge("gc", "c", {cutvalue: 3})
                .setEdge("c", "p");
            initLowLimValues(t, "p");

            expect(calcCutValue(t, g, "c")).toBe(-8);
        });
    });

    describe("initCutValues", () => {
        it("works for gansnerGraph", () => {
            initLowLimValues(gansnerTree);
            initCutValues(gansnerTree, gansnerGraph);
            expect(gansnerTree.edge("a", "b").cutvalue).toBe(3);
            expect(gansnerTree.edge("b", "c").cutvalue).toBe(3);
            expect(gansnerTree.edge("c", "d").cutvalue).toBe(3);
            expect(gansnerTree.edge("d", "h").cutvalue).toBe(3);
            expect(gansnerTree.edge("g", "h").cutvalue).toBe(-1);
            expect(gansnerTree.edge("e", "g").cutvalue).toBe(0);
            expect(gansnerTree.edge("f", "g").cutvalue).toBe(0);
        });

        it("works for updated gansnerGraph", () => {
            gansnerTree.removeEdge("g", "h");
            gansnerTree.setEdge("a", "e");
            initLowLimValues(gansnerTree);
            initCutValues(gansnerTree, gansnerGraph);
            expect(gansnerTree.edge("a", "b").cutvalue).toBe(2);
            expect(gansnerTree.edge("b", "c").cutvalue).toBe(2);
            expect(gansnerTree.edge("c", "d").cutvalue).toBe(2);
            expect(gansnerTree.edge("d", "h").cutvalue).toBe(2);
            expect(gansnerTree.edge("a", "e").cutvalue).toBe(1);
            expect(gansnerTree.edge("e", "g").cutvalue).toBe(1);
            expect(gansnerTree.edge("f", "g").cutvalue).toBe(0);
        });
    });
});

function ns(g: Graph) {
    networkSimplex(g);
    normalizeRanks(g);
}

function undirectedEdge(e: Edge) {
    return e.v < e.w ? {v: e.v, w: e.w} : {v: e.w, w: e.v};
}
