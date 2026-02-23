// Re-export Graph and Edge types from graphlib
import {Graph} from '@dagrejs/graphlib';

export type {Graph, Edge as GraphEdge} from '@dagrejs/graphlib';

// Basic geometric types
export interface Point {
    x: number;
    y: number;
}

// Node label with all possible properties used during layout
export interface NodeLabel {
    width: number;
    height: number;
    x?: number;
    y?: number;
    rank?: number;
    order?: number;
    e?: number;
    dummy?: 'edge' | 'border' | 'edge-label' | 'edge-proxy' | 'selfedge' | 'root';
    borderType?: 'borderLeft' | 'borderRight';
    borderTop?: string;
    borderBottom?: string;
    borderLeft?: string[];
    borderRight?: string[];
    minRank?: number;
    maxRank?: number;
    label?: string;
    labelpos?: 'l' | 'c' | 'r';
    class?: string;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    rx?: number;
    ry?: number;
    shape?: string;
    edgeLabel?: EdgeLabel;
    edgeObj?: Edge;

    [key: string]: unknown;
}

// Edge label with all possible properties used during layout
export interface EdgeLabel {
    points?: Point[];
    width?: number;
    height?: number;
    minlen?: number;
    weight?: number;
    labelpos?: 'l' | 'c' | 'r';
    labeloffset?: number;
    labelRank?: number;
    x?: number;
    y?: number;
    e?: number;
    reversed?: boolean;
    forwardName?: string;
    selfEdge?: boolean;
    nestingEdge?: boolean;
    cutvalue?: number;
    lim?: number;
    low?: number;
    parent?: string;
    edgeLabel?: EdgeLabel;
    edgeObj?: Edge;

    [key: string]: unknown;
}

// Graph label with layout configuration
export interface GraphLabel {
    width?: number;
    height?: number;
    compound?: boolean;
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
    marginx?: number;
    marginy?: number;
    acyclicer?: 'greedy';
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    rankalign?: 'top' | 'center' | 'bottom';
    nestingRoot?: string;
    nodeRankFactor?: number;
    dummyChains?: string[];

    [key: string]: unknown;
}

// User-facing configuration interfaces
export interface NodeConfig {
    width?: number;
    height?: number;
}

export interface EdgeConfig {
    minlen?: number;
    weight?: number;
    width?: number;
    height?: number;
    labelpos?: 'l' | 'c' | 'r';
    labeloffset?: number;
}

export interface LayoutConfig {
    customOrder?: (graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, order: (graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, opts: LayoutOptions) => void) => void;
    disableOptimalOrderHeuristic?: boolean;
}

// Order constraint for ordering heuristic
export interface OrderConstraint {
    left: string;
    right: string;
}

// Combined layout options type
export type LayoutOptions = GraphLabel & NodeConfig & EdgeConfig & LayoutConfig;

// Function types
export type RankerFunction = (graph: Graph<GraphLabel, NodeLabel, EdgeLabel>) => void;
export type WeightFunction = (edge: Edge) => number;
export type TimingFunction = (name: string, fn: () => void) => void;

// Utility types
export type WeightMap = { [key: string]: number };

export interface PartitionResult<T> {
    lhs: T[];
    rhs: T[];
}

export interface ListEntry<T> {
    value: T;
    prev?: ListEntry<T>;
    next?: ListEntry<T>;
}

// Edge reference used internally
export interface Edge {
    v: string;
    w: string;
    name?: string;
}
