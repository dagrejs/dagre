import {Graph} from "./graph-lib";
import type {EdgeLabel, GraphLabel, NodeLabel, PartitionResult, Point} from "./types";

export {
    addBorderNode,
    addDummyNode,
    applyWithChunking,
    asNonCompoundGraph,
    buildLayerMatrix,
    intersectRect,
    mapValues,
    maxRank,
    normalizeRanks,
    notime,
    partition,
    pick,
    predecessorWeights,
    range,
    removeEmptyRanks,
    simplify,
    successorWeights,
    time,
    uniqueId,
    zipObject,
};

/*
 * Adds a dummy node to the graph and return v.
 */
function addDummyNode(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    type: 'root' | "edge" | "border" | "edge-label" | "edge-proxy" | "selfedge",
    attrs: Partial<NodeLabel>,
    name: string
): string {
    let v: string = name;
    while (graph.hasNode(v)) {
        v = uniqueId(name);
    }

    attrs.dummy = type;
    graph.setNode(v, attrs as NodeLabel);
    return v;
}

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
function simplify(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<GraphLabel, NodeLabel, EdgeLabel> {
    const simplified = new Graph<GraphLabel, NodeLabel, EdgeLabel>().setGraph(graph.graph());
    graph.nodes().forEach(v => simplified.setNode(v, graph.node(v)));
    graph.edges().forEach(e => {
        const simpleLabel: EdgeLabel = simplified.edge(e.v, e.w) || {weight: 0, minlen: 1};
        const label: EdgeLabel = graph.edge(e);
        simplified.setEdge(e.v, e.w, {
            weight: simpleLabel.weight! + label.weight!,
            minlen: Math.max(simpleLabel.minlen!, label.minlen!)
        });
    });
    return simplified;
}

function asNonCompoundGraph(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<GraphLabel, NodeLabel, EdgeLabel> {
    const simplified = new Graph<GraphLabel, NodeLabel, EdgeLabel>({multigraph: graph.isMultigraph()}).setGraph(graph.graph());
    graph.nodes().forEach(v => {
        if (!graph.children(v).length) {
            simplified.setNode(v, graph.node(v));
        }
    });
    graph.edges().forEach(e => {
        simplified.setEdge(e, graph.edge(e));
    });
    return simplified;
}

function successorWeights(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): {
    [key: string]: { [key: string]: number }
} {
    const weightMap: { [key: string]: number }[] = graph.nodes().map(v => {
        const sucs: { [key: string]: number } = {};
        const outEdges = graph.outEdges(v);
        if (outEdges) {
            outEdges.forEach(e => {
                sucs[e.w] = (sucs[e.w] || 0) + graph.edge(e).weight!;
            });
        }
        return sucs;
    });
    return zipObject(graph.nodes(), weightMap);
}

function predecessorWeights(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): {
    [key: string]: { [key: string]: number }
} {
    const weightMap: { [key: string]: number }[] = graph.nodes().map(v => {
        const preds: { [key: string]: number } = {};
        const inEdges = graph.inEdges(v);
        if (inEdges) {
            inEdges.forEach(e => {
                preds[e.v] = (preds[e.v] || 0) + graph.edge(e).weight!;
            });
        }
        return preds;
    });
    return zipObject(graph.nodes(), weightMap);
}

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
function intersectRect(rect: NodeLabel, point: Point): Point {
    const x: number = rect.x!;
    const y: number = rect.y!;

    // Rectangle intersection algorithm from:
    // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
    const dx: number = point.x - x;
    const dy: number = point.y - y;
    let w: number = rect.width / 2;
    let h: number = rect.height / 2;

    if (!dx && !dy) {
        throw new Error("Not possible to find intersection inside of the rectangle");
    }

    let sx: number, sy: number;
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
        // Intersection is top or bottom of rect.
        if (dy < 0) {
            h = -h;
        }
        sx = h * dx / dy;
        sy = h;
    } else {
        // Intersection is left or right of rect.
        if (dx < 0) {
            w = -w;
        }
        sx = w;
        sy = w * dy / dx;
    }

    return {x: x + sx, y: y + sy};
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * function will produce a matrix with the ids of each node.
 */
function buildLayerMatrix(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): string[][] {
    const layering: string[][] = range(maxRank(graph) + 1).map(() => []);
    graph.nodes().forEach(v => {
        const node = graph.node(v) as NodeLabel;
        const rank: number | undefined = node.rank;
        if (rank !== undefined) {
            if (!layering[rank]) {
                layering[rank] = [];
            }
            layering[rank][node.order!] = v;
        }
    });
    return layering;
}

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
function normalizeRanks(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const nodeRanks: number[] = graph.nodes().map(v => {
        const rank: number | undefined = (graph.node(v) as NodeLabel).rank;
        if (rank === undefined) {
            return Number.MAX_VALUE;
        }

        return rank;
    });
    const min: number = applyWithChunking(Math.min, nodeRanks);
    graph.nodes().forEach(v => {
        const node = graph.node(v) as NodeLabel;
        if (Object.hasOwn(node, "rank")) {
            (node as NodeLabel).rank! -= min;
        }
    });
}

function removeEmptyRanks(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    // Ranks may not start at 0, so we need to offset them
    const nodeRanks: number[] = graph.nodes().map(v => graph.node(v).rank).filter((rank): rank is number => rank !== undefined);
    const offset: number = applyWithChunking(Math.min, nodeRanks);

    const layers: string[][] = [];
    graph.nodes().forEach(v => {
        const rank: number = graph.node(v).rank! - offset;
        if (!layers[rank]) {
            layers[rank] = [];
        }
        layers[rank].push(v);
    });

    let delta: number = 0;
    const nodeRankFactor: number = graph.graph().nodeRankFactor!;
    Array.from(layers).forEach((vs, i) => {
        if (vs === undefined && i % nodeRankFactor !== 0) {
            --delta;
        } else if (vs !== undefined && delta) {
            vs.forEach(v => graph.node(v).rank! += delta);
        }
    });
}

function addBorderNode(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    prefix: string,
    rank?: number,
    order?: number
): string {
    const node: Partial<NodeLabel> = {
        width: 0,
        height: 0
    };
    if (arguments.length >= 4) {
        node.rank = rank;
        node.order = order;
    }
    return addDummyNode(graph, "border", node, prefix);
}

function splitToChunks<T>(array: T[], chunkSize: number = CHUNKING_THRESHOLD): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk: T[] = array.slice(i, i + chunkSize);
        chunks.push(chunk);
    }
    return chunks;
}

