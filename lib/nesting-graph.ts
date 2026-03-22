import {addBorderNode, addDummyNode, applyWithChunking, GRAPH_NODE} from "./util";
import type {EdgeLabel, Graph, GraphLabel, NodeLabel} from "./types";

export {
    run,
    cleanup,
};

/*
 * A nesting graph creates dummy nodes for the tops and bottoms of subgraphs,
 * adds appropriate edges to ensure that all cluster nodes are placed between
 * these boundaries, and ensures that the graph is connected.
 *
 * In addition we ensure, through the use of the minlen property, that nodes
 * and subgraph border nodes to not end up on the same rank.
 *
 * Preconditions:
 *
 *    1. Input graph is a DAG
 *    2. Nodes in the input graph has a minlen attribute
 *
 * Postconditions:
 *
 *    1. Input graph is connected.
 *    2. Dummy nodes are added for the tops and bottoms of subgraphs.
 *    3. The minlen attribute for nodes is adjusted to ensure nodes do not
 *       get placed on the same rank as subgraph border nodes.
 *
 * The nesting graph idea comes from Sander, "Layout of Compound Directed
 * Graphs."
 */
function run(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const root: string = addDummyNode(graph, "root", {}, "_root");
    const depths: { [key: string]: number } = treeDepths(graph);
    const depthsArr: number[] = Object.values(depths);
    const height: number = applyWithChunking(Math.max, depthsArr) - 1; // Note: depths is an Object not an array
    const nodeSep: number = 2 * height + 1;

    graph.graph().nestingRoot = root;

    // Multiply minlen by nodeSep to align nodes on non-border ranks.
    graph.edges().forEach(e => graph.edge(e).minlen! *= nodeSep);

    // Calculate a weight that is sufficient to keep subgraphs vertically compact
    const weight: number = sumWeights(graph) + 1;

    // Create border nodes and link them up
    graph.children(GRAPH_NODE).forEach(child => dfs(graph, root, nodeSep, weight, height, depths, child));

    // Save the multiplier for node layers for later removal of empty border
    // layers.
    graph.graph().nodeRankFactor = nodeSep;
}

function dfs(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    root: string,
    nodeSep: number,
    weight: number,
    height: number,
    depths: { [key: string]: number },
    v: string
): void {
    const children: string[] = graph.children(v);
    if (!children.length) {
        if (v !== root) {
            graph.setEdge(root, v, {weight: 0, minlen: nodeSep});
        }
        return;
    }

    const top: string = addBorderNode(graph, "_bt");
    const bottom: string = addBorderNode(graph, "_bb");
    const label: NodeLabel = graph.node(v);

    graph.setParent(top, v);
    label.borderTop = top;
    graph.setParent(bottom, v);
    label.borderBottom = bottom;

    children.forEach(child => {
        dfs(graph, root, nodeSep, weight, height, depths, child);

        const childNode: NodeLabel = graph.node(child);
        const childTop: string = childNode.borderTop ? childNode.borderTop : child;
        const childBottom: string = childNode.borderBottom ? childNode.borderBottom : child;
        const thisWeight: number = childNode.borderTop ? weight : 2 * weight;
        const minlen: number = childTop !== childBottom ? 1 : height - (depths[v] ?? 0) + 1;

        graph.setEdge(top, childTop, {
            weight: thisWeight,
            minlen: minlen,
            nestingEdge: true
        });

        graph.setEdge(childBottom, bottom, {
            weight: thisWeight,
            minlen: minlen,
            nestingEdge: true
        });
    });

    if (!graph.parent(v)) {
        graph.setEdge(root, top, {weight: 0, minlen: height + (depths[v] ?? 0)});
    }
}

function treeDepths(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): { [key: string]: number } {
    const depths: { [key: string]: number } = {};

    function dfs(v: string, depth: number): void {
        const children: string[] = graph.children(v);
        if (children && children.length) {
            children.forEach(child => dfs(child, depth + 1));
        }
        depths[v] = depth;
    }

    graph.children(GRAPH_NODE).forEach(v => dfs(v, 1));
    return depths;
}

function sumWeights(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): number {
    return graph.edges().reduce((acc, e) => acc + graph.edge(e).weight!, 0);
}

function cleanup(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const graphLabel: GraphLabel = graph.graph();
    graph.removeNode(graphLabel.nestingRoot!);
    delete graphLabel.nestingRoot;
    graph.edges().forEach(e => {
        const edge: EdgeLabel = graph.edge(e);
        if (edge.nestingEdge) {
            graph.removeEdge(e);
        }
    });
}
