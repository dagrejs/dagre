import type { Graph } from '../types';
interface SubgraphResult {
    vs: string[];
    barycenter?: number;
    weight?: number;
}
export default function sortSubgraph(graph: Graph, v: string, constraintGraph: Graph, biasRight?: boolean): SubgraphResult;
export {};
//# sourceMappingURL=sort-subgraph.d.ts.map