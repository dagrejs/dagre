import {Graph} from "@dagrejs/graphlib";
import greedyFAS from "./greedy-fas";
import {uniqueId} from "./util";
import type {Edge, EdgeLabel, GraphLabel, NodeLabel, WeightFunction} from "./types";

export {run, undo};

function run(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const fas = (graph.graph().acyclicer === "greedy"
        ? greedyFAS(graph, weightFn(graph))
        : dfsFAS(graph));
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

function dfsFAS(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Edge[] {
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

    graph.nodes().forEach(dfs);
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
