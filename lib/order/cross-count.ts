import {zipObject} from "../util";
import type {Graph} from '../types';
import {Edge} from "@dagrejs/graphlib";

/*
 * A function that takes a layering (an array of layers, each with an array of
 * ordererd nodes) and a graph and returns a weighted crossing count.
 *
 * Pre-conditions:
 *
 *    1. Input graph must be simple (not a multigraph), directed, and include
 *       only simple edges.
 *    2. Edges in the input graph must have assigned weights.
 *
 * Post-conditions:
 *
 *    1. The graph and layering matrix are left unchanged.
 *
 * This algorithm is derived from Barth, et al., "Bilayer Cross Counting."
 */
export default function crossCount(graph: Graph, layering: string[][]): number {
    let cc = 0;
    for (let i = 1; i < layering.length; ++i) {
        cc += twoLayerCrossCount(graph, layering[i - 1]!, layering[i]!);
    }
    return cc;
}

interface SouthEntry {
    pos: number;
    weight: number;
}


function tailOffset(graph: Graph, edge: Edge): number {
    const offset = graph.edge(edge).tailport;
    return offset === undefined ? 0 : offset;
}

function headOffset(graph: Graph, edge: Edge): number {
    const offset = graph.edge(edge).headport;
    return offset === undefined ? 0 : offset;
}


function twoLayerCrossCount(graph: Graph, northLayer: string[], southLayer: string[]): number {
    // Sort all of the edges between the north and south layers by their position
    // in the north layer and then the south. Map these edges to the position of
    // their head in the south layer.

    // Split southLayer into multiple entries where there are multiple headPort values for any given layer
    // Turns e.g. 'node1, node2, node3' into e.g. 'node1_0, node1_12, node2_0, node3_0'
    const northSet = new Set(northLayer);
    const splitSouthLayer: string[] = southLayer.flatMap((w: string) => {
        const edges = graph.inEdges(w);
        if (!edges) return [];
        const offsets = Array.from(new Set(
            edges
                .filter(e => northSet.has(e.v))
                .map(e => headOffset(graph, e))
        )).sort((a, b) => a - b);
        return offsets.map(offset => w + "_" + offset);
    });

    const southPos: { [key: string]: number } = zipObject(splitSouthLayer, splitSouthLayer.map((v, i) => i));
    const southSet = new Set(southLayer);

    const southEntries: SouthEntry[] = northLayer.flatMap(v => {
        const edges = graph.outEdges(v);
        if (!edges) return [];
        return edges
            .filter(e => southSet.has(e.w))
            .sort((a, b) => {
                const tailCmp = tailOffset(graph, a) - tailOffset(graph, b);
                if (tailCmp) return tailCmp;

                return southPos[a.w + "_" + headOffset(graph, a)]! - southPos[b.w + "_" + headOffset(graph, b)]!;
            })
            .map(e => {
                return {pos: southPos[e.w + "_" + headOffset(graph, e)]!, weight: graph.edge(e).weight};
            });
    });

    // Build the accumulator tree
    let firstIndex = 1;
    while (firstIndex < splitSouthLayer.length) firstIndex <<= 1;
    const treeSize = 2 * firstIndex - 1;
    firstIndex -= 1;
    const tree = new Array(treeSize).fill(0);

    // Calculate the weighted crossings
    let cc = 0;
    southEntries.forEach((entry: SouthEntry) => {
        let index = entry.pos + firstIndex;
        tree[index] += entry.weight;
        let weightSum = 0;
        while (index > 0) {
            if (index % 2) {
                weightSum += tree[index + 1];
            }
            index = (index - 1) >> 1;
            tree[index] += entry.weight;
        }
        cc += entry.weight * weightSum;
    });
    return cc;
}
