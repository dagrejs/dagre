import * as acyclic from "./acyclic";
import * as normalize from "./normalize";
import rank from "./rank";
import * as util from "./util";
import {normalizeRanks, removeEmptyRanks} from "./util";
import parentDummyChains from "./parent-dummy-chains";
import * as nestingGraph from "./nesting-graph";
import addBorderSegments from "./add-border-segments";
import * as coordinateSystem from "./coordinate-system";
import order from "./order";
import {position} from "./position";
import {Graph} from "./graph-lib";
import type {Edge, EdgeLabel, GraphLabel, LayoutOptions, NodeLabel, Point} from "./types";

interface SelfEdge {
    e: Edge;
    label: EdgeLabel;
}

interface ExtendedNodeLabel extends NodeLabel {
    selfEdges?: SelfEdge[];
}

interface SelfEdgeNodeLabel extends Omit<NodeLabel, 'e' | 'label'> {
    e: Edge;
    label: EdgeLabel;
}

interface EdgeProxyNodeLabel extends Omit<NodeLabel, 'e'> {
    e: Edge;
}

export function layout(g: Graph<GraphLabel, NodeLabel, EdgeLabel>, opts: LayoutOptions = {}): Graph<GraphLabel, NodeLabel, EdgeLabel> {
    const time = opts.debugTiming ? util.time : util.notime;
    return time("layout", () => {
        const layoutGraph =
            time("  buildLayoutGraph", () => buildLayoutGraph(g));
        time("  runLayout", () => runLayout(layoutGraph, time, opts));
        time("  updateInputGraph", () => updateInputGraph(g, layoutGraph));
        return layoutGraph;
    });
}

function runLayout(
    g: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    time: <T>(name: string, fn: () => T) => T,
    opts: LayoutOptions
): void {
    time("    makeSpaceForEdgeLabels", () => makeSpaceForEdgeLabels(g));
    time("    removeSelfEdges", () => removeSelfEdges(g));
    time("    acyclic", () => acyclic.run(g));
    time("    nestingGraph.run", () => nestingGraph.run(g));
    time("    rank", () => rank(util.asNonCompoundGraph(g)));
    time("    injectEdgeLabelProxies", () => injectEdgeLabelProxies(g));
    time("    removeEmptyRanks", () => removeEmptyRanks(g));
    time("    nestingGraph.cleanup", () => nestingGraph.cleanup(g));
    time("    normalizeRanks", () => normalizeRanks(g));
    time("    assignRankMinMax", () => assignRankMinMax(g));
    time("    removeEdgeLabelProxies", () => removeEdgeLabelProxies(g));
    time("    normalize.run", () => normalize.run(g));
    time("    parentDummyChains", () => parentDummyChains(g));
    time("    addBorderSegments", () => addBorderSegments(g));
    time("    order", () => order(g, opts));
    time("    insertSelfEdges", () => insertSelfEdges(g));
    time("    adjustCoordinateSystem", () => coordinateSystem.adjust(g));
    time("    position", () => position(g));
    time("    positionSelfEdges", () => positionSelfEdges(g));
    time("    removeBorderNodes", () => removeBorderNodes(g));
    time("    normalize.undo", () => normalize.undo(g));
    time("    fixupEdgeLabelCoords", () => fixupEdgeLabelCoords(g));
    time("    undoCoordinateSystem", () => coordinateSystem.undo(g));
    time("    translateGraph", () => translateGraph(g));
    time("    assignNodeIntersects", () => assignNodeIntersects(g));
    time("    reversePoints", () => reversePointsForReversedEdges(g));
    time("    acyclic.undo", () => acyclic.undo(g));
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(
    inputGraph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    layoutGraph: Graph<GraphLabel, NodeLabel, EdgeLabel>
): void {
    inputGraph.nodes().forEach(v => {
        const inputLabel = inputGraph.node(v);
        const layoutLabel = layoutGraph.node(v);

        if (inputLabel) {
            inputLabel.x = layoutLabel.x;
            inputLabel.y = layoutLabel.y;
            inputLabel.order = layoutLabel.order;
            inputLabel.rank = layoutLabel.rank;

            if (layoutGraph.children(v).length) {
                inputLabel.width = layoutLabel.width;
                inputLabel.height = layoutLabel.height;
            }
        }
    });

    inputGraph.edges().forEach(e => {
        const inputLabel = inputGraph.edge(e);
        const layoutLabel = layoutGraph.edge(e);

        inputLabel.points = layoutLabel.points;
        if (Object.hasOwn(layoutLabel, "x")) {
            inputLabel.x = layoutLabel.x;
            inputLabel.y = layoutLabel.y;
        }
    });

    inputGraph.graph().width = layoutGraph.graph().width;
    inputGraph.graph().height = layoutGraph.graph().height;
}

const graphNumAttrs: string[] = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
const graphDefaults: Partial<GraphLabel> = {ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "TB", rankalign: "center"};
const graphAttrs: string[] = ["acyclicer", "ranker", "rankdir", "align", "rankalign"];
const nodeNumAttrs: string[] = ["width", "height", "rank"];
const nodeDefaults: Partial<NodeLabel> = {width: 0, height: 0};
const edgeNumAttrs: string[] = ["minlen", "weight", "width", "height", "labeloffset"];
const edgeDefaults: Partial<EdgeLabel> = {
    minlen: 1, weight: 1, width: 0, height: 0,
    labeloffset: 10, labelpos: "r"
};
const edgeAttrs: string[] = ["labelpos"];

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph: Graph<GraphLabel, NodeLabel, EdgeLabel>): Graph<GraphLabel, NodeLabel, EdgeLabel> {
    const g = new Graph<GraphLabel, NodeLabel, EdgeLabel>({multigraph: true, compound: true});
    const graph = canonicalize(inputGraph.graph());

    g.setGraph(Object.assign({},
        graphDefaults,
        selectNumberAttrs(graph, graphNumAttrs),
        util.pick(graph, graphAttrs)));

    inputGraph.nodes().forEach(v => {
        const node = canonicalize(inputGraph.node(v));
        const newNode = selectNumberAttrs(node, nodeNumAttrs) as NodeLabel;
        Object.keys(nodeDefaults).forEach(k => {
            if (newNode[k] === undefined) {
                newNode[k] = (nodeDefaults)[k];
            }
        });

        g.setNode(v, newNode);
        const parent = inputGraph.parent(v);
        if (parent !== undefined) {
            g.setParent(v, parent);
        }
    });

    inputGraph.edges().forEach(e => {
        const edge = canonicalize(inputGraph.edge(e));
        g.setEdge(e, Object.assign({},
            edgeDefaults,
            selectNumberAttrs(edge, edgeNumAttrs),
            util.pick(edge, edgeAttrs)));
    });

    return g;
}

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
function makeSpaceForEdgeLabels(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const graph = g.graph();
    graph.ranksep! /= 2;
    g.edges().forEach(e => {
        const edge = g.edge(e);
        edge.minlen! *= 2;
        if (edge.labelpos!.toLowerCase() !== "c") {
            if (graph.rankdir === "TB" || graph.rankdir === "BT") {
                edge.width! += edge.labeloffset!;
            } else {
                edge.height! += edge.labeloffset!;
            }
        }
    });
}

