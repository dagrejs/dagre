import {addDummyNode, GRAPH_NODE} from "./util";
import type {EdgeLabel, Graph, GraphLabel, NodeLabel} from "./types";

export default addBorderSegments;

function addBorderSegments(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    function dfs(v: string): void {
        const children: string[] = graph.children(v);
        const node = graph.node(v);
        if (children.length) {
            children.forEach(dfs);
        }

        if (Object.hasOwn(node, "minRank")) {
            node.borderLeft = [];
            node.borderRight = [];
            for (let rank: number = node.minRank!, maxRank: number = node.maxRank! + 1;
                rank < maxRank;
                ++rank) {
                addBorderNode(graph, "borderLeft", "_bl", v, node, rank);
                addBorderNode(graph, "borderRight", "_br", v, node, rank);
            }
        }
    }

    graph.children(GRAPH_NODE).forEach(dfs);
}

function addBorderNode(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    prop: "borderLeft" | "borderRight",
    prefix: string,
    sg: string,
    sgNode: EdgeLabel,
    rank: number
): void {
    const label: Partial<NodeLabel> = {width: 0, height: 0, rank: rank, borderType: prop};
    const prev: string | undefined = (sgNode[prop] as string[])[rank - 1];
    const curr: string = addDummyNode(graph, "border", label, prefix);
    (sgNode[prop] as string[])[rank] = curr;
    graph.setParent(curr, sg);
    if (prev) {
        graph.setEdge(prev, curr, {weight: 1});
    }
}
