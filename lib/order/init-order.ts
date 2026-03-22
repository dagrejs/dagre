import * as util from "../util";
import type {Graph} from '../types';

/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
export default function initOrder(graph: Graph): string[][] {
    const visited: { [key: string]: boolean } = {};
    const simpleNodes = graph.nodes().filter(v => !graph.children(v).length);
    const simpleNodesRanks = simpleNodes.map(v => graph.node(v).rank);
    const maxRank = util.applyWithChunking(Math.max, simpleNodesRanks);
    const layers: string[][] = util.range(maxRank + 1).map(() => []);

    function dfs(v: string): void {
        if (visited[v]) return;
        visited[v] = true;
        const node = graph.node(v);
        layers[node.rank]!.push(v);
        const successors = graph.successors(v);
        if (successors) {
            successors.forEach(dfs);
        }
    }

    const orderedVs = simpleNodes.sort((a, b) => graph.node(a).rank - graph.node(b).rank);
    orderedVs.forEach(dfs);

    return layers;
}
