import { Graph } from "../graph-lib";
import type { EdgeLabel, GraphLabel, NodeLabel } from "../types";
interface TreeNodeLabel {
    low?: number;
    lim?: number;
    parent?: string;
}
interface TreeEdgeLabel {
    cutvalue?: number;
}
export default feasibleTree;
export type { TreeNodeLabel, TreeEdgeLabel };
declare function feasibleTree(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<object, TreeNodeLabel, TreeEdgeLabel>;
//# sourceMappingURL=feasible-tree.d.ts.map