import type { Graph } from '../types';
interface BarycenterEntry {
    v: string;
    barycenter?: number;
    weight?: number;
}
export default function barycenter(graph: Graph, movable?: string[]): BarycenterEntry[];
export {};
//# sourceMappingURL=barycenter.d.ts.map