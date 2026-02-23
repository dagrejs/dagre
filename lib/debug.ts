import * as util from './util';
import {Graph} from "./graph-lib";
import type {NodeLabel} from './types';

export function debugOrdering(graph: Graph): Graph {
    const layerMatrix = util.buildLayerMatrix(graph);

    const h = new Graph({compound: true, multigraph: true}).setGraph({});

    graph.nodes().forEach(node => {
        h.setNode(node, {label: node});
        h.setParent(node, 'layer' + (graph.node(node) as NodeLabel).rank);
    });

    graph.edges().forEach(edge => h.setEdge(edge.v, edge.w, {}, edge.name));

    layerMatrix.forEach((layer, i) => {
        const layerV = 'layer' + i;
        h.setNode(layerV, {rank: 'same'});
        layer.reduce((u, v) => {
            h.setEdge(u, v, {style: 'invis'});
            return v;
        });
    });

    return h;
}
