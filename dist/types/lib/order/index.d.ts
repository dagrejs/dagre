import type { Graph as GraphType, OrderConstraint } from '../types';
interface OrderOptions {
    customOrder?: (graph: GraphType, order: (g: GraphType, opts: OrderOptions) => void) => void;
    disableOptimalOrderHeuristic?: boolean;
    constraints?: OrderConstraint[];
}
export default function order(graph: GraphType, opts?: OrderOptions): void;
export {};
//# sourceMappingURL=index.d.ts.map