import * as util from "../util";

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

export default function sort(entries: SortEntry[], biasRight?: boolean): SortResult {
    const parts = util.partition(entries, entry => {
        return Object.hasOwn(entry, "barycenter");
    });
    const sortable = parts.lhs;
    const unsortable = parts.rhs.sort((a, b) => b.i - a.i);
    const vs: string[][] = [];
    let sum = 0;
    let weight = 0;
    let vsIndex = 0;

    sortable.sort(compareWithBias(!!biasRight));

    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

    sortable.forEach(entry => {
        vsIndex += entry.vs.length;
        vs.push(entry.vs);
        sum += entry.barycenter! * entry.weight!;
        weight += entry.weight!;
        vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    });

    const result: SortResult = {vs: vs.flat(1) as string[]};
    if (weight) {
        result.barycenter = sum / weight;
        result.weight = weight;
    }
    return result;
}

function consumeUnsortable(vs: string[][], unsortable: SortEntry[], index: number): number {
    let last: SortEntry | undefined;
    while (unsortable.length && (last = unsortable[unsortable.length - 1])!.i <= index) {
        unsortable.pop();
        vs.push(last!.vs);
        index++;
    }
    return index;
}

function compareWithBias(bias: boolean): (entryV: SortEntry, entryW: SortEntry) => number {
    return (entryV: SortEntry, entryW: SortEntry) => {
        if (entryV.barycenter! < entryW.barycenter!) {
            return -1;
        } else if (entryV.barycenter! > entryW.barycenter!) {
            return 1;
        }

        return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
    };
}
