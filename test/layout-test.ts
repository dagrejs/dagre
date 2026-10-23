import {Graph} from "../lib/graph-lib";
import {layout} from "../lib/layout";

describe("layout", () => {
    let g: Graph;

    beforeEach(() => {
        g = new Graph({multigraph: true, compound: true})
            .setGraph({})
            .setDefaultEdgeLabel(() => ({}));
    });

    it("can layout a single node", () => {
        g.setNode("a", {width: 50, height: 100});
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 50 / 2, y: 100 / 2}
        });
        expect(g.node("a").x).toBe(50 / 2);
        expect(g.node("a").y).toBe(100 / 2);
    });

    it("can layout two nodes on the same rank", () => {
        g.graph().nodesep = 200;
        g.setNode("a", {width: 50, height: 100});
        g.setNode("b", {width: 75, height: 200});
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 50 / 2, y: 200 / 2},
            b: {x: 50 + 200 + 75 / 2, y: 200 / 2}
        });
    });

    it("can layout two nodes connected by an edge", () => {
        g.graph().ranksep = 300;
        g.setNode("a", {width: 50, height: 100});
        g.setNode("b", {width: 75, height: 200});
        g.setEdge("a", "b");
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 75 / 2, y: 100 / 2},
            b: {x: 75 / 2, y: 100 + 300 + 200 / 2}
        });

        // We should not get x, y coordinates if the edge has no label
        expect(g.edge("a", "b")).not.toHaveProperty("x");
        expect(g.edge("a", "b")).not.toHaveProperty("y");
    });

    it("can layout an edge with a label", () => {
        g.graph().ranksep = 300;
        g.setNode("a", {width: 50, height: 100});
        g.setNode("b", {width: 75, height: 200});
        g.setEdge("a", "b", {width: 60, height: 70, labelpos: "c"});
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 75 / 2, y: 100 / 2},
            b: {x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2}
        });
        expect(g.edge("a", "b").x).toEqual(75 / 2);
        expect(g.edge("a", "b").y).toEqual(100 + 150 + 70 / 2);
    });

    describe("can layout an edge with a long label, with rankdir =", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            it(rankdir, () => {
                g.graph().nodesep = g.graph().edgesep = 10;
                g.graph().rankdir = rankdir;
                ["a", "b", "c", "d"].forEach(v => {
                    g.setNode(v, {width: 10, height: 10});
                });
                g.setEdge("a", "c", {width: 2000, height: 10, labelpos: "c"});
                g.setEdge("b", "d", {width: 1, height: 1});
                layout(g);

                let p1, p2;
                if (rankdir === "TB" || rankdir === "BT") {
                    p1 = g.edge("a", "c");
                    p2 = g.edge("b", "d");
                } else {
                    p1 = g.node("a");
                    p2 = g.node("c");
                }

                expect(Math.abs(p1.x - p2.x)).toBeGreaterThan(1000);
            });
        });
    });

    describe("can apply an offset, with rankdir =", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            it(rankdir, () => {
                g.graph().nodesep = g.graph().edgesep = 10;
                g.graph().rankdir = rankdir;
                ["a", "b", "c", "d"].forEach(v => {
                    g.setNode(v, {width: 10, height: 10});
                });
                g.setEdge("a", "b", {width: 10, height: 10, labelpos: "l", labeloffset: 1000});
                g.setEdge("c", "d", {width: 10, height: 10, labelpos: "r", labeloffset: 1000});
                layout(g);

                if (rankdir === "TB" || rankdir === "BT") {
                    expect(g.edge("a", "b").x - g.edge("a", "b").points[0].x).toBe(-1000 - 10 / 2);
                    expect(g.edge("c", "d").x - g.edge("c", "d").points[0].x).toBe(1000 + 10 / 2);
                } else {
                    expect(g.edge("a", "b").y - g.edge("a", "b").points[0].y).toBe(-1000 - 10 / 2);
                    expect(g.edge("c", "d").y - g.edge("c", "d").points[0].y).toBe(1000 + 10 / 2);
                }
            });
        });
    });

    it("can layout a long edge with a label", () => {
        g.graph().ranksep = 300;
        g.setNode("a", {width: 50, height: 100});
        g.setNode("b", {width: 75, height: 200});
        g.setEdge("a", "b", {width: 60, height: 70, minlen: 2, labelpos: "c"});
        layout(g);
        expect(g.edge("a", "b").x).toBe(75 / 2);
        expect(g.edge("a", "b").y).toBeGreaterThan(g.node("a").y);
        expect(g.edge("a", "b").y).toBeLessThan(g.node("b").y);
    });

    it("can layout out a short cycle", () => {
        g.graph().ranksep = 200;
        g.setNode("a", {width: 100, height: 100});
        g.setNode("b", {width: 100, height: 100});
        g.setEdge("a", "b", {weight: 2});
        g.setEdge("b", "a");
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 100 / 2, y: 100 / 2},
            b: {x: 100 / 2, y: 100 + 200 + 100 / 2}
        });
        // One arrow should point down, one up
        expect(g.edge("a", "b").points[1].y).toBeGreaterThan(g.edge("a", "b").points[0].y);
        expect(g.edge("b", "a").points[0].y).toBeGreaterThan(g.edge("b", "a").points[1].y);
    });

    it("adds rectangle intersects for edges", () => {
        g.graph().ranksep = 200;
        g.setNode("a", {width: 100, height: 100});
        g.setNode("b", {width: 100, height: 100});
        g.setEdge("a", "b");
        layout(g);
        const points = g.edge("a", "b").points;
        expect(points).toHaveLength(3);
        expect(points).toEqual([
            {x: 100 / 2, y: 100},           // intersect with bottom of a
            {x: 100 / 2, y: 100 + 200 / 2}, // point for edge label
            {x: 100 / 2, y: 100 + 200}      // intersect with top of b
        ]);
    });

    it("adds rectangle intersects for edges spanning multiple ranks", () => {
        g.graph().ranksep = 200;
        g.setNode("a", {width: 100, height: 100});
        g.setNode("b", {width: 100, height: 100});
        g.setEdge("a", "b", {minlen: 2});
        layout(g);
        const points = g.edge("a", "b").points;
        expect(points).toHaveLength(5);
        expect(points).toEqual([
            {x: 100 / 2, y: 100},           // intersect with bottom of a
            {x: 100 / 2, y: 100 + 200 / 2}, // bend #1
            {x: 100 / 2, y: 100 + 400 / 2}, // point for edge label
            {x: 100 / 2, y: 100 + 600 / 2}, // bend #2
            {x: 100 / 2, y: 100 + 800 / 2}  // intersect with top of b
        ]);
    });

    describe("adds rectangle intersects for zero-sized nodes", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            const sizes: [number, number][] = [[0, 40], [100, 0], [0, 0]];
            sizes.forEach(([width, height]) => {
                it(rankdir + " " + width + "x" + height, () => {
                    g.graph().rankdir = rankdir;
                    g.setNode("a", {width, height});
                    g.setNode("b", {width, height});
                    g.setEdge("a", "b");
                    layout(g);

                    const a = g.node("a");
                    const b = g.node("b");
                    const points = g.edge("a", "b").points;
                    const first = points[0];
                    const last = points[points.length - 1];
                    if (rankdir === "TB" || rankdir === "BT") {
                        const sign = rankdir === "TB" ? 1 : -1;
                        expect(first).toEqual({x: a.x, y: a.y + sign * height / 2});
                        expect(last).toEqual({x: b.x, y: b.y - sign * height / 2});
                    } else {
                        const sign = rankdir === "LR" ? 1 : -1;
                        expect(first).toEqual({x: a.x + sign * width / 2, y: a.y});
                        expect(last).toEqual({x: b.x - sign * width / 2, y: b.y});
                    }
                });
            });
        });
    });

    describe("can layout three parallel edges between two nodes", () => {
        ["TB", "LR"].forEach(rankdir => {
            it("in rankdir = " + rankdir, () => {
                g.graph().rankdir = rankdir;
                ["a", "b", "c", "d"].forEach(v => g.setNode(v, {width: 100, height: 40}));
                g.setEdge("a", "b", {}, "ab0");
                g.setEdge("a", "b", {}, "ab1");
                g.setEdge("a", "b", {}, "ab2");
                g.setEdge("a", "c");
                g.setEdge("b", "d");
                g.setEdge("c", "d");

                layout(g);

                g.nodes().forEach(v => {
                    expect(Number.isFinite(g.node(v).x)).toBe(true);
                    expect(Number.isFinite(g.node(v).y)).toBe(true);
                });
                g.edges().forEach(e => {
                    g.edge(e).points.forEach((point: { x: number, y: number }) => {
                        expect(Number.isFinite(point.x)).toBe(true);
                        expect(Number.isFinite(point.y)).toBe(true);
                    });
                });
            });
        });
    });

    describe("can layout a self loop", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            it("in rankdir = " + rankdir, () => {
                g.graph().edgesep = 75;
                g.graph().rankdir = rankdir;
                g.setNode("a", {width: 100, height: 100});
                g.setEdge("a", "a", {width: 50, height: 50});
                layout(g);
                const nodeA = g.node("a");
                const points = g.edge("a", "a").points as { x: number, y: number }[];
                expect(points).toHaveLength(7);
                points.forEach(point => {
                    if (rankdir !== "LR" && rankdir !== "RL") {
                        expect(point.x).toBeGreaterThan(nodeA.x);
                        expect(Math.abs(point.y - nodeA.y)).toBeLessThanOrEqual(nodeA.height / 2);
                    } else {
                        expect(point.y).toBeGreaterThan(nodeA.y);
                        expect(Math.abs(point.x - nodeA.x)).toBeLessThanOrEqual(nodeA.width / 2);
                    }
                });
            });
        });
    });

    it("can layout a graph with subgraphs", () => {
        // To be expanded, this primarily ensures nothing blows up for the moment.
        g.setNode("a", {width: 50, height: 50});
        g.setParent("a", "sg1");
        layout(g);
    });

    it("minimizes the height of subgraphs", () => {
        ["a", "b", "c", "d", "x", "y"].forEach(v => {
            g.setNode(v, {width: 50, height: 50});
        });
        g.setPath(["a", "b", "c", "d"]);
        g.setEdge("a", "x", {weight: 100});
        g.setEdge("y", "d", {weight: 100});
        g.setParent("x", "sg");
        g.setParent("y", "sg");

        // We did not set up an edge (x, y), and we set up high-weight edges from
        // outside of the subgraph to nodes in the subgraph. This is to try to
        // force nodes x and y to be on different ranks, which we want our ranker
        // to avoid.
        layout(g);
        expect(g.node("x").y).toBe(g.node("y").y);
    });

    it("minimizes separation between nodes not adjacent to subgraphs", () => {
        ["a", "b", "c"].forEach(v => {
            g.setNode(v, {width: 50, height: 50});
        });
        g.setPath(["a", "b", "c"]);
        g.setNode("sg", {});
        g.setParent("c", "sg");
        layout(g);
        expect(g.node("b").y - g.node("a").y).toBe(100);
    });

    it("can layout subgraphs with different rankdirs", () => {
        g.setNode("a", {width: 50, height: 50});
        g.setNode("sg", {});
        g.setParent("a", "sg");

        function check() {
            expect(g.node("sg").width).toBeGreaterThan(50);
            expect(g.node("sg").height).toBeGreaterThan(50);
            expect(g.node("sg").x).toBeGreaterThan(50 / 2);
            expect(g.node("sg").y).toBeGreaterThan(50 / 2);
        }

        ["tb", "bt", "lr", "rl"].forEach(rankdir => {
            g.graph().rankdir = rankdir;
            layout(g);
            check();
        });
    });

    describe("edge routes inside a cluster with its own direction", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            it.each([undefined, "internal"])(rankdir + " with edge name %s", name => {
                g.setNode("sg", {rankdir});
                g.setNode("a", {width: 100, height: 40});
                g.setNode("b", {width: 100, height: 40});
                g.setParent("a", "sg");
                g.setParent("b", "sg");
                g.setEdge("a", "b", {width: 30, height: 10, labelpos: "c"}, name);
                g.setNode("outside", {width: 200, height: 80});
                layout(g);

                const edge = g.edge("a", "b", name);
                expect(edge.points).toHaveLength(3);
                for (const point of edge.points) {
                    expect(Number.isFinite(point.x)).toBe(true);
                    expect(Number.isFinite(point.y)).toBe(true);
                }
                const first = edge.points[0];
                const last = edge.points[edge.points.length - 1];
                const a = g.node("a");
                const b = g.node("b");
                if (rankdir === "LR" || rankdir === "RL") {
                    const sign = rankdir === "LR" ? 1 : -1;
                    expect(first).toEqual({x: a.x + sign * a.width / 2, y: a.y});
                    expect(last).toEqual({x: b.x - sign * b.width / 2, y: b.y});
                } else {
                    const sign = rankdir === "TB" ? 1 : -1;
                    expect(first).toEqual({x: a.x, y: a.y + sign * a.height / 2});
                    expect(last).toEqual({x: b.x, y: b.y - sign * b.height / 2});
                }
                expect(edge.x).toBe((a.x + b.x) / 2);
                expect(edge.y).toBe((a.y + b.y) / 2);
            });
        });
    });

    it("preserves parallel and self-loop routes in a directed cluster", () => {
        g.setNode("sg", {rankdir: "LR"});
        for (const v of ["a", "b"]) {
            g.setNode(v, {width: 100, height: 40});
            g.setParent(v, "sg");
        }
        g.setEdge("a", "b", {}, "first");
        g.setEdge("a", "b", {}, "second");
        g.setEdge("a", "a", {}, "loop");
        layout(g);

        expect(g.edgeCount()).toBe(3);
        for (const e of g.edges()) {
            const points = g.edge(e).points;
            expect(points.length).toBeGreaterThanOrEqual(3);
            for (const point of points) {
                expect(Number.isFinite(point.x)).toBe(true);
                expect(Number.isFinite(point.y)).toBe(true);
            }
        }
        expect(g.edge("a", "b", "first").points).not.toEqual(g.edge("a", "b", "second").points);
    });

    it("adds dimensions to the graph", () => {
        g.setNode("a", {width: 100, height: 50});
        layout(g);
        expect(g.graph().width).toBe(100);
        expect(g.graph().height).toBe(50);
    });

    describe("ensures all coordinates are in the bounding box for the graph", () => {
        ["TB", "BT", "LR", "RL"].forEach(rankdir => {
            describe(rankdir, () => {
                beforeEach(() => {
                    g.graph().rankdir = rankdir;
                });

                it("node", () => {
                    g.setNode("a", {width: 100, height: 200});
                    layout(g);
                    expect(g.node("a").x).toBe(100 / 2);
                    expect(g.node("a").y).toBe(200 / 2);
                });

                it("edge, labelpos = l", () => {
                    g.setNode("a", {width: 100, height: 100});
                    g.setNode("b", {width: 100, height: 100});
                    g.setEdge("a", "b", {
                        width: 1000, height: 2000, labelpos: "l", labeloffset: 0
                    });
                    layout(g);
                    if (rankdir === "TB" || rankdir === "BT") {
                        expect(g.edge("a", "b").x).toBe(1000 / 2);
                    } else {
                        expect(g.edge("a", "b").y).toBe(2000 / 2);
                    }
                });
            });
        });
    });

    it("treats attributes with case-insensitivity", () => {
        g.graph().nodeSep = 200; // note the capital S
        g.setNode("a", {width: 50, height: 100});
        g.setNode("b", {width: 75, height: 200});
        layout(g);
        expect(extractCoordinates(g)).toEqual({
            a: {x: 50 / 2, y: 200 / 2},
            b: {x: 50 + 200 + 75 / 2, y: 200 / 2}
        });
    });

    describe("dynamic layout state", () => {
        const graphPairs: Array<[[string, string][], [string, string][]]> = [
            [
                [["b", "a"]],
                [["a", "c"], ["a", "b"], ["c", "b"]]
            ],
            [
                [["a", "c"], ["a", "b"], ["c", "b"]],
                [["b", "a"]]
            ]
        ];

        it.each(graphPairs)("does not share state between unrelated graphs", (firstEdges, secondEdges) => {
            layout(createGraph(firstEdges));
            expect(() => layout(createGraph(secondEdges))).not.toThrow();
        });

        it("produces stable positions when laying out the same graph repeatedly", () => {
            const graph = createGraph([["a", "c"], ["a", "b"], ["c", "b"]]);

            layout(graph);
            const firstCoordinates = extractCoordinates(graph);
            layout(graph);
            expect(extractCoordinates(graph)).toEqual(firstCoordinates);
            layout(graph);
            expect(extractCoordinates(graph)).toEqual(firstCoordinates);
        });

        it("keeps state isolated when graph layouts are interleaved", () => {
            const first = createGraph([["b", "a"]]);
            const second = createGraph([["a", "c"], ["a", "b"], ["c", "b"]]);

            layout(first);
            layout(second);
            expect(() => layout(first)).not.toThrow();
            expect(() => layout(second)).not.toThrow();
        });

        it("can disable dynamic layout", () => {
            const graph = createGraph([["a", "c"], ["a", "b"], ["c", "b"]]);

            expect(() => layout(graph, {useDynamic: false})).not.toThrow();
        });
    });
});

function createGraph(edges: [string, string][]): Graph {
    const graph = new Graph()
        .setGraph({})
        .setDefaultEdgeLabel(() => ({}));
    edges.forEach(([v, w]) => {
        graph.setNode(v, {width: 100, height: 100});
        graph.setNode(w, {width: 100, height: 100});
        graph.setEdge(v, w);
    });
    return graph;
}

function extractCoordinates(g: Graph) {
    const nodes = g.nodes();
    return nodes.reduce((acc: { [key: string]: { x: number, y: number } }, v) => {
        const node = g.node(v);
        acc[v] = {x: node.x, y: node.y};
        return acc;
    }, {});
}
