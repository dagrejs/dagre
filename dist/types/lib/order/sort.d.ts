interface SortEntry {
    vs: string[];
    i: number;
    barycenter?: number;
    weight?: number;
}
interface SortResult {
    vs: string[];
    barycenter?: number;
    weight?: number;
}
export default function sort(entries: SortEntry[], biasRight?: boolean): SortResult;
export {};
//# sourceMappingURL=sort.d.ts.map