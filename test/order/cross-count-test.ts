import {Graph} from "@dagrejs/graphlib";
import crossCount from "../../lib/order/cross-count";

describe("crossCount", () => {
    let g: Graph;

    beforeEach(() => {
        g = new Graph()
            .setDefaultEdgeLabel(() => ({weight: 1}));
    });

    it("returns 0 for an empty layering", () => {
        expect(crossCount(g, [])).toBe(0);
    });

    it("returns 0 for a layering with no crossings", () => {
        g.setEdge("a1", "b1");
        g.setEdge("a2", "b2");
        expect(crossCount(g, [["a1", "a2"], ["b1", "b2"]])).toBe(0);
    });

    it("returns 1 for a layering with 1 crossing", () => {
        g.setEdge("a1", "b1");
        g.setEdge("a2", "b2");
        expect(crossCount(g, [["a1", "a2"], ["b2", "b1"]])).toBe(1);
    });

    it("returns a weighted crossing count for a layering with 1 crossing", () => {
        g.setEdge("a1", "b1", {weight: 2});
        g.setEdge("a2", "b2", {weight: 3});
        expect(crossCount(g, [["a1", "a2"], ["b2", "b1"]])).toBe(6);
    });

    it("calculates crossings across layers", () => {
        g.setPath(["a1", "b1", "c1"]);
        g.setPath(["a2", "b2", "c2"]);
        expect(crossCount(g, [["a1", "a2"], ["b2", "b1"], ["c1", "c2"]])).toBe(2);
    });

    it("counts crossings for edges leaving the same node based on tail offsets", () => {
        g.setEdge("a", "b", {weight: 1, tailport: -10});
        g.setEdge("a", "c", {weight: 1, tailport: 10});

        expect(crossCount(g, [["a"], ["b", "c"]])).toBe(0);
        expect(crossCount(g, [["a"], ["c", "b"]])).toBe(1);
    });

    it("counts crossings for edges entering the same node based on head offsets", () => {
        g.setEdge("a", "c", {weight: 1, headport: 10});
        g.setEdge("b", "c", {weight: 1, headport: -10});

        expect(crossCount(g, [["a", "b"], ["c"]])).toBe(1);
        expect(crossCount(g, [["b", "a"], ["c"]])).toBe(0);
    });

    it("ignores edges outside the active bilayer when computing head-offset crossings", () => {
        g.setEdge("a", "c", {weight: 1, headport: 10});
        g.setEdge("b", "c", {weight: 1, headport: -10});
        g.setEdge("a", "d", {weight: 1});

        expect(crossCount(g, [["a", "b"], ["c"], ["d"]])).toBe(1);
        expect(crossCount(g, [["b", "a"], ["c"], ["d"]])).toBe(0);
    });

    it("honors head offsets when ordering distinct head nodes", () => {
        g.setEdge("a", "c", {weight: 1, headport: 10});
        g.setEdge("a", "d", {weight: 1, headport: -10});
        g.setEdge("b", "c", {weight: 1, headport: -10});
        g.setEdge("b", "d", {weight: 1, headport: 10});

        expect(crossCount(g, [["a", "b"], ["c", "d"]])).toBe(2);
    });

    it("works for graph #1", () => {
        g.setPath(["a", "b", "c"]);
        g.setPath(["d", "e", "c"]);
        g.setPath(["a", "f", "i"]);
        g.setEdge("a", "e");
        expect(crossCount(g, [["a", "d"], ["b", "e", "f"], ["c", "i"]])).toBe(1);
        expect(crossCount(g, [["d", "a"], ["e", "b", "f"], ["c", "i"]])).toBe(0);
    });
});
