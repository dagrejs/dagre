import {alg, Graph} from "@dagrejs/graphlib";
import * as nestingGraph from "../lib/nesting-graph";
import components = alg.components;

describe("rank/nestingGraph", () => {
    let g: Graph;

    beforeEach(() => {
        g = new Graph({compound: true})
            .setGraph({})
            .setDefaultNodeLabel(() => ({}));
    });

    describe("run", () => {
        it("connects a disconnected graph", () => {
            g.setNode("a");
            g.setNode("b");
            expect(components(g)).toHaveLength(2);
            nestingGraph.run(g);
            expect(components(g)).toHaveLength(1);
            expect(g.hasNode("a"));
            expect(g.hasNode("b"));
        });

        it("adds border nodes to the top and bottom of a subgraph", () => {
            g.setParent("a", "sg1");
            nestingGraph.run(g);

            const borderTop = g.node("sg1").borderTop;
            const borderBottom = g.node("sg1").borderBottom;
            expect(borderTop).toBeDefined();
            expect(borderBottom).toBeDefined();
            expect(g.parent(borderTop)).toBe("sg1");
            expect(g.parent(borderBottom)).toBe("sg1");
            expect(g.outEdges(borderTop, "a")).toHaveLength(1);
            expect(g.edge(g.outEdges(borderTop, "a")![0]!).minlen).toBe(1);
            expect(g.outEdges("a", borderBottom)).toHaveLength(1);
            expect(g.edge(g.outEdges("a", borderBottom)![0]!).minlen).toBe(1);
            expect(g.node(borderTop)).toEqual({width: 0, height: 0, dummy: "border"});
            expect(g.node(borderBottom)).toEqual({width: 0, height: 0, dummy: "border"});
        });

        it("adds edges between borders of nested subgraphs", () => {
            g.setParent("sg2", "sg1");
            g.setParent("a", "sg2");
            nestingGraph.run(g);

            const sg1Top = g.node("sg1").borderTop;
            const sg1Bottom = g.node("sg1").borderBottom;
            const sg2Top = g.node("sg2").borderTop;
            const sg2Bottom = g.node("sg2").borderBottom;
            expect(sg1Top).toBeDefined();
            expect(sg1Bottom).toBeDefined();
            expect(sg2Top).toBeDefined();
            expect(sg2Bottom).toBeDefined();
            expect(g.outEdges(sg1Top, sg2Top)).toHaveLength(1);
            expect(g.edge(g.outEdges(sg1Top, sg2Top)![0]!).minlen).toBe(1);
            expect(g.outEdges(sg2Bottom, sg1Bottom)).toHaveLength(1);
            expect(g.edge(g.outEdges(sg2Bottom, sg1Bottom)![0]!).minlen).toBe(1);
        });

        it("adds sufficient weight to border to node edges", () => {
            // We want to keep subgraphs tight, so we should ensure that the weight for
            // the edge between the top (and bottom) border nodes and nodes in the
            // subgraph have weights exceeding anything in the graph.
            g.setParent("x", "sg");
            g.setEdge("a", "x", {weight: 100});
            g.setEdge("x", "b", {weight: 200});
            nestingGraph.run(g);

            const top = g.node("sg").borderTop;
            const bot = g.node("sg").borderBottom;
            expect(g.edge(top, "x").weight).toBeGreaterThan(300);
            expect(g.edge("x", bot).weight).toBeGreaterThan(300);
        });

        it("adds an edge from the root to the tops of top-level subgraphs", () => {
            g.setParent("a", "sg1");
            nestingGraph.run(g);

            const root = g.graph().nestingRoot;
            const borderTop = g.node("sg1").borderTop;
            expect(root).toBeDefined();
            expect(borderTop).toBeDefined();
            expect(g.outEdges(root, borderTop)).toHaveLength(1);
            expect(g.hasEdge(g.outEdges(root, borderTop)![0]!)).toBe(true);
        });

        it("adds an edge from root to each node with the correct minlen #1", () => {
            g.setNode("a");
            nestingGraph.run(g);

            const root = g.graph().nestingRoot;
            expect(root).toBeDefined();
            expect(g.outEdges(root, "a")).toHaveLength(1);
            expect(g.edge(g.outEdges(root, "a")![0]!)).toEqual({weight: 0, minlen: 1});
        });

        it("adds an edge from root to each node with the correct minlen #2", () => {
            g.setParent("a", "sg1");
            nestingGraph.run(g);

            const root = g.graph().nestingRoot;
            expect(root).toBeDefined();
            expect(g.outEdges(root, "a")).toHaveLength(1);
            expect(g.edge(g.outEdges(root, "a")![0]!)).toEqual({weight: 0, minlen: 3});
        });

        it("adds an edge from root to each node with the correct minlen #3", () => {
            g.setParent("sg2", "sg1");
            g.setParent("a", "sg2");
            nestingGraph.run(g);

            const root = g.graph().nestingRoot;
            expect(root).toBeDefined();
            expect(g.outEdges(root, "a")).toHaveLength(1);
            expect(g.edge(g.outEdges(root, "a")![0]!)).toEqual({weight: 0, minlen: 5});
        });

        it("does not add an edge from the root to itself", () => {
            g.setNode("a");
            nestingGraph.run(g);

            const root = g.graph().nestingRoot;
            expect(g.outEdges(root, root)).toEqual([]);
        });

        it("expands inter-node edges to separate SG border and nodes #1", () => {
            g.setEdge("a", "b", {minlen: 1});
            nestingGraph.run(g);
            expect(g.edge("a", "b").minlen).toBe(1);
        });

        it("expands inter-node edges to separate SG border and nodes #2", () => {
            g.setParent("a", "sg1");
            g.setEdge("a", "b", {minlen: 1});
            nestingGraph.run(g);
            expect(g.edge("a", "b").minlen).toBe(3);
        });

        it("expands inter-node edges to separate SG border and nodes #3", () => {
            g.setParent("sg2", "sg1");
            g.setParent("a", "sg2");
            g.setEdge("a", "b", {minlen: 1});
            nestingGraph.run(g);
            expect(g.edge("a", "b").minlen).toBe(5);
        });

        it("sets minlen correctly for nested SG boder to children", () => {
            g.setParent("a", "sg1");
            g.setParent("sg2", "sg1");
            g.setParent("b", "sg2");
            nestingGraph.run(g);

            // We expect the following layering:
            //
            // 0: root
            // 1: empty (close sg2)
            // 2: empty (close sg1)
            // 3: open sg1
            // 4: open sg2
            // 5: a, b
            // 6: close sg2
            // 7: close sg1

            const root = g.graph().nestingRoot;
            const sg1Top = g.node("sg1").borderTop;
            const sg1Bot = g.node("sg1").borderBottom;
            const sg2Top = g.node("sg2").borderTop;
            const sg2Bot = g.node("sg2").borderBottom;

            expect(g.edge(root, sg1Top).minlen).toBe(3);
            expect(g.edge(sg1Top, sg2Top).minlen).toBe(1);
            expect(g.edge(sg1Top, "a").minlen).toBe(2);
            expect(g.edge("a", sg1Bot).minlen).toBe(2);
            expect(g.edge(sg2Top, "b").minlen).toBe(1);
            expect(g.edge("b", sg2Bot).minlen).toBe(1);
            expect(g.edge(sg2Bot, sg1Bot).minlen).toBe(1);
        });
    });

    describe("cleanup", () => {
        it("removes nesting graph edges", () => {
            g.setParent("a", "sg1");
            g.setEdge("a", "b", {minlen: 1});
            nestingGraph.run(g);
            nestingGraph.cleanup(g);
            expect(g.successors("a")).toEqual(["b"]);
        });

        it("removes the root node", () => {
            g.setParent("a", "sg1");
            nestingGraph.run(g);
            nestingGraph.cleanup(g);
            expect(g.nodeCount()).toBe(4); // sg1 + sg1Top + sg1Bottom + "a"
        });
    });
});