/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
function injectEdgeLabelProxies(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.edges().forEach(e => {
        const edge = g.edge(e);
        if (edge.width && edge.height) {
            const v = g.node(e.v);
            const w = g.node(e.w);
            const label: Partial<NodeLabel> = {rank: (w.rank! - v.rank!) / 2 + v.rank!, e: e as unknown as number};
            util.addDummyNode(g, "edge-proxy", label, "_ep");
        }
    });
}

function assignRankMinMax(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    let maxRank = 0;
    g.nodes().forEach(v => {
        const node = g.node(v);
        if (node.borderTop) {
            node.minRank = g.node(node.borderTop).rank;
            node.maxRank = g.node(node.borderBottom!).rank;
            maxRank = Math.max(maxRank, node.maxRank!);
        }
    });
    g.graph().maxRank = maxRank;
}

function removeEdgeLabelProxies(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.nodes().forEach(v => {
        const node = g.node(v);
        if (node.dummy === "edge-proxy") {
            const proxyNode = node as unknown as EdgeProxyNodeLabel;
            g.edge(proxyNode.e).labelRank = node.rank;
            g.removeNode(v);
        }
    });
}

function translateGraph(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = 0;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = 0;
    const graphLabel = g.graph();
    const marginX = graphLabel.marginx || 0;
    const marginY = graphLabel.marginy || 0;

    function getExtremes(attrs: NodeLabel | EdgeLabel): void {
        const x = attrs.x!;
        const y = attrs.y!;
        const w = attrs.width!;
        const h = attrs.height!;
        minX = Math.min(minX, x - w / 2);
        maxX = Math.max(maxX, x + w / 2);
        minY = Math.min(minY, y - h / 2);
        maxY = Math.max(maxY, y + h / 2);
    }

    g.nodes().forEach(v => getExtremes(g.node(v)));
    g.edges().forEach(e => {
        const edge = g.edge(e);
        if (Object.hasOwn(edge, "x")) {
            getExtremes(edge);
        }
    });

    minX -= marginX;
    minY -= marginY;

    g.nodes().forEach(v => {
        const node = g.node(v);
        node.x! -= minX;
        node.y! -= minY;
    });

    g.edges().forEach(e => {
        const edge = g.edge(e);
        edge.points!.forEach(p => {
            p.x -= minX;
            p.y -= minY;
        });
        if (Object.hasOwn(edge, "x")) {
            edge.x! -= minX;
        }
        if (Object.hasOwn(edge, "y")) {
            edge.y! -= minY;
        }
    });

    graphLabel.width = maxX - minX + marginX;
    graphLabel.height = maxY - minY + marginY;
}

