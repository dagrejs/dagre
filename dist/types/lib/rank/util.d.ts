import type { Edge, EdgeLabel, Graph, GraphLabel, NodeLabel } from "../types";
export { longestPath, slack };
declare function longestPath(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
declare function slack(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, edge: Edge): number;
//# sourceMappingURL=util.d.ts.map