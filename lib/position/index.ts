import * as util from "../util";
import {positionX} from "./bk";
import type {Graph} from '@dagrejs/graphlib';
import type {EdgeLabel, GraphLabel, NodeLabel} from "../types";

export {position};

function position(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    graph = util.asNonCompoundGraph(graph);

    positionY(graph);
    Object.entries(positionX(graph)).forEach(([v, x]) => graph.node(v).x = x);
}

function positionY(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const layering: string[][] = util.buildLayerMatrix(graph);
    const graphLabel = graph.graph();
    const rankSep: number = graphLabel.ranksep!;
    const rankAlign: string | undefined = graphLabel.rankalign;
    let prevY = 0;
    layering.forEach(layer => {
        const maxHeight: number = layer.reduce((acc: number, v: string) => {
            const height: number = graph.node(v).height ?? 0;
            if (acc > height) {
                return acc;
            } else {
                return height;
            }
        }, 0);
        layer.forEach(v => {
            const node = graph.node(v) as NodeLabel;
            if (rankAlign === "top") {
                node.y = prevY + node.height / 2;
            } else if (rankAlign === "bottom") {
                node.y = prevY + maxHeight - node.height / 2;
            } else {
                node.y = prevY + maxHeight / 2;
            }
        });
        prevY += maxHeight + rankSep;
    });
}
