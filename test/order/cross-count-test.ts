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

    it("works for graph #1", () => {
        g.setPath(["a", "b", "c"]);
        g.setPath(["d", "e", "c"]);
        g.setPath(["a", "f", "i"]);
        g.setEdge("a", "e");
        expect(crossCount(g, [["a", "d"], ["b", "e", "f"], ["c", "i"]])).toBe(1);
        expect(crossCount(g, [["d", "a"], ["e", "b", "f"], ["c", "i"]])).toBe(0);
    });
});
