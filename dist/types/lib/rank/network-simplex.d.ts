import { type TreeEdgeLabel, type TreeNodeLabel } from "./feasible-tree";
import type { Edge, EdgeLabel, Graph, GraphLabel, NodeLabel } from "../types";
export default networkSimplex;
declare function networkSimplex(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
declare namespace networkSimplex {
    var initLowLimValues: (tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, root?: string) => void;
    var initCutValues: (tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>) => void;
    var calcCutValue: (tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, child: string) => number;
    var leaveEdge: (tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>) => Edge | undefined;
    var enterEdge: (tree: Graph<object, TreeNodeLabel, TreeEdgeLabel>, graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, edge: Edge) => Edge;
    var exchangeEdges: (t: Graph<object, TreeNodeLabel, TreeEdgeLabel>, g: Graph<GraphLabel, NodeLabel, EdgeLabel>, e: Edge, f: Edge) => void;
}
//# sourceMappingURL=network-simplex.d.ts.map