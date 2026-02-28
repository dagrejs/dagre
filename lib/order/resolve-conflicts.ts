import * as util from "../util";
import type {Graph} from '../types';

interface BarycenterEntry {
    v: string;
    barycenter?: number;
    weight?: number;
}

interface MappedEntry {
    indegree: number;
    in: MappedEntry[];
    out: MappedEntry[];
    vs: string[];
    i: number;
    barycenter?: number;
    weight?: number;
    merged?: boolean;
    [key: string]: unknown;
}

export interface ResolvedEntry {
    vs: string[];
    i: number;
    barycenter?: number;
    weight?: number;
}

/*
 * Given a list of entries of the form {v, barycenter, weight} and a
 * constraint graph this function will resolve any conflicts between the
 * constraint graph and the barycenters for the entries. If the barycenters for
 * an entry would violate a constraint in the constraint graph then we coalesce
 * the nodes in the conflict into a new node that respects the contraint and
 * aggregates barycenter and weight information.
 *
 * This implementation is based on the description in Forster, "A Fast and
 * Simple Hueristic for Constrained Two-Level Crossing Reduction," thought it
 * differs in some specific details.
 *
 * Pre-conditions:
 *
 *    1. Each entry has the form {v, barycenter, weight}, or if the node has
 *       no barycenter, then {v}.
 *
 * Returns:
 *
 *    A new list of entries of the form {vs, i, barycenter, weight}. The list
 *    `vs` may either be a singleton or it may be an aggregation of nodes
 *    ordered such that they do not violate constraints from the constraint
 *    graph. The property `i` is the lowest original index of any of the
 *    elements in `vs`.
 */
export default function resolveConflicts(entries: BarycenterEntry[], constraintGraph: Graph): ResolvedEntry[] {
    const mappedEntries: { [key: string]: MappedEntry } = {};
    entries.forEach((entry, i) => {
        const tmp: MappedEntry = {
            indegree: 0,
            "in": [],
            out: [],
            vs: [entry.v],
            i: i
        };
        if (entry.barycenter !== undefined) {
            tmp.barycenter = entry.barycenter;
            tmp.weight = entry.weight;
        }
        mappedEntries[entry.v] = tmp;
    });

    constraintGraph.edges().forEach(e => {
        const entryV = mappedEntries[e.v];
        const entryW = mappedEntries[e.w];
        if (entryV !== undefined && entryW !== undefined) {
            entryW.indegree++;
            entryV.out.push(entryW);
        }
    });

    const sourceSet = Object.values(mappedEntries).filter(entry => !entry.indegree);

    return doResolveConflicts(sourceSet);
}

function doResolveConflicts(sourceSet: MappedEntry[]): ResolvedEntry[] {
    const entries: MappedEntry[] = [];

    function handleIn(vEntry: MappedEntry): (uEntry: MappedEntry) => void {
        return (uEntry: MappedEntry) => {
            if (uEntry.merged) {
                return;
            }
            if (uEntry.barycenter === undefined ||
                vEntry.barycenter === undefined ||
                uEntry.barycenter >= vEntry.barycenter) {
                mergeEntries(vEntry, uEntry);
            }
        };
    }

    function handleOut(vEntry: MappedEntry): (wEntry: MappedEntry) => void {
        return (wEntry: MappedEntry) => {
            wEntry["in"].push(vEntry);
            if (--wEntry.indegree === 0) {
                sourceSet.push(wEntry);
            }
        };
    }

    while (sourceSet.length) {
        const entry = sourceSet.pop()!;
        entries.push(entry);
        entry["in"].reverse().forEach(handleIn(entry));
        entry.out.forEach(handleOut(entry));
    }

    return entries.filter(entry => !entry.merged).map(entry => {
        return util.pick(entry, ["vs", "i", "barycenter", "weight"]) as ResolvedEntry;
    }) as ResolvedEntry[];
}

function mergeEntries(target: MappedEntry, source: MappedEntry): void {
    let sum = 0;
    let weight = 0;

    if (target.weight) {
        sum += target.barycenter! * target.weight;
        weight += target.weight;
    }

    if (source.weight) {
        sum += source.barycenter! * source.weight;
        weight += source.weight;
    }

    target.vs = source.vs.concat(target.vs);
    target.barycenter = sum / weight;
    target.weight = weight;
    target.i = Math.min(source.i, target.i);
    source.merged = true;
}
