import {Graph} from "@dagrejs/graphlib";
import addSubgraphConstraints from "../../lib/order/add-subgraph-constraints";

describe("order/addSubgraphConstraints", () => {
    let graph: Graph;
    let constraintGraph: Graph;

    beforeEach(() => {
        graph = new Graph({compound: true});
        constraintGraph = new Graph();
    });

    it("does not change CG for a flat set of nodes", () => {
        const vs = ["a", "b", "c", "d"];
        vs.forEach(v => graph.setNode(v));
        addSubgraphConstraints(graph, constraintGraph, vs);
        expect(constraintGraph.nodeCount()).toBe(0);
        expect(constraintGraph.edgeCount()).toBe(0);
    });

    it("doesn't create a constraint for contiguous subgraph nodes", () => {
        const vs = ["a", "b", "c"];
        vs.forEach(v => graph.setParent(v, "sg"));
        addSubgraphConstraints(graph, constraintGraph, vs);
        expect(constraintGraph.nodeCount()).toBe(0);
        expect(constraintGraph.edgeCount()).toBe(0);
    });

    it("adds a constraint when the parents for adjacent nodes are different", () => {
        const vs = ["a", "b"];
        graph.setParent("a", "sg1");
        graph.setParent("b", "sg2");
        addSubgraphConstraints(graph, constraintGraph, vs);
        expect(constraintGraph.edges()).toEqual([{v: "sg1", w: "sg2"}]);
    });

    it("works for multiple levels", () => {
        const vs = ["a", "b", "c", "d", "e", "f", "g", "h"];
        vs.forEach(v => graph.setNode(v));
        graph.setParent("b", "sg2");
        graph.setParent("sg2", "sg1");
        graph.setParent("c", "sg1");
        graph.setParent("d", "sg3");
        graph.setParent("sg3", "sg1");
        graph.setParent("f", "sg4");
        graph.setParent("g", "sg5");
        graph.setParent("sg5", "sg4");
        addSubgraphConstraints(graph, constraintGraph, vs);
        expect(constraintGraph.edges().sort((a, b) => a.v.localeCompare(b.v))).toEqual([
            {v: "sg1", w: "sg4"},
            {v: "sg2", w: "sg3"}
        ]);
    });
});
