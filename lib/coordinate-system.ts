import {hasOwn} from "./util";
/**
 * Transforms a point from subgraph-local coordinates to parent context coordinates.
 * @param x X in subgraph
 * @param y Y in subgraph
 * @param clusterX X of cluster node in parent
 * @param clusterY Y of cluster node in parent
 * @param subgraphCenterX Center X of subgraph in subgraph coords
 * @param subgraphCenterY Center Y of subgraph in subgraph coords
 * @returns [x, y] in parent context
 */
export function toParentCoords(x: number, y: number, clusterX: number, clusterY: number, subgraphCenterX: number, subgraphCenterY: number): [number, number] {
    return [clusterX + (x - subgraphCenterX), clusterY + (y - subgraphCenterY)];
}

/**
 * Transforms a point from parent context coordinates to subgraph-local coordinates.
 * @param x X in parent
 * @param y Y in parent
 * @param clusterX X of cluster node in parent
 * @param clusterY Y of cluster node in parent
 * @param subgraphCenterX Center X of subgraph in subgraph coords
 * @param subgraphCenterY Center Y of subgraph in subgraph coords
 * @returns [x, y] in subgraph-local coords
 */
export function toSubgraphCoords(x: number, y: number, clusterX: number, clusterY: number, subgraphCenterX: number, subgraphCenterY: number): [number, number] {
    return [subgraphCenterX + (x - clusterX), subgraphCenterY + (y - clusterY)];
}
import type {EdgeLabel, Graph, GraphLabel, NodeLabel, Point} from './types';

export function adjust(graph: Graph): void {
    const rankDir = (graph.graph() as GraphLabel).rankdir?.toLowerCase();
    if (rankDir === 'lr' || rankDir === 'rl') {
        swapWidthHeight(graph);
    }
}

export function undo(graph: Graph): void {
    const rankDir = (graph.graph() as GraphLabel).rankdir?.toLowerCase();
    if (rankDir === 'bt' || rankDir === 'rl') {
        reverseY(graph);
    }

    if (rankDir === 'lr' || rankDir === 'rl') {
        swapXY(graph);
        swapWidthHeight(graph);
    }
}

function swapWidthHeight(graph: Graph): void {
    graph.nodes().forEach(node => swapWidthHeightOne(graph.node(node) as NodeLabel));
    graph.edges().forEach(edge => swapWidthHeightOne(graph.edge(edge) as EdgeLabel));
}

function swapWidthHeightOne(attrs: NodeLabel | EdgeLabel): void {
    const w = attrs.width;
    attrs.width = attrs.height;
    attrs.height = w;
}

function reverseY(graph: Graph): void {
    graph.nodes().forEach(node => reverseYOne(graph.node(node) as NodeLabel));

    graph.edges().forEach(edge => {
        const edgeLabel = graph.edge(edge) as EdgeLabel;
        edgeLabel.points?.forEach(reverseYOne);
        if (hasOwn(edgeLabel, 'y')) {
            reverseYOne(edgeLabel);
        }
    });
}

function reverseYOne(attrs: NodeLabel | EdgeLabel | Point): void {
    attrs.y = -attrs.y!;
}

function swapXY(graph: Graph): void {
    graph.nodes().forEach(node => swapXYOne(graph.node(node) as NodeLabel));

    graph.edges().forEach(edge => {
        const edgeLabel = graph.edge(edge) as EdgeLabel;
        edgeLabel.points?.forEach(swapXYOne);
        if (hasOwn(edgeLabel, 'x')) {
            swapXYOne(edgeLabel);
        }
    });
}

function swapXYOne(attrs: NodeLabel | EdgeLabel | Point): void {
    const x = attrs.x;
    attrs.x = attrs.y;
    attrs.y = x;
}
