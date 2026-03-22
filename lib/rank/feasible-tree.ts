import {Graph} from "../graph-lib";
import {slack} from "./util";
import type {Edge, EdgeLabel, GraphLabel, NodeLabel} from "../types";

// Internal type for tree node labels
interface TreeNodeLabel {
    low?: number;
    lim?: number;
    parent?: string;
}

// Internal type for tree edge labels
interface TreeEdgeLabel {
    cutvalue?: number;
}

export default feasibleTree;
export type {TreeNodeLabel, TreeEdgeLabel};

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
function feasibleTree(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<object, TreeNodeLabel, TreeEdgeLabel> {
    const tree = new Graph<object, TreeNodeLabel, TreeEdgeLabel>({directed: false});

    // Choose arbitrary node from which to start our tree
    const nodes = graph.nodes();
    if (nodes.length === 0) {
        throw new Error("Graph must have at least one node");
    }
    const start: string = nodes[0]!;
    const size: number = graph.nodeCount();
    tree.setNode(start, {});

    let edge: Edge | null;
    let delta: number;
    while (tightTree(tree, graph) < size) {
        edge = findMinSlackEdge(tree, graph);
        if (!edge) break;
        delta = tree.hasNode(edge.v) ? slack(graph, edge) : -slack(graph, edge);
        shiftRanks(tree, graph, delta);
    }

    return tree;
}

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
function tightTree(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): number {
    function dfs(v: string): void {
        const nodeEdges = graph.nodeEdges(v);
        if (nodeEdges) {
            nodeEdges.forEach(e => {
                const edgeV: string = e.v;
                const w: string = (v === edgeV) ? e.w : edgeV;
                if (!tree.hasNode(w) && !slack(graph, e)) {
                    tree.setNode(w, {});
                    tree.setEdge(v, w, {});
                    dfs(w);
                }
            });
        }
    }

    tree.nodes().forEach(dfs);
    return tree.nodeCount();
}

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Edge | null {
    const edges: Edge[] = graph.edges();

    return edges.reduce((acc: [number, Edge | null], edge: Edge): [number, Edge | null] => {
        let edgeSlack: number = Number.POSITIVE_INFINITY;
        if (tree.hasNode(edge.v) !== tree.hasNode(edge.w)) {
            edgeSlack = slack(graph, edge);
        }

        if (edgeSlack < acc[0]) {
            return [edgeSlack, edge];
        }

        return acc;
    }, [Number.POSITIVE_INFINITY, null])[1];
}

function shiftRanks(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, delta: number): void {
    tree.nodes().forEach(v => graph.node(v).rank! += delta);
}
