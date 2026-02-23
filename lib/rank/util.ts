import {applyWithChunking} from "../util";
import type {Edge, EdgeLabel, Graph, GraphLabel, NodeLabel} from "../types";

export {longestPath, slack};

/*
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (unnormalized) "rank" property.
 */
function longestPath(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const visited: { [key: string]: boolean } = {};

    function dfs(v: string): number {
        const label: NodeLabel = graph.node(v);
        if (Object.hasOwn(visited, v)) {
            return label.rank!;
        }
        visited[v] = true;

        const outEdges = graph.outEdges(v);
        const outEdgesMinLens: number[] = outEdges ? outEdges.map(e => {
            if (e == null) {
                return Number.POSITIVE_INFINITY;
            }

            return dfs(e.w) - graph.edge(e).minlen!;
        }) : [];

        let rank: number = applyWithChunking(Math.min, outEdgesMinLens);

        if (rank === Number.POSITIVE_INFINITY) {
            rank = 0;
        }

        return (label.rank = rank);
    }

    graph.sources().forEach(dfs);
}

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
function slack(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, edge: Edge): number {
    return graph.node(edge.w).rank! - graph.node(edge.v).rank! - graph.edge(edge).minlen!;
}
