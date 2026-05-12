import {Graph} from "@dagrejs/graphlib";
import * as util from "../lib/util";

describe("util", () => {
    describe("simplify", () => {
        let g: Graph;

        beforeEach(() => g = new Graph({multigraph: true}));

        it("copies without change a graph with no multi-edges", () => {
            g.setEdge("a", "b", {weight: 1, minlen: 1});
            const g2 = util.simplify(g);
            expect(g2.edge("a", "b")).toEqual({weight: 1, minlen: 1});
            expect(g2.edgeCount()).toBe(1);
        });

        it("collapses multi-edges", () => {
            g.setEdge("a", "b", {weight: 1, minlen: 1});
            g.setEdge("a", "b", {weight: 2, minlen: 2}, "multi");
            const g2 = util.simplify(g);
            expect(g2.isMultigraph()).toBe(false);
            expect(g2.edge("a", "b")).toEqual({weight: 3, minlen: 2});
            expect(g2.edgeCount()).toBe(1);
        });

        it("copies the graph object", () => {
            g.setGraph({foo: "bar"});
            const g2 = util.simplify(g);
            expect(g2.graph()).toEqual({foo: "bar"});
        });
    });

    describe("asNonCompoundGraph", () => {
        let g: Graph;

        beforeEach(() => g = new Graph({compound: true, multigraph: true}));

        it("copies all nodes", () => {
            g.setNode("a", {foo: "bar"});
            g.setNode("b");
            const g2 = util.asNonCompoundGraph(g);
            expect(g2.node("a")).toEqual({foo: "bar"});
            expect(g2.hasNode("b")).toBe(true);
        });

        it("copies all edges", () => {
            g.setEdge("a", "b", {foo: "bar"});
            g.setEdge("a", "b", {foo: "baz"}, "multi");
            const g2 = util.asNonCompoundGraph(g);
            expect(g2.edge("a", "b")).toEqual({foo: "bar"});
            expect(g2.edge("a", "b", "multi")).toEqual({foo: "baz"});
        });

        it("does not copy compound nodes", () => {
            g.setParent("a", "sg1");
            const g2 = util.asNonCompoundGraph(g);
            expect(g2.parent("sg1")).toBeUndefined();
            expect(g2.parent("a")).toBeUndefined();
            expect(g2.isCompound()).toBe(false);
        });

        it("copies the graph object", () => {
            g.setGraph({foo: "bar"});
            const g2 = util.asNonCompoundGraph(g);
            expect(g2.graph()).toEqual({foo: "bar"});
        });
    });

    describe("successorWeights", () => {
        it("maps a node to its successors with associated weights", () => {
            const g = new Graph({multigraph: true});
            g.setEdge("a", "b", {weight: 2});
            g.setEdge("b", "c", {weight: 1});
            g.setEdge("b", "c", {weight: 2}, "multi");
            g.setEdge("b", "d", {weight: 1}, "multi");
            expect(util.successorWeights(g).a).toEqual({b: 2});
            expect(util.successorWeights(g).b).toEqual({c: 3, d: 1});
            expect(util.successorWeights(g).c).toEqual({});
            expect(util.successorWeights(g).d).toEqual({});
        });
    });

    describe("predecessorWeights", () => {
        it("maps a node to its predecessors with associated weights", () => {
            const g = new Graph({multigraph: true});
            g.setEdge("a", "b", {weight: 2});
            g.setEdge("b", "c", {weight: 1});
            g.setEdge("b", "c", {weight: 2}, "multi");
            g.setEdge("b", "d", {weight: 1}, "multi");
            expect(util.predecessorWeights(g).a).toEqual({});
            expect(util.predecessorWeights(g).b).toEqual({a: 2});
            expect(util.predecessorWeights(g).c).toEqual({b: 3});
            expect(util.predecessorWeights(g).d).toEqual({b: 1});
        });
    });

    describe("intersectRect", () => {
        function expectIntersects(rect: { x: number, y: number, width: number, height: number }, point: {
            x: number,
            y: number
        }) {
            const cross = util.intersectRect(rect, point);
            if (cross.x !== point.x) {
                const m = (cross.y - point.y) / (cross.x - point.x);
                expect(cross.y - rect.y).toBeCloseTo(m * (cross.x - rect.x));
            }
        }

        function expectTouchesBorder(rect: { x: number, y: number, width: number, height: number }, point: {
            x: number,
            y: number
        }) {
            const cross = util.intersectRect(rect, point);
            if (Math.abs(rect.x - cross.x) !== rect.width / 2) {
                expect(Math.abs(rect.y - cross.y)).toBe(rect.height / 2);
            }
        }

        it("creates a slope that will intersect the rectangle's center", () => {
            const rect = {x: 0, y: 0, width: 1, height: 1};
            expectIntersects(rect, {x: 2, y: 6});
            expectIntersects(rect, {x: 2, y: -6});
            expectIntersects(rect, {x: 6, y: 2});
            expectIntersects(rect, {x: -6, y: 2});
            expectIntersects(rect, {x: 5, y: 0});
            expectIntersects(rect, {x: 0, y: 5});
        });

        it("touches the border of the rectangle", () => {
            const rect = {x: 0, y: 0, width: 1, height: 1};
            expectTouchesBorder(rect, {x: 2, y: 6});
            expectTouchesBorder(rect, {x: 2, y: -6});
            expectTouchesBorder(rect, {x: 6, y: 2});
            expectTouchesBorder(rect, {x: -6, y: 2});
            expectTouchesBorder(rect, {x: 5, y: 0});
            expectTouchesBorder(rect, {x: 0, y: 5});
        });

        it("throws an error if the point is at the center of the rectangle", () => {
            const rect = {x: 0, y: 0, width: 1, height: 1};
            expect(() => util.intersectRect(rect, {x: 0, y: 0})).toThrow();
        });
    });

    describe("buildLayerMatrix", () => {
        it("creates a matrix based on rank and order of nodes in the graph", () => {
            const g = new Graph();
            g.setNode("a", {rank: 0, order: 0});
            g.setNode("b", {rank: 0, order: 1});
            g.setNode("c", {rank: 1, order: 0});
            g.setNode("d", {rank: 1, order: 1});
            g.setNode("e", {rank: 2, order: 0});

            expect(util.buildLayerMatrix(g)).toEqual([
                ["a", "b"],
                ["c", "d"],
                ["e"]
            ]);
        });
    });

    describe("time", () => {
        let consoleLog: typeof console.log;

        beforeEach(() => consoleLog = console.log);

        afterEach(() => console.log = consoleLog);

        it("logs timing information", () => {
            const capture: string[] = [];
            console.log = function (...args: unknown[]) {
                capture.push(args[0] as string);
            };
            util.time("foo", function () {
            });
            expect(capture.length).toBe(1);
            expect(capture[0]).toMatch(/^foo time: .*ms/);
        });

        it("returns the value from the evaluated function", () => {
            console.log = function () {
            };
            expect(util.time("foo", () => "bar")).toBe("bar");
        });
    });

    describe("normalizeRanks", () => {
        it("adjust ranks such that all are >= 0, and at least one is 0", () => {
            const g = new Graph()
                .setNode("a", {rank: 3})
                .setNode("b", {rank: 2})
                .setNode("c", {rank: 4});

            util.normalizeRanks(g);

            expect(g.node("a").rank).toBe(1);
            expect(g.node("b").rank).toBe(0);
            expect(g.node("c").rank).toBe(2);
        });

        it("works for negative ranks", () => {
            const g = new Graph()
                .setNode("a", {rank: -3})
                .setNode("b", {rank: -2});

            util.normalizeRanks(g);

            expect(g.node("a").rank).toBe(0);
            expect(g.node("b").rank).toBe(1);
        });

        it("does not assign a rank to subgraphs", () => {
            const g = new Graph({compound: true})
                .setNode("a", {rank: 0})
                .setNode("sg", {})
                .setParent("a", "sg");

            util.normalizeRanks(g);

            expect(g.node("sg")).not.toHaveProperty("rank");
            expect(g.node("a").rank).toBe(0);
        });
    });

    describe("removeEmptyRanks", () => {
        it("Removes border ranks without any nodes", () => {
            const g = new Graph()
                .setGraph({nodeRankFactor: 4})
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 4});
            util.removeEmptyRanks(g);
            expect(g.node("a").rank).toBe(0);
            expect(g.node("b").rank).toBe(1);
        });

        it("Does not remove non-border ranks", () => {
            const g = new Graph()
                .setGraph({nodeRankFactor: 4})
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 8});
            util.removeEmptyRanks(g);
            expect(g.node("a").rank).toBe(0);
            expect(g.node("b").rank).toBe(2);
        });

        it("Handles parents with undefined ranks", () => {
            const g = new Graph({compound: true})
                .setGraph({nodeRankFactor: 3})
                .setNode("a", {rank: 0})
                .setNode("b", {rank: 6})
                .setNode("sg", {})
                .setParent("a", "sg");
            util.removeEmptyRanks(g);
            expect(g.node("a").rank).toBe(0);
            expect(g.node("b").rank).toBe(2);
            expect(g.node("sg").rank).toBe(undefined);
        });
    });

    describe("range", () => {
        it("Builds an array to the limit", () => {
            const range = util.range(4);
            expect(range.length).toBe(4);
            expect(range.reduce((acc, v) => acc + v)).toBe(6);
        });

        it("Builds an array with a start", () => {
            const range = util.range(2, 4);
            expect(range.length).toBe(2);
            expect(range.reduce((acc, v) => acc + v)).toBe(5);
        });

        it("Builds an array with a negative step", () => {
            const range = util.range(5, -1, -1);
            expect(range[0]).toBe(5);
            expect(range[5]).toBe(0);
        });
    });

    describe("mapValues", () => {
        it("Creates an object with the same keys", () => {
            const users = {
                'fred': {'user': 'fred', 'age': 40},
                'pebbles': {'user': 'pebbles', 'age': 1}
            };

            const ages = util.mapValues(users, user => user.age);
            expect(ages.fred).toBe(40);
            expect(ages.pebbles).toBe(1);
        });

        it("Can take a property name", () => {
            const users = {
                'fred': {'user': 'fred', 'age': 40},
                'pebbles': {'user': 'pebbles', 'age': 1}
            };

            const ages = util.mapValues(users, 'age');
            expect(ages.fred).toBe(40);
            expect(ages.pebbles).toBe(1);
        });
    });
});
