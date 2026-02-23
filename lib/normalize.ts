import {addDummyNode} from "./util";
import type {Edge, EdgeLabel, Graph, GraphLabel, NodeLabel} from "./types";

export {
    run,
    undo
};

/*
 * Breaks any long edges in the graph into short segments that span 1 layer
 * each. This operation is undoable with the denormalize function.
 *
 * Pre-conditions:
 *
 *    1. The input graph is a DAG.
 *    2. Each node in the graph has a "rank" property.
 *
 * Post-condition:
 *
 *    1. All edges in the graph have a length of 1.
 *    2. Dummy nodes are added where edges have been split into segments.
 *    3. The graph is augmented with a "dummyChains" attribute which contains
 *       the first dummy in each chain of dummy nodes produced.
 */
function run(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    graph.graph().dummyChains = [];
    graph.edges().forEach(edge => normalizeEdge(graph, edge));
}

function normalizeEdge(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, e: Edge): void {
    let v: string = e.v;
    let vRank: number = graph.node(v).rank!;
    const w: string = e.w;
    const wRank: number = graph.node(w).rank!;
    const name: string | undefined = e.name;
    const edgeLabel: EdgeLabel = graph.edge(e);
    const labelRank: number | undefined = edgeLabel.labelRank;

    if (wRank === vRank + 1) return;

    graph.removeEdge(e);

    let dummy: string;
    let attrs: Partial<NodeLabel>;
    let i: number;
    for (i = 0, ++vRank; vRank < wRank; ++i, ++vRank) {
        edgeLabel.points = [];
        attrs = {
            width: 0,
            height: 0,
            edgeLabel: edgeLabel,
            edgeObj: e,
            rank: vRank
        };
        dummy = addDummyNode(graph, "edge", attrs, "_d");
        if (vRank === labelRank) {
            attrs.width = edgeLabel.width;
            attrs.height = edgeLabel.height;
            attrs.dummy = "edge-label";
            attrs.labelpos = edgeLabel.labelpos;
        }
        graph.setEdge(v, dummy, {weight: edgeLabel.weight}, name);
        if (i === 0) {
            graph.graph().dummyChains!.push(dummy);
        }
        v = dummy;
    }

    graph.setEdge(v, w, {weight: edgeLabel.weight}, name);
}

function undo(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    graph.graph().dummyChains!.forEach(v => {
        let node: NodeLabel = graph.node(v);
        const origLabel: EdgeLabel = node.edgeLabel!;
        let w: string;
        graph.setEdge(node.edgeObj!, origLabel);
        while (node.dummy) {
            w = graph.successors(v)![0]!;
            graph.removeNode(v);
            origLabel.points!.push({x: node.x!, y: node.y!});
            if (node.dummy === "edge-label") {
                origLabel.x = node.x;
                origLabel.y = node.y;
                origLabel.width = node.width;
                origLabel.height = node.height;
            }
            v = w;
            node = graph.node(v);
        }
    });
}
