import feasibleTree, {type TreeEdgeLabel, type TreeNodeLabel} from "./feasible-tree";
import {longestPath as initRank, slack} from "./util";
import {alg} from "../graph-lib";
import {simplify} from "../util";
import type {Edge, EdgeLabel, Graph, GraphLabel, NodeLabel} from "../types";

const {preorder, postorder} = alg;

export default networkSimplex;

// Expose some internals for testing purposes
networkSimplex.initLowLimValues = initLowLimValues;
networkSimplex.initCutValues = initCutValues;
networkSimplex.calcCutValue = calcCutValue;
networkSimplex.leaveEdge = leaveEdge;
networkSimplex.enterEdge = enterEdge;
networkSimplex.exchangeEdges = exchangeEdges;

/*
 * The network simplex algorithm assigns ranks to each node in the input graph
 * and iteratively improves the ranking to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minlen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "rank" attribute that has
 *       been optimized by the network simplex algorithm. Ranks start at 0.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial ranks to each node. We use the longest path algorithm,
 *       which assigns ranks to the lowest position possible. In general this
 *       leads to very wide bottom ranks and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minlen for the edge). This by itself greatly improves the assigned
 *       rankings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 */
function networkSimplex(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    graph = simplify(graph as Graph<GraphLabel, NodeLabel, EdgeLabel>) as Graph<GraphLabel, NodeLabel, EdgeLabel>;
    initRank(graph);

    const t = feasibleTree(graph);
    initLowLimValues(t);
    initCutValues(t, graph);

    let e: Edge | undefined;
    let f: Edge;
    while ((e = leaveEdge(t))) {
        f = enterEdge(t, graph, e);
        exchangeEdges(t, graph, e, f);
    }
}

/*
 * Initializes cut values for all edges in the tree.
 */
function initCutValues(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    let visitedNodes: string[] = postorder(tree, tree.nodes());
    visitedNodes = visitedNodes.slice(0, visitedNodes.length - 1);
    visitedNodes.forEach(v => assignCutValue(tree, graph, v));
}

function assignCutValue(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, child: string): void {
    const childLab: TreeNodeLabel = tree.node(child);
    const parent: string = childLab.parent!;
    const edge = tree.edge(child, parent);
    edge.cutvalue = calcCutValue(tree, graph, child);
}

/*
 * Given the tight tree, its graph, and a child in the graph calculate and
 * return the cut value for the edge between the child and its parent.
 */
function calcCutValue(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, child: string): number {
    const childLab: TreeNodeLabel = tree.node(child);
    const parent: string = childLab.parent!;
    // True if the child is on the tail end of the edge in the directed graph
    let childIsTail: boolean = true;
    // The graph's view of the tree edge we're inspecting
    let graphEdge: EdgeLabel | undefined = graph.edge(child, parent);
    // The accumulated cut value for the edge between this node and its parent
    let cutValue: number = 0;

    if (!graphEdge) {
        childIsTail = false;
        graphEdge = graph.edge(parent, child);
    }

    cutValue = graphEdge.weight!;

    const nodeEdges = graph.nodeEdges(child);
    if (nodeEdges) {
        nodeEdges.forEach(edge => {
            const isOutEdge: boolean = edge.v === child;
            const other: string = isOutEdge ? edge.w : edge.v;

            if (other !== parent) {
                const pointsToHead: boolean = isOutEdge === childIsTail;
                const otherWeight: number = graph.edge(edge).weight!;

                cutValue += pointsToHead ? otherWeight : -otherWeight;
                if (isTreeEdge(tree, child, other)) {
                    const treeEdge = tree.edge(child, other);
                    const otherCutValue: number = treeEdge.cutvalue!;
                    cutValue += pointsToHead ? -otherCutValue : otherCutValue;
                }
            }
        });
    }

    return cutValue;
}

function initLowLimValues(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, root?: string): void {
    if (arguments.length < 2) {
        root = tree.nodes()[0];
    }
    dfsAssignLowLim(tree, {}, 1, root!);
}

function dfsAssignLowLim(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, visited: {
    [key: string]: boolean
}, nextLim: number, v: string, parent?: string): number {
    const low: number = nextLim;
    const label: TreeNodeLabel = tree.node(v);

    visited[v] = true;
    const neighbors = tree.neighbors(v);
    if (neighbors) {
        neighbors.forEach(w => {
            if (!Object.hasOwn(visited, w)) {
                nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
            }
        });
    }

    label.low = low;
    label.lim = nextLim++;
    if (parent) {
        label.parent = parent;
    } else {
        // TODO should be able to remove this when we incrementally update low lim
        delete label.parent;
    }

    return nextLim;
}

function leaveEdge(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>): Edge | undefined {
    return tree.edges().find(e => {
        const edge = tree.edge(e);
        return edge.cutvalue! < 0;
    });
}

function enterEdge(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, edge: Edge): Edge {
    let v: string = edge.v;
    let w: string = edge.w;

    // For the rest of this function we assume that v is the tail and w is the
    // head, so if we don't have this edge in the graph we should flip it to
    // match the correct orientation.
    if (!graph.hasEdge(v, w)) {
        v = edge.w;
        w = edge.v;
    }

    const vLabel: TreeNodeLabel = tree.node(v);
    const wLabel: TreeNodeLabel = tree.node(w);
    let tailLabel: TreeNodeLabel = vLabel;
    let flip: boolean = false;

    // If the root is in the tail of the edge then we need to flip the logic that
    // checks for the head and tail nodes in the candidates function below.
    if (vLabel.lim! > wLabel.lim!) {
        tailLabel = wLabel;
        flip = true;
    }

    const candidates: Edge[] = graph.edges().filter(edge => {
        return flip === isDescendant(tree, tree.node(edge.v), tailLabel) &&
            flip !== isDescendant(tree, tree.node(edge.w), tailLabel);
    });

    return candidates.reduce((acc: Edge, edge: Edge): Edge => {
        if (slack(graph, edge) < slack(graph, acc)) {
            return edge;
        }

        return acc;
    });
}

function exchangeEdges(t: Graph<object, TreeNodeLabel, TreeEdgeLabel>, g: Graph<GraphLabel, NodeLabel, EdgeLabel>, e: Edge, f: Edge): void {
    const v: string = e.v;
    const w: string = e.w;
    t.removeEdge(v, w);
    t.setEdge(f.v, f.w, {});
    initLowLimValues(t);
    initCutValues(t, g);
    updateRanks(t, g);
}

function updateRanks(t: Graph<object, TreeNodeLabel, TreeEdgeLabel>, g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const root: string | undefined = t.nodes().find(v => {
        const node = t.node(v);
        return !node.parent;
    });
    if (!root) return;

    let vs: string[] = preorder(t, [root]);
    vs = vs.slice(1);
    vs.forEach(v => {
        const treeNode = t.node(v);
        const parent: string = treeNode.parent!;
        let edge: EdgeLabel | undefined = g.edge(v, parent);
        let flipped: boolean = false;

        if (!edge) {
            edge = g.edge(parent, v);
            flipped = true;
        }

        g.node(v).rank = g.node(parent).rank! + (flipped ? edge!.minlen! : -edge!.minlen!);
    });
}

/*
 * Returns true if the edge is in the tree.
 */
function isTreeEdge(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, u: string, v: string): boolean {
    return tree.hasEdge(u, v);
}

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
function isDescendant(tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, vLabel: TreeNodeLabel, rootLabel: TreeNodeLabel): boolean {
    return rootLabel.low! <= vLabel.lim! && vLabel.lim! <= rootLabel.lim!;
}
