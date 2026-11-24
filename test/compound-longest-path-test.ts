import {Graph} from "../lib/graph-lib";
import {layout} from "../lib/layout";
import type {EdgeLabel, GraphLabel, NodeLabel} from "../lib/types";

function bounds(node: NodeLabel): number[] {
    return [node.x! - node.width / 2, node.x! + node.width / 2,
        node.y! - node.height / 2, node.y! + node.height / 2];
}

describe("compound layout with multiple bottom borders on the last rank", () => {
    it("keeps children inside their clusters with longest-path", () => {
        const g = new Graph<GraphLabel, NodeLabel, EdgeLabel>({compound: true})
            .setGraph({ranker: "longest-path"})
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
        g.setEdge("n0", "n1");
        g.setEdge("n0", "n4");
        g.setEdge("n1", "n3");
        g.setEdge("n2", "n4");
        g.setEdge("n3", "n6", {weight: 3});

        layout(g);

        for (const id of g.nodes()) {
            const parent = bounds(g.node(id));
            for (const childId of g.children(id)) {
                const child = bounds(g.node(childId));
                expect(child[0]).toBeGreaterThanOrEqual(parent[0]!);
                expect(child[1]).toBeLessThanOrEqual(parent[1]!);
                expect(child[2]).toBeGreaterThanOrEqual(parent[2]!);
                expect(child[3]).toBeLessThanOrEqual(parent[3]!);
            }
        }
    });
});