const CHUNKING_THRESHOLD = 65535;

function applyWithChunking(fn: (...args: number[]) => number, argsArray: number[]): number {
    if (argsArray.length > CHUNKING_THRESHOLD) {
        const chunks: number[][] = splitToChunks(argsArray);
        return fn(...chunks.map(chunk => fn(...chunk)));
    } else {
        return fn(...argsArray);
    }
}

function maxRank(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): number {
    const nodes: string[] = graph.nodes();
    const nodeRanks: number[] = nodes.map(v => {
        const rank: number | undefined = graph.node(v).rank;
        if (rank === undefined) {
            return Number.MIN_VALUE;
        }
        return rank;
    });

    return applyWithChunking(Math.max, nodeRanks);
}

/*
 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
 * function returns true for an entry it goes into `lhs`. Otherwise it goes
 * into `rhs.
 */
function partition<T>(collection: T[], fn: (value: T) => boolean): PartitionResult<T> {
    const result: PartitionResult<T> = {lhs: [], rhs: []};
    collection.forEach(value => {
        if (fn(value)) {
            result.lhs.push(value);
        } else {
            result.rhs.push(value);
        }
    });
    return result;
}

/*
 * Returns a new function that wraps `fn` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
function time<T>(name: string, fn: () => T): T {
    const start: number = Date.now();
    try {
        return fn();
    } finally {
        console.log(name + " time: " + (Date.now() - start) + "ms");
    }
}

function notime<T>(name: string, fn: () => T): T {
    return fn();
}

let idCounter = 0;

function uniqueId(prefix: string): string {
    const id: number = ++idCounter;
    return prefix + ("" + id);
}

function range(start: number, limit?: number, step: number = 1): number[] {
    if (limit == null) {
        limit = start;
        start = 0;
    }

    let endCon: (i: number) => boolean = (i) => i < limit!;
    if (step < 0) {
        endCon = (i) => limit! < i;
    }

    const range: number[] = [];
    for (let i = start; endCon(i); i += step) {
        range.push(i);
    }

    return range;
}

function pick<T extends Record<string, unknown>>(source: T, keys: string[]): Partial<T> {
    const dest: Partial<T> = {};
    for (const key of keys) {
        if (source[key] !== undefined) {
            (dest as Record<string, unknown>)[key] = source[key];
        }
    }

    return dest;
}

function mapValues<T, R>(obj: { [key: string]: T }, funcOrProp: ((val: T, key: string) => R) | string): {
    [key: string]: R
} {
    let func: (val: T, key: string) => R;
    if (typeof funcOrProp === 'string') {
        func = (val: T) => (val as Record<string, R>)[funcOrProp] as R;
    } else {
        func = funcOrProp;
    }

    return Object.entries(obj).reduce((acc: { [key: string]: R }, [k, v]) => {
        acc[k] = func(v, k);
        return acc;
    }, {});
}

function zipObject<T>(props: string[], values: T[]): { [key: string]: T } {
    return props.reduce((acc: { [key: string]: T }, key, i) => {
        acc[key] = values[i]!;
        return acc;
    }, {});
}

// TODO: Remove it when the type is fixed in graphlib. from children(v: string): string[] to children(v?: string): string[];
export const GRAPH_NODE = "\x00";
