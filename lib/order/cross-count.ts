import {zipObject} from "../util";
import type {Graph} from '../types';

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

interface SouthEntryWithMeta extends SouthEntry {
    edgeId: string;
    hasPortOffset: boolean;
}

function sourcePortPos(port: unknown): number | undefined {
    if (!port || typeof port !== "object") {
        return undefined;
    }

    const maybePoint = port as {x?: number; y?: number};
    if (typeof maybePoint.x === "number" && maybePoint.x !== 0) {
        return maybePoint.x;
    }
    if (typeof maybePoint.y === "number") {
        return maybePoint.y;
    }
    if (typeof maybePoint.x === "number") {
        return maybePoint.x;
    }

    return undefined;
}

function hasPortOffset(port: unknown): boolean {
    if (!port || typeof port !== "object") {
        return false;
    }

    const maybePoint = port as {x?: number; y?: number};
    return (typeof maybePoint.x === "number" && maybePoint.x !== 0)
        || (typeof maybePoint.y === "number" && maybePoint.y !== 0);
}

function edgeId(e: {v: string; w: string; name?: string}): string {
    return e.name !== undefined ? `${e.v}->${e.w}#${String(e.name)}` : `${e.v}->${e.w}`;
}


function twoLayerCrossCount(graph: Graph, northLayer: string[], southLayer: string[]): number {
    // Sort all of the edges between the north and south layers by their position
    // in the north layer and then the south. Map these edges to the position of
    // their head in the south layer.
    const southPos: { [key: string]: number } = zipObject(southLayer, southLayer.map((v, i) => i));
    const southNodeBuckets = new Map<string, Set<number | undefined>>();
    southLayer.forEach(v => southNodeBuckets.set(v, new Set([undefined])));

    northLayer.forEach(v => {
        const edges = graph.outEdges(v);
        if (!edges) return;
        edges.forEach(e => {
            const bucket = southNodeBuckets.get(e.w);
            if (!bucket) return;
            bucket.add(sourcePortPos(graph.edge(e).headport));
        });
    });

    const southEndpointPos = new Map<string, number>();
    let nextEndpointPos = 0;
    southLayer.forEach(v => {
        const bucket = Array.from(southNodeBuckets.get(v) || new Set<number | undefined>([undefined]))
            .sort((a, b) => (a ?? 0) - (b ?? 0));
        bucket.forEach(headPos => {
            southEndpointPos.set(`${v}:${String(headPos)}`, nextEndpointPos++);
        });
    });

    const edgeSouthPos = (w: string, headPos: number | undefined): number => {
        const endpointPos = southEndpointPos.get(`${w}:${String(headPos)}`);
        if (endpointPos !== undefined) {
            return endpointPos;
        }
        return southPos[w]!;
    };

    const southEntriesWithMeta: SouthEntryWithMeta[] = northLayer.flatMap(v => {
        const edges = graph.outEdges(v);
        if (!edges) return [];
        return edges.map(e => {
            const edgeLabel = graph.edge(e);
            const headPos = sourcePortPos(edgeLabel.headport);
            return {
                pos: edgeSouthPos(e.w, headPos),
                weight: edgeLabel.weight,
                tailPos: sourcePortPos(edgeLabel.tailport),
                edgeId: edgeId(e),
                hasPortOffset: hasPortOffset(edgeLabel.tailport) || hasPortOffset(edgeLabel.headport)
            };
        }).sort((a, b) => {
            if (a.tailPos !== undefined && b.tailPos !== undefined && a.tailPos !== b.tailPos) {
                return a.tailPos - b.tailPos;
            }
            return a.pos - b.pos;
        }).map(({pos, weight, edgeId, hasPortOffset}) => ({pos, weight, edgeId, hasPortOffset}));
    });

    const southEntries: SouthEntry[] = southEntriesWithMeta.map(({pos, weight}) => ({pos, weight}));

    // Build the accumulator tree
    let firstIndex = 1;
    while (firstIndex < nextEndpointPos) firstIndex <<= 1;
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
