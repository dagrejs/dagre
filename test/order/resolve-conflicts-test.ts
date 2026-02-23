import {Graph} from "@dagrejs/graphlib";
import resolveConflicts, {ResolvedEntry} from "../../lib/order/resolve-conflicts";

describe("order/resolveConflicts", () => {
    let constraintGraph: Graph;

    beforeEach(() => constraintGraph = new Graph());

    it("returns back nodes unchanged when no constraints exist", () => {
        const input = [
            {v: "a", barycenter: 2, weight: 3},
            {v: "b", barycenter: 1, weight: 2}
        ];
        expect(resolveConflicts(input, constraintGraph).sort(sortFunc)).toEqual([
            {vs: ["a"], i: 0, barycenter: 2, weight: 3},
            {vs: ["b"], i: 1, barycenter: 1, weight: 2}
        ]);
    });

    it("returns back nodes unchanged when no conflicts exist", () => {
        const input = [
            {v: "a", barycenter: 2, weight: 3},
            {v: "b", barycenter: 1, weight: 2}
        ];
        constraintGraph.setEdge("b", "a");
        expect(resolveConflicts(input, constraintGraph).sort(sortFunc)).toEqual([
            {vs: ["a"], i: 0, barycenter: 2, weight: 3},
            {vs: ["b"], i: 1, barycenter: 1, weight: 2}
        ]);
    });

    it("coalesces nodes when there is a conflict", () => {
        const input = [
            {v: "a", barycenter: 2, weight: 3},
            {v: "b", barycenter: 1, weight: 2}
        ];
        constraintGraph.setEdge("a", "b");
        expect(resolveConflicts(input, constraintGraph)).toEqual([
            {
                vs: ["a", "b"],
                i: 0,
                barycenter: (3 * 2 + 2 * 1) / (3 + 2),
                weight: 3 + 2
            }
        ]);
    });

    it("coalesces nodes when there is a conflict #2", () => {
        const input = [
            {v: "a", barycenter: 4, weight: 1},
            {v: "b", barycenter: 3, weight: 1},
            {v: "c", barycenter: 2, weight: 1},
            {v: "d", barycenter: 1, weight: 1}
        ];
        constraintGraph.setPath(["a", "b", "c", "d"]);
        expect(resolveConflicts(input, constraintGraph)).toEqual([
            {
                vs: ["a", "b", "c", "d"],
                i: 0,
                barycenter: (4 + 3 + 2 + 1) / 4,
                weight: 4
            }
        ]);
    });

    it("works with multiple constraints for the same target #1", () => {
        const input = [
            {v: "a", barycenter: 4, weight: 1},
            {v: "b", barycenter: 3, weight: 1},
            {v: "c", barycenter: 2, weight: 1},
        ];
        constraintGraph.setEdge("a", "c");
        constraintGraph.setEdge("b", "c");
        const results = resolveConflicts(input, constraintGraph);
        expect(results).toHaveLength(1);
        const result = results[0]!;
        expect(result.vs.indexOf("c")).toBeGreaterThan(result.vs.indexOf("a"));
        expect(result.vs.indexOf("c")).toBeGreaterThan(result.vs.indexOf("b"));
        expect(result.i).toBe(0);
        expect(result.barycenter).toBe((4 + 3 + 2) / 3);
        expect(result.weight).toBe(3);
    });

    it("works with multiple constraints for the same target #2", () => {
        const input = [
            {v: "a", barycenter: 4, weight: 1},
            {v: "b", barycenter: 3, weight: 1},
            {v: "c", barycenter: 2, weight: 1},
            {v: "d", barycenter: 1, weight: 1},
        ];
        constraintGraph.setEdge("a", "c");
        constraintGraph.setEdge("a", "d");
        constraintGraph.setEdge("b", "c");
        constraintGraph.setEdge("c", "d");
        const results = resolveConflicts(input, constraintGraph);
        expect(results).toHaveLength(1);
        const result = results[0]!;
        expect(result.vs.indexOf("c")).toBeGreaterThan(result.vs.indexOf("a"));
        expect(result.vs.indexOf("c")).toBeGreaterThan(result.vs.indexOf("b"));
        expect(result.vs.indexOf("d")).toBeGreaterThan(result.vs.indexOf("c"));
        expect(result.i).toBe(0);
        expect(result.barycenter).toBe((4 + 3 + 2 + 1) / 4);
        expect(result.weight).toBe(4);
    });

    it("does nothing to a node lacking both a barycenter and a constraint", () => {
        const input = [
            {v: "a"},
            {v: "b", barycenter: 1, weight: 2}
        ];
        expect(resolveConflicts(input, constraintGraph).sort(sortFunc)).toEqual([
            {vs: ["a"], i: 0},
            {vs: ["b"], i: 1, barycenter: 1, weight: 2}
        ]);
    });

    it("treats a node w/o a barycenter as always violating constraints #1", () => {
        const input = [
            {v: "a"},
            {v: "b", barycenter: 1, weight: 2}
        ];
        constraintGraph.setEdge("a", "b");
        expect(resolveConflicts(input, constraintGraph)).toEqual([
            {vs: ["a", "b"], i: 0, barycenter: 1, weight: 2}
        ]);
    });

    it("treats a node w/o a barycenter as always violating constraints #2", () => {
        const input = [
            {v: "a"},
            {v: "b", barycenter: 1, weight: 2}
        ];
        constraintGraph.setEdge("b", "a");
        expect(resolveConflicts(input, constraintGraph)).toEqual([
            {vs: ["b", "a"], i: 0, barycenter: 1, weight: 2}
        ]);
    });

    it("ignores edges not related to entries", () => {
        const input = [
            {v: "a", barycenter: 2, weight: 3},
            {v: "b", barycenter: 1, weight: 2}
        ];
        constraintGraph.setEdge("c", "d");
        expect(resolveConflicts(input, constraintGraph).sort(sortFunc)).toEqual([
            {vs: ["a"], i: 0, barycenter: 2, weight: 3},
            {vs: ["b"], i: 1, barycenter: 1, weight: 2}
        ]);
    });
});

function sortFunc(a: ResolvedEntry, b: ResolvedEntry) {
    return a.vs[0]!.localeCompare(b.vs[0]!);
}