function assignNodeIntersects(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.edges().forEach(e => {
        const edge = g.edge(e);
        const nodeV = g.node(e.v);
        const nodeW = g.node(e.w);
        let p1: Point, p2: Point;
        if (!edge.points) {
            edge.points = [];
            p1 = nodeW as Point;
            p2 = nodeV as Point;
        } else {
            p1 = edge.points[0]!;
            p2 = edge.points[edge.points.length - 1]!;
        }
        edge.points.unshift(util.intersectRect(nodeV, p1));
        edge.points.push(util.intersectRect(nodeW, p2));
    });
}

function fixupEdgeLabelCoords(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.edges().forEach(e => {
        const edge = g.edge(e);
        if (Object.hasOwn(edge, "x")) {
            if (edge.labelpos === "l" || edge.labelpos === "r") {
                edge.width! -= edge.labeloffset!;
            }
            switch (edge.labelpos) {
            case "l":
                    edge.x! -= edge.width! / 2 + edge.labeloffset!;
                break;
            case "r":
                    edge.x! += edge.width! / 2 + edge.labeloffset!;
                break;
            }
        }
    });
}

function reversePointsForReversedEdges(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.edges().forEach(e => {
        const edge = g.edge(e);
        if (edge.reversed) {
            edge.points!.reverse();
        }
    });
}

function removeBorderNodes(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.nodes().forEach(v => {
        if (g.children(v).length) {
            const node = g.node(v);
            const t = g.node(node.borderTop!);
            const b = g.node(node.borderBottom!);
            const l = g.node(node.borderLeft![node.borderLeft!.length - 1]!);
            const r = g.node(node.borderRight![node.borderRight!.length - 1]!);

            node.width = Math.abs(r.x! - l.x!);
            node.height = Math.abs(b.y! - t.y!);
            node.x = l.x! + node.width / 2;
            node.y = t.y! + node.height / 2;
        }
    });

    g.nodes().forEach(v => {
        if (g.node(v).dummy === "border") {
            g.removeNode(v);
        }
    });
}

function removeSelfEdges(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.edges().forEach(e => {
        if (e.v === e.w) {
            const node = g.node(e.v) as ExtendedNodeLabel;
            if (!node.selfEdges) {
                node.selfEdges = [];
            }
            node.selfEdges.push({e: e, label: g.edge(e)});
            g.removeEdge(e);
        }
    });
}

function insertSelfEdges(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    const layers = util.buildLayerMatrix(g);
    layers.forEach(layer => {
        let orderShift = 0;
        layer.forEach((v, i) => {
            const node = g.node(v) as ExtendedNodeLabel;
            node.order = i + orderShift;
            (node.selfEdges || []).forEach(selfEdge => {
                util.addDummyNode(g, "selfedge", {
                    width: selfEdge.label.width!,
                    height: selfEdge.label.height!,
                    rank: node.rank,
                    order: i + (++orderShift),
                    e: selfEdge.e as unknown as number,
                    label: selfEdge.label as unknown as string
                }, "_se");
            });
            delete node.selfEdges;
        });
    });
}

function positionSelfEdges(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.nodes().forEach(v => {
        const node = g.node(v);
        if (node.dummy === "selfedge") {
            const selfEdgeNode = node as unknown as SelfEdgeNodeLabel;
            const selfNode = g.node(selfEdgeNode.e.v);
            const x = selfNode.x! + selfNode.width / 2;
            const y = selfNode.y!;
            const dx = node.x! - x;
            const dy = selfNode.height / 2;
            g.setEdge(selfEdgeNode.e, selfEdgeNode.label);
            g.removeNode(v);
            selfEdgeNode.label.points = [
                {x: x + 2 * dx / 3, y: y - dy},
                {x: x + 5 * dx / 6, y: y - dy},
                {x: x + dx, y: y},
                {x: x + 5 * dx / 6, y: y + dy},
                {x: x + 2 * dx / 3, y: y + dy}
            ];
            selfEdgeNode.label.x = node.x;
            selfEdgeNode.label.y = node.y;
        }
    });
}

function selectNumberAttrs(obj: Record<string, unknown>, attrs: string[]): unknown {
    return util.mapValues(util.pick(obj, attrs), Number);
}

function canonicalize(attrs: Record<string, unknown>): Record<string, unknown> {
    const newAttrs: Record<string, unknown> = {};
    if (attrs) {
        Object.entries(attrs).forEach(([k, v]) => {
            if (typeof k === "string") {
                k = k.toLowerCase();
            }

            newAttrs[k] = v;
        });
    }
    return newAttrs;
}
