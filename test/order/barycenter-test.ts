import {Graph} from "@dagrejs/graphlib";
import barycenter from "../../lib/order/barycenter";

describe("order/barycenter", () => {
    let g: Graph;

    beforeEach(() => {
        g = new Graph()
            .setDefaultNodeLabel(() => ({}))
            .setDefaultEdgeLabel(() => ({weight: 1}));
    });

    it("assigns an undefined barycenter for a node with no predecessors", () => {
        g.setNode("x", {});

        const results = barycenter(g, ["x"]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({v: "x"});
    });

    it("assigns the position of the sole predecessors", () => {
        g.setNode("a", {order: 2});
        g.setEdge("a", "x");

        const results = barycenter(g, ["x"]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({v: "x", barycenter: 2, weight: 1});
    });

    it("assigns the average of multiple predecessors", () => {
        g.setNode("a", {order: 2});
        g.setNode("b", {order: 4});
        g.setEdge("a", "x");
        g.setEdge("b", "x");

        const results = barycenter(g, ["x"]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({v: "x", barycenter: 3, weight: 2});
    });

    it("takes into account the weight of edges", () => {
        g.setNode("a", {order: 2});
        g.setNode("b", {order: 4});
        g.setEdge("a", "x", {weight: 3});
        g.setEdge("b", "x");

        const results = barycenter(g, ["x"]);
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({v: "x", barycenter: 2.5, weight: 4});
    });

    it("calculates barycenters for all nodes in the movable layer", () => {
        g.setNode("a", {order: 1});
        g.setNode("b", {order: 2});
        g.setNode("c", {order: 4});
        g.setEdge("a", "x");
        g.setEdge("b", "x");
        g.setNode("y");
        g.setEdge("a", "z", {weight: 2});
        g.setEdge("c", "z");

        const results = barycenter(g, ["x", "y", "z"]);
        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({v: "x", barycenter: 1.5, weight: 2});
        expect(results[1]).toEqual({v: "y"});
        expect(results[2]).toEqual({v: "z", barycenter: 2, weight: 3});
    });
});
