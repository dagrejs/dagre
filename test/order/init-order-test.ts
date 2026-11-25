import {Graph} from "../../lib/graph-lib";
import initOrder from "../../lib/order/init-order";

describe("order/initOrder", () => {
    let g: Graph;

    beforeEach(() => {
        g = new Graph({compound: true})
            .setDefaultEdgeLabel(() => ({weight: 1}));
    });

    it("assigns non-overlapping orders for each rank in a tree", () => {
        Object.entries({a: 0, b: 1, c: 2, d: 2, e: 1}).forEach(([v, rank]) => {
            g.setNode(v, {rank: rank});
        });
        g.setPath(["a", "b", "c"]);
        g.setEdge("b", "d");
        g.setEdge("a", "e");

        const layering = initOrder(g);
        expect(layering[0]).toEqual(["a"]);
        expect(layering[1]?.sort()).toEqual(["b", "e"]);
        expect(layering[2]?.sort()).toEqual(["c", "d"]);
    });

    it("assigns non-overlapping orders for each rank in a DAG", () => {
        Object.entries({a: 0, b: 1, c: 1, d: 2}).forEach(([v, rank]) => {
            g.setNode(v, {rank: rank});
        });
        g.setPath(["a", "b", "d"]);
        g.setPath(["a", "c", "d"]);

        const layering = initOrder(g);
        expect(layering[0]).toEqual(["a"]);
        expect(layering[1]?.sort()).toEqual(["b", "c"]);
        expect(layering[2]?.sort()).toEqual(["d"]);
    });

    it("does not assign an order to subgraph nodes", () => {
        g.setNode("a", {rank: 0});
        g.setNode("sg1", {});
        g.setParent("a", "sg1");

        const layering = initOrder(g);
        expect(layering).toEqual([["a"]]);
    });

    it("keeps the previous order of normalized outgoing edges", () => {
        const a = {width: 0, height: 0, rank: 0};
        const target = {width: 0, height: 0, rank: 2};
        const edgeA = {width: 0, height: 0, rank: 1, dummy: "edge" as const, edgeObj: {v: "a", w: "b"}};
        const edgeB = {width: 0, height: 0, rank: 1, dummy: "edge" as const, edgeObj: {v: "a", w: "c"}};
        g.setNode("a", a).setNode("b", target).setNode("c", target);
        g.setNode("edgeB", edgeB).setNode("edgeA", edgeA);
        g.setPath(["a", "edgeB", "c"]);
        g.setPath(["a", "edgeA", "b"]);

        const layering = initOrder(g, {
            a,
            b: target,
            c: target,
            previousA: {...edgeA, order: 0},
            previousB: {...edgeB, order: 1}
        });

        expect(layering[1]).toEqual(["edgeA", "edgeB"]);
    });
});
