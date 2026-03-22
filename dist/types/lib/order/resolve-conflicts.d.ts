import type { Graph } from '../types';
interface BarycenterEntry {
    v: string;
    barycenter?: number;
    weight?: number;
}
export interface ResolvedEntry {
    vs: string[];
    i: number;
    barycenter?: number;
    weight?: number;
}
export default function resolveConflicts(entries: BarycenterEntry[], constraintGraph: Graph): ResolvedEntry[];
export {};
//# sourceMappingURL=resolve-conflicts.d.ts.map