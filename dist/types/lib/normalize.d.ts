import type { EdgeLabel, Graph, GraphLabel, NodeLabel } from "./types";
export { run, undo };
declare function run(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
declare function undo(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void;
//# sourceMappingURL=normalize.d.ts.map