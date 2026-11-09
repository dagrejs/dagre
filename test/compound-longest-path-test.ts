import {Graph} from "../lib/graph-lib";
import {layout} from "../lib/layout";
import type {EdgeLabel, GraphLabel, NodeLabel} from "../lib/types";

function bounds(node: NodeLabel): number[] {
    return [node.x! - node.width / 2, node.x! + node.width / 2,
        node.y! - node.height / 2, node.y! + node.height / 2];
}

describe("compound layout with multiple bottom borders on the last rank", () => {
    for (const ranker of ["longest-path", "tight-tree", "network-simplex"] as const) {
        for (const rankdir of ["TB", "BT", "LR", "RL"] as const) {
            it(`keeps children inside non-overlapping clusters with ${ranker}, ${rankdir}`, () => {
                for (const align of [undefined, "UL", "UR", "DL", "DR"] as const) {
                    for (const nested of [false, true]) {
                        const g = new Graph<GraphLabel, NodeLabel, EdgeLabel>({compound: true})
                            .setGraph({ranker, rankdir, align})
                            .setDefaultEdgeLabel(() => ({}));
                        for (const id of ["n0", "n1", "n2", "n3", "n4", "n6"]) {
                            g.setNode(id, {width: 10, height: 10});
                        }
                        for (const id of ["c0", "c1", "c2"]) {
                            g.setNode(id, {width: 0, height: 0});
                        }
                        g.setParent("n1", "c0");
                        g.setParent("n2", "c0");
                        g.setParent("n3", "c1");
                        g.setParent("n4", "c2");
                        if (nested) {
                            g.setNode("outer", {width: 0, height: 0});
                            for (const id of ["c0", "c1", "c2"]) g.setParent(id, "outer");
                        }
                        g.setEdge("n0", "n1");
                        g.setEdge("n0", "n4");
                        g.setEdge("n1", "n3");
                        g.setEdge("n2", "n4");
                        g.setEdge("n3", "n6", {weight: 3});

                        layout(g);

                        for (const id of g.nodes()) {
                            const parent = bounds(g.node(id));
                            expect(parent.every(Number.isFinite)).toBe(true);
                            for (const childId of g.children(id)) {
                                const child = bounds(g.node(childId));
                                expect(child[0]).toBeGreaterThanOrEqual(parent[0]!);
                                expect(child[1]).toBeLessThanOrEqual(parent[1]!);
                                expect(child[2]).toBeGreaterThanOrEqual(parent[2]!);
                                expect(child[3]).toBeLessThanOrEqual(parent[3]!);
                            }
                        }
                        for (const [a, b] of [["c0", "c1"], ["c0", "c2"], ["c1", "c2"]]) {
                            const one = bounds(g.node(a!));
                            const two = bounds(g.node(b!));
                            const overlaps = Math.min(one[1]!, two[1]!) > Math.max(one[0]!, two[0]!) &&
                                Math.min(one[3]!, two[3]!) > Math.max(one[2]!, two[2]!);
                            expect(overlaps).toBe(false);
                        }
                        for (const edge of g.edges()) {
                            const points = g.edge(edge).points!;
                            expect(points.length).toBeGreaterThanOrEqual(2);
                            expect(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
                        }
                    }
                }
            });
        }
    }
});
