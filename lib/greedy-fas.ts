import {Graph} from "./graph-lib";
import List from './data/list';
import type {Edge, WeightFunction} from './types';

/*
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 */

const DEFAULT_WEIGHT_FN: WeightFunction = () => 1;

interface FASEntry {
    v: string;
    in: number;
    out: number;
    [key: string]: unknown;
}

interface FASState {
    graph: Graph;
    buckets: List[];
    zeroIdx: number;
}

export default function greedyFAS(graph: Graph, weightFn?: WeightFunction): Edge[] {
    if (graph.nodeCount() <= 1) {
        return [];
    }
    const state = buildState(graph, weightFn || DEFAULT_WEIGHT_FN);
    const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

    // Expand multi-edges
    return results.flatMap(edge => graph.outEdges(edge.v, edge.w) || []);
}

function doGreedyFAS(g: Graph, buckets: List[], zeroIdx: number): Edge[] {
    let results: Edge[] = [];
    const sources = buckets[buckets.length - 1]!;
    const sinks = buckets[0]!;

    let entry: FASEntry | undefined;
    while (g.nodeCount()) {
        while ((entry = sinks.dequeue() as FASEntry | undefined)) {
            removeNode(g, buckets, zeroIdx, entry);
        }
        while ((entry = sources.dequeue() as FASEntry | undefined)) {
            removeNode(g, buckets, zeroIdx, entry);
        }
        if (g.nodeCount()) {
            for (let i = buckets.length - 2; i > 0; --i) {
                entry = buckets[i]?.dequeue() as FASEntry | undefined;
                if (entry) {
                    results = results.concat(removeNode(g, buckets, zeroIdx, entry, true) || []);
                    break;
                }
            }
        }
    }

    return results;
}

function removeNode(
    graph: Graph,
    buckets: List[],
    zeroIdx: number,
    entry: FASEntry,
    collectPredecessors?: boolean
): Edge[] | undefined {
    const collected: Edge[] = [];
    const results: Edge[] | undefined = collectPredecessors ? collected : undefined;

    (graph.inEdges(entry.v) || []).forEach(edge => {
        const weight = graph.edge(edge) as number;
        const uEntry = graph.node(edge.v) as FASEntry;

        if (collectPredecessors) {
            collected.push({v: edge.v, w: edge.w});
        }

        uEntry.out -= weight;
        assignBucket(buckets, zeroIdx, uEntry);
    });

    (graph.outEdges(entry.v) || []).forEach(edge => {
        const weight = graph.edge(edge) as number;
        const w = edge.w;
        const wEntry = graph.node(w) as FASEntry;
        wEntry.in -= weight;
        assignBucket(buckets, zeroIdx, wEntry);
    });

    graph.removeNode(entry.v);

    return results;
}

function buildState(graph: Graph, weightFn: WeightFunction): FASState {
    const fasGraph = new Graph();
    let maxIn = 0;
    let maxOut = 0;

    graph.nodes().forEach(v => {
        fasGraph.setNode(v, {v: v, in: 0, out: 0});
    });

    // Aggregate weights on nodes, but also sum the weights across multi-edges
    // into a single edge for the fasGraph.
    graph.edges().forEach(edge => {
        const prevWeight = (fasGraph.edge(edge.v, edge.w) as number) || 0;
        const weight = weightFn(edge);
        const edgeWeight = prevWeight + weight;
        fasGraph.setEdge(edge.v, edge.w, edgeWeight);
        const vNode = fasGraph.node(edge.v) as FASEntry;
        const wNode = fasGraph.node(edge.w) as FASEntry;
        maxOut = Math.max(maxOut, vNode.out += weight);
        maxIn = Math.max(maxIn, wNode.in += weight);
    });

    const buckets = range(maxOut + maxIn + 3).map(() => new List());
    const zeroIdx = maxIn + 1;

    fasGraph.nodes().forEach(v => {
        assignBucket(buckets, zeroIdx, fasGraph.node(v) as FASEntry);
    });

    return {graph: fasGraph, buckets: buckets, zeroIdx: zeroIdx};
}

function assignBucket(buckets: List[], zeroIdx: number, entry: FASEntry): void {
    if (!entry.out) {
        buckets[0]?.enqueue(entry);
    } else if (!entry.in) {
        buckets[buckets.length - 1]?.enqueue(entry);
    } else {
        buckets[entry.out - entry.in + zeroIdx]?.enqueue(entry);
    }
}

function range(limit: number): number[] {
    const range: number[] = [];
    for (let i = 0; i < limit; i++) {
        range.push(i);
    }

    return range;
}
