import * as util from "../util";
import type {Graph, NodeCollection} from '../types';
import {ResolvedEntry} from "./resolve-conflicts";

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

export default function sort(entries: SortEntry[], reversedPairs: Record<string, ResolvedEntry>, oldNodes: NodeCollection, graph: Graph, biasRight?: boolean): SortResult {
    const parts = util.partition(entries, entry => {
        return Object.hasOwn(entry, "barycenter");
    });
    const sortable = parts.lhs;
    const unsortable = parts.rhs.sort((a, b) => b.i - a.i);
    const vs: string[][] = [];
    let sum = 0;
    let weight = 0;
    let vsIndex = 0;

    sortable.sort(compareWithOldOrder(graph, oldNodes, !!biasRight));

    // re-inserts the links, that are already in sortable but reversed, next to its reverse counterpart
    for (const [key, value] of Object.entries(reversedPairs)) {
        const keyIndex = sortable.findIndex(entry => entry.vs[0] === key);
        sortable.splice(keyIndex + 1, 0, value);
    }

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

function compareWithOldOrder(graph: Graph, oldNodes: NodeCollection, bias: boolean): (entryV: SortEntry, entryW: SortEntry) => number {
    return (entryV: SortEntry, entryW: SortEntry) => {
        if (entryV.barycenter! < entryW.barycenter!) {
            return -1;
        } else if (entryV.barycenter! > entryW.barycenter!) {
            return 1;
        }

        if (typeof entryV.vs[0] === "string" || typeof entryW.vs[0] === "string") {
            const nodeV = graph.node(entryV.vs[0]!);
            const nodeW = graph.node(entryW.vs[0]!);
            const byOldOrder = util.compareByOldOrder(oldNodes, nodeV, nodeW);
            if (byOldOrder !== 0) {
                return byOldOrder;
            }
        }

        return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
    };
}
