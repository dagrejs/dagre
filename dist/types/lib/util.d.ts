import { Graph } from "./graph-lib";
import type { EdgeLabel, GraphLabel, NodeLabel, PartitionResult, Point } from "./types";
export { addBorderNode, addDummyNode, applyWithChunking, asNonCompoundGraph, buildLayerMatrix, intersectRect, mapValues, maxRank, normalizeRanks, notime, partition, pick, predecessorWeights, range, removeEmptyRanks, simplify, successorWeights, time, uniqueId, zipObject, };
declare function addDummyNode(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, type: 'root' | "edge" | "border" | "edge-label" | "edge-proxy" | "selfedge", attrs: Partial<NodeLabel>, name: string): string;
declare function simplify(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<GraphLabel, NodeLabel, EdgeLabel>;
declare function asNonCompoundGraph(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<GraphLabel, NodeLabel, EdgeLabel>;
declare function successorWeights(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): {
    [key: string]: {
        [key: string]: number;
    };
};
declare function predecessorWeights(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): {
    [key: string]: {
        [key: string]: number;
    };
};
declare function intersectRect(rect: NodeLabel, point: Point): Point;
declare function buildLayerMatrix(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): string[][];
declare function normalizeRanks(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
declare function removeEmptyRanks(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
declare function addBorderNode(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, prefix: string, rank?: number, order?: number): string;
declare function applyWithChunking(fn: (...args: number[]) => number, argsArray: number[]): number;
declare function maxRank(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): number;
declare function partition<T>(collection: T[], fn: (value: T) => boolean): PartitionResult<T>;
declare function time<T>(name: string, fn: () => T): T;
declare function notime<T>(name: string, fn: () => T): T;
declare function uniqueId(prefix: string): string;
declare function range(start: number, limit?: number, step?: number): number[];
declare function pick<T extends Record<string, unknown>>(source: T, keys: string[]): Partial<T>;
declare function mapValues<T, R>(obj: {
    [key: string]: T;
}, funcOrProp: ((val: T, key: string) => R) | string): {
    [key: string]: R;
};
declare function zipObject<T>(props: string[], values: T[]): {
    [key: string]: T;
};
export declare const GRAPH_NODE = "\0";
//# sourceMappingURL=util.d.ts.map