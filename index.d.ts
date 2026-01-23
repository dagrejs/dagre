import { Graph as ImportedGraph, Node as GraphNode, Edge as GraphEdge } from '@dagrejs/graphlib';

// --- Graphlib Exports (Public API of dagre.graphlib) ---

export namespace graphlib {
  export { ImportedGraph as Graph };

  export namespace json {
    function read(graph: any): Graph;
    function write(graph: Graph): any;
  }

  export namespace alg {
    function components(graph: Graph): string[][];
    function dijkstra(graph: Graph, source: string, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    function dijkstraAll(graph: Graph, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    function findCycles(graph: Graph): string[][];
    function floydWarshall(graph: Graph, weightFn?: WeightFn, edgeFn?: EdgeFn): any;
    function isAcyclic(graph: Graph): boolean;
    function postorder(graph: Graph, nodeNames: string | string[]): string[];
    function preorder(graph: Graph, nodeNames: string | string[]): string[];
    function prim<T>(graph: Graph<T>, weightFn?: WeightFn): Graph<T>;
    function tarjam(graph: Graph): string[][];
    function topsort(graph: Graph): string[];
  }
}

export interface Label {
  label?: string;
  width?: number;
  height?: number;
  minRank?: number;
  maxRank?: number;
  borderLeft?: string[];
  borderRight?: string[];
  [key: string]: any;
}
export type WeightFn = (edge: Edge) => number;
export type EdgeFn = (outNodeName: string) => GraphEdge[];

export interface GraphLabel {
  width?: number | undefined;
  height?: number | undefined;
  compound?: boolean | undefined;
  rankdir?: string | undefined;
  align?: string | undefined;
  nodesep?: number | undefined;
  edgesep?: number | undefined;
  ranksep?: number | undefined;
  marginx?: number | undefined;
  marginy?: number | undefined;
  acyclicer?: string | undefined;
  ranker?: string | undefined;
  rankalign?: 'top' | 'center' | 'bottom' | undefined;
}

export interface NodeConfig {
  width?: number | undefined;
  height?: number | undefined;
}

export interface EdgeConfig {
  minlen?: number | undefined;
  weight?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  labelpos?: 'l' | 'c' | 'r' | undefined;
  labeloffest?: number | undefined;
}

export interface LayoutConfig {
  customOrder?: (graph: graphlib.Graph, order: (graph: graphlib.Graph, opts: configUnion) => void) => void;
  disableOptimalOrderHeuristic?: boolean;
}

type configUnion = GraphLabel & NodeConfig & EdgeConfig & LayoutConfig;

export function layout(graph: graphlib.Graph, layout?: configUnion): void;

export interface Edge {
  v: string;
  w: string;
  name?: string | undefined;
}

export interface GraphEdge {
  points: Array<{ x: number; y: number }>;
  [key: string]: any;
}

export type Node<T = {}> = T & {
  x: number;
  y: number;
  width: number;
  height: number;
  class?: string | undefined;
  label?: string | undefined;
  padding?: number | undefined;
  paddingX?: number | undefined;
  paddingY?: number | undefined;
  rank?: number | undefined;
  rx?: number | undefined;
  ry?: number | undefined;
  shape?: string | undefined;
};
