import {Graph} from "@dagrejs/graphlib";
import greedyFAS from "./greedy-fas";
import {uniqueId} from "./util";
import type {Edge, EdgeLabel, GraphLabel, NodeLabel, WeightFunction} from "./types";

export {run, undo};

function run(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, oldGraph: Graph| null): void {
    const fas = (graph.graph().acyclicer === "greedy"
        ? greedyFAS(graph, weightFn(graph))
        : dfsFAS(graph, oldGraph));
    fas.forEach(e => {
        const label = graph.edge(e)!;
        graph.removeEdge(e);
        label.forwardName = e.name;
        label.reversed = true;
        graph.setEdge(e.w, e.v, label, uniqueId("rev"));
    });

    function weightFn(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): WeightFunction {
        return (e: Edge) => {
            return g.edge(e)!.weight!;
        };
    }
}

function dfsFAS(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, oldGraph: Graph|null): Edge[] {
    const fas: Edge[] = [];
    const stack: { [key: string]: boolean } = {};
    const visited: { [key: string]: boolean } = {};

    function dfs(v: string): void {
        if (Object.hasOwn(visited, v)) {
            return;
        }
        visited[v] = true;
        stack[v] = true;
        graph.outEdges(v)!.forEach(e => {
            if (Object.hasOwn(stack, e.w)) {
                fas.push(e);
            } else {
                dfs(e.w);
            }
        });
        delete stack[v];
    }

    function dfsDynamic(v: string) {
        if (Object.hasOwn(visited, v)) {
            return;
        }
        visited[v] = true;
        stack[v] = true;
        graph.outEdges(v)?.forEach(e => {
            if (Object.hasOwn(stack, e.w) ||
                (oldGraph!.node(v)?.rank > oldGraph!.node(e.w)?.rank) && isReachedFromStartWithoutEdge(graph, e.w, e)) {
                fas.push(e);
            } else {
                dfsDynamic(e.w);
            }
        });
        delete stack[v];
    }

    let dfsFn = dfs;
    if (oldGraph && typeof oldGraph.node === 'function') {
        dfsFn = dfsDynamic;
    }

    graph.sources().forEach(dfsFn);
    graph.nodes().forEach(dfsFn);

    return fas;
}

function undo(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    graph.edges().forEach(e => {
        const label = graph.edge(e)!;
        if (label.reversed) {
            graph.removeEdge(e);

            const forwardName = label.forwardName;
            delete label.reversed;
            delete label.forwardName;
            graph.setEdge(e.w, e.v, label, forwardName);
        }
    });
}

function isReachedFromStartWithoutEdge(graph: Graph, node: string, ignoreEdge: Edge) {
    // reverse dfs from the given node to 'Start' without using edge e
    const localVisited = new Set<string>();

    function reverseDfs(v: string): boolean {
        if (graph.sources().includes(v)) {
            return true;
        }
        localVisited.add(v);
        for (const e of graph.inEdges(v) ?? []) {
            // do not use ignored edge
            // do not visit the same node twice
            if (!(e.v === ignoreEdge.v && e.w === ignoreEdge.w)
                && !localVisited.has(e.v)) {
                if (reverseDfs(e.v)) {
                    return true;
                }
            }
        }
        return false;
    }
    return reverseDfs(node);
}
