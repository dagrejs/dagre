import barycenter from "./barycenter";
import resolveConflicts, {ResolvedEntry} from "./resolve-conflicts";
import sort from "./sort";
import type {Graph, NodeCollection} from '../types';

interface SubgraphResult {
    vs: string[];
    barycenter?: number;
    weight?: number;
}

interface BarycenterEntry {
    v: string;
    barycenter?: number;
    weight?: number;
}

export default function sortSubgraph(graph: Graph, v: string, constraintGraph: Graph, oldNodes: NodeCollection, biasRight?: boolean): {result: SubgraphResult, usedBias: boolean} {
    let movable = graph.children(v);
    const node = graph.node(v);
    const bl: string | undefined = node ? (node.borderLeft) : undefined;
    const br: string | undefined = node ? (node.borderRight) : undefined;
    const subgraphs: { [key: string]: SubgraphResult } = {};

    if (bl) {
        movable = movable.filter(w => w !== bl && w !== br);
    }

    const barycenters = barycenter(graph, movable);
    barycenters.forEach(entry => {
        if (graph.children(entry.v).length) {
            const {result: subgraphResult} = sortSubgraph(graph, entry.v, constraintGraph, oldNodes, biasRight);
            subgraphs[entry.v] = subgraphResult;
            if (Object.hasOwn(subgraphResult, "barycenter")) {
                mergeBarycenters(entry, subgraphResult);
            }
        }
    });

    const entries = resolveConflicts(barycenters, constraintGraph);
    expandSubgraphs(entries, subgraphs);

    const reversedPairs: Record<string, ResolvedEntry> = {};
    let usedBias = false;
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            if (!entries[i] || !entries[j] || !entries[i]?.barycenter || !entries[j]?.barycenter) {
                continue;
            }
            if (entries[i]?.barycenter === entries[j]!.barycenter) {
                const nameI = entries[i]?.vs[0] ?? "";
                const nameJ = entries[j]?.vs[0] ?? "";
                const nodeI = graph.node(nameI);
                const nodeJ = graph.node(nameJ);

                if (nodeI.dummy === "edge" && nodeJ.dummy === "edge" &&
                    nodeI.edgeObj?.v === nodeJ.edgeObj?.v &&
                    nodeI.edgeObj?.w === nodeJ.edgeObj?.w) {
                    if (nodeI.edgeLabel.reversed) {
                        reversedPairs[nameJ] = entries[i]!;
                        entries.splice(i, 1);
                        i--;
                        break;
                    } else {
                        reversedPairs[nameI] = entries[j]!;
                        entries.splice(j, 1);
                        j--;
                    }

                } else {
                    usedBias = true;
                }
            }
        }
    }

    const result = sort(entries, reversedPairs, oldNodes, graph, biasRight);

    if (bl && br) {
        result.vs = [bl, result.vs, br].flat(1) as string[];
        const blPredecessors = graph.predecessors(bl);
        if (blPredecessors && blPredecessors.length) {
            const blPred = graph.node(blPredecessors[0]!);
            const brPredecessors = graph.predecessors(br);
            const brPred = graph.node(brPredecessors![0]!);
            if (!Object.hasOwn(result, "barycenter")) {
                result.barycenter = 0;
                result.weight = 0;
            }
            result.barycenter = (result.barycenter! * result.weight! +
                blPred.order! + brPred.order!) / (result.weight! + 2);
            result.weight! += 2;
        }
    }

    return {result: result, usedBias: usedBias};
}

function expandSubgraphs(entries: { vs: string[] }[], subgraphs: { [key: string]: SubgraphResult }): void {
    entries.forEach(entry => {
        entry.vs = entry.vs.flatMap(v => {
            if (subgraphs[v]) {
                return subgraphs[v].vs;
            }
            return v;
        });
    });
}

function mergeBarycenters(target: BarycenterEntry, other: SubgraphResult): void {
    if (target.barycenter !== undefined) {
        target.barycenter = (target.barycenter * target.weight! +
                other.barycenter! * other.weight!) /
            (target.weight! + other.weight!);
        target.weight! += other.weight!;
    } else {
        target.barycenter = other.barycenter;
        target.weight = other.weight;
    }
}
