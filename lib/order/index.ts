import initOrder from "./init-order";
import crossCount from "./cross-count";
import sortSubgraph from "./sort-subgraph";
import buildLayerGraph from "./build-layer-graph";
import addSubgraphConstraints from "./add-subgraph-constraints";
import {Graph} from "../graph-lib";
import * as util from "../util";
import type {Graph as GraphType, OrderConstraint} from '../types';

interface OrderOptions {
    customOrder?: (graph: GraphType, order: (g: GraphType, opts: OrderOptions) => void) => void;
    disableOptimalOrderHeuristic?: boolean;
    constraints?: OrderConstraint[];
}

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
export default function order(graph: GraphType, opts: OrderOptions = {}): void {
    if (typeof opts.customOrder === 'function') {
        opts.customOrder(graph, order);
        return;
    }

    const maxRank = util.maxRank(graph);
    const downLayerGraphs = buildLayerGraphs(graph, util.range(1, maxRank + 1), "inEdges");
    const upLayerGraphs = buildLayerGraphs(graph, util.range(maxRank - 1, -1, -1), "outEdges");

    let layering = initOrder(graph);
    assignOrder(graph, layering);

    if (opts.disableOptimalOrderHeuristic) {
        return;
    }

    let bestCC = Number.POSITIVE_INFINITY;
    let best: string[][];

    const constraints = opts.constraints || [];
    for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
        sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2, constraints);

        layering = util.buildLayerMatrix(graph);
        const cc = crossCount(graph, layering);
        if (cc < bestCC) {
            lastBest = 0;
            best = Object.assign({}, layering);
            bestCC = cc;
        } else if (cc === bestCC) {
            best = structuredClone(layering);
        }
    }

    assignOrder(graph, best!);
}

function buildLayerGraphs(graph: GraphType, ranks: number[], relationship: "inEdges" | "outEdges"): GraphType[] {
    // Build an index mapping from rank to the nodes with that rank.
    // This helps to avoid a quadratic search for all nodes with the same rank as
    // the current node.
    const nodesByRank = new Map<number, string[]>();
    const addNodeToRank = (rank: number, node: string): void => {
        if (!nodesByRank.has(rank)) {
            nodesByRank.set(rank, []);
        }
        nodesByRank.get(rank)!.push(node);
    };

    // Visit the nodes in their original order in the graph, and add each
    // node to the ranks(s) that it belongs to.
    for (const v of graph.nodes()) {
        const node = graph.node(v);
        if (typeof node.rank === "number") {
            addNodeToRank(node.rank, v);
        }
        // If there is a range of ranks, add it to each, but skip the `node.rank` which
        // has already had the node added.
        if (typeof node.minRank === "number" && typeof node.maxRank === "number") {
            for (let r = node.minRank; r <= node.maxRank; r++) {
                if (r !== node.rank) {
                    // Don't add this node to its `node.rank` twice.
                    addNodeToRank(r, v);
                }
            }
        }
    }

    return ranks.map(function (rank) {
        return buildLayerGraph(graph, rank, relationship, nodesByRank.get(rank) || []);
    });
}

function sweepLayerGraphs(layerGraphs: GraphType[], biasRight: boolean, constraints: OrderConstraint[]): void {
    const cg = new Graph() as GraphType;
    layerGraphs.forEach(function (lg) {
        constraints.forEach(con => cg.setEdge(con.left, con.right));

        const root = (lg.graph() as { root: string }).root;
        const sorted = sortSubgraph(lg, root, cg, biasRight);
        sorted.vs.forEach((v, i) => lg.node(v).order = i);
        addSubgraphConstraints(lg, cg, sorted.vs);
    });
}

function assignOrder(graph: GraphType, layering: string[][]): void {
    Object.values(layering).forEach(layer => layer.forEach((v, i) => graph.node(v).order = i));
}
