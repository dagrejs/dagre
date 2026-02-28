import {Graph} from "../graph-lib";
import * as util from "../util";
import type {EdgeLabel, GraphLabel, NodeLabel} from "../types";

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

export {
    positionX,
    findType1Conflicts,
    findType2Conflicts,
    addConflict,
    hasConflict,
    verticalAlignment,
    horizontalCompaction,
    alignCoordinates,
    findSmallestWidthAlignment,
    balance
};

type Conflicts = { [key: string]: { [key: string]: boolean } };
type PositionMap = { [key: string]: number };
type AlignmentResult = { root: { [key: string]: string }, align: { [key: string]: string } };
type XssMap = { [key: string]: PositionMap };

/*
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 */
function findType1Conflicts(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][]): Conflicts {
    const conflicts: Conflicts = {};

    function visitLayer(prevLayer: string[], layer: string[]): string[] {
        let
            // last visited node in the previous layer that is incident on an inner
            // segment.
            k0 = 0,
            // Tracks the last node in this layer scanned for crossings with a type-1
            // segment.
            scanPos = 0;
        const prevLayerLength = prevLayer.length,
            lastNode = layer[layer.length - 1];

        layer.forEach((v, i) => {
            const w: string | undefined = findOtherInnerSegmentNode(graph, v);
            const k1: number = w ? graph.node(w).order! : prevLayerLength;

            if (w || v === lastNode) {
                layer.slice(scanPos, i + 1).forEach(scanNode => {
                    const preds = graph.predecessors(scanNode);
                    if (preds) {
                        preds.forEach(u => {
                            const uLabel = graph.node(u) as NodeLabel;
                            const uPos: number = uLabel.order!;
                            if ((uPos < k0 || k1 < uPos) &&
                                !(uLabel.dummy && (graph.node(scanNode) as NodeLabel).dummy)) {
                                addConflict(conflicts, u, scanNode);
                            }
                        });
                    }
                });
                scanPos = i + 1;
                k0 = k1;
            }
        });

        return layer;
    }

    if (layering.length) {
        layering.reduce(visitLayer);
    }

    return conflicts;
}

function findType2Conflicts(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, layering: string[][]): Conflicts {
    const conflicts: Conflicts = {};

    function scan(south: string[], southPos: number, southEnd: number, prevNorthBorder: number, nextNorthBorder: number): void {
        util.range(southPos, southEnd).forEach(i => {
            const v = south[i];
            if (v === undefined) return;
            if ((graph.node(v) as NodeLabel).dummy) {
                const preds = graph.predecessors(v);
                if (preds) {
                    preds.forEach(u => {
                        if (u === undefined) return;
                        const uNode = graph.node(u) as NodeLabel;
                        if (uNode.dummy &&
                            (uNode.order! < prevNorthBorder || uNode.order! > nextNorthBorder)) {
                            addConflict(conflicts, u, v);
                        }
                    });
                }
            }
        });
    }


    function visitLayer(north: string[], south: string[]): string[] {
        let prevNorthPos = -1;
        let nextNorthPos = -1;
        let southPos = 0;

        south.forEach((v, southLookahead) => {
            if ((graph.node(v) as NodeLabel).dummy === "border") {
                const predecessors = graph.predecessors(v);
                if (predecessors && predecessors.length) {
                    const firstPred = predecessors[0];
                    if (firstPred === undefined) return;
                    nextNorthPos = (graph.node(firstPred) as NodeLabel).order!;
                    scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
                    southPos = southLookahead;
                    prevNorthPos = nextNorthPos;
                }
            }
            scan(south, southPos, south.length, nextNorthPos, north.length);
        });

        return south;
    }

    if (layering.length) {
        layering.reduce(visitLayer);
    }

    return conflicts;
}

function findOtherInnerSegmentNode(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, v: string): string | undefined {
    if ((graph.node(v) as NodeLabel).dummy) {
        const preds = graph.predecessors(v);
        if (preds) {
            return preds.find(u => (graph.node(u) as NodeLabel).dummy);
        }
    }
    return undefined;
}

function addConflict(conflicts: Conflicts, v: string, w: string): void {
    if (v > w) {
        const tmp = v;
        v = w;
        w = tmp;
    }

    let conflictsV = conflicts[v];
    if (!conflictsV) {
        conflicts[v] = conflictsV = {};
    }
    conflictsV[w] = true;
}

function hasConflict(conflicts: Conflicts, v: string, w: string): boolean {
    if (v > w) {
        const tmp = v;
        v = w;
        w = tmp;
    }
    const conflictsV = conflicts[v];
    return conflictsV !== undefined && Object.hasOwn(conflictsV, w);
}

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
function verticalAlignment(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    layering: string[][],
    conflicts: Conflicts,
    neighborFn: (v: string) => string[]
): AlignmentResult {
    const root: { [key: string]: string } = {};
    const align: { [key: string]: string } = {};
    const pos: PositionMap = {};

    // We cache the position here based on the layering because the graph and
    // layering may be out of sync. The layering matrix is manipulated to
    // generate different extreme alignments.
    layering.forEach(layer => {
        layer.forEach((v, order) => {
            root[v] = v;
            align[v] = v;
            pos[v] = order;
        });
    });

    layering.forEach(layer => {
        let prevIdx = -1;
        layer.forEach(v => {
            const wsRaw = neighborFn(v);
            if (wsRaw && wsRaw.length) {
                const ws: string[] = wsRaw.sort((a, b) => {
                    const posA = pos[a];
                    const posB = pos[b];
                    return (posA !== undefined ? posA : 0) - (posB !== undefined ? posB : 0);
                });
                const mp: number = (ws.length - 1) / 2;
                for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
                    const w: string | undefined = ws[i];
                    if (w === undefined) continue;
                    const posW = pos[w];
                    if (posW !== undefined && align[v] === v &&
                        prevIdx < posW &&
                        !hasConflict(conflicts, v, w)) {
                        const rootW = root[w];
                        if (rootW !== undefined) {
                            align[w] = v;
                            align[v] = root[v] = rootW;
                            prevIdx = posW;
                        }
                    }
                }
            }
        });
    });

    return {root: root, align: align};
}

function horizontalCompaction(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    layering: string[][],
    root: { [key: string]: string },
    align: { [key: string]: string },
    reverseSep: boolean = false
): PositionMap {
    // This portion of the algorithm differs from BK due to a number of problems.
    // Instead of their algorithm we construct a new block graph and do two
    // sweeps. The first sweep places blocks with the smallest possible
    // coordinates. The second sweep removes unused space by moving blocks to the
    // greatest coordinates without violating separation.
    const xs: PositionMap = {};
    const blockG: Graph<NodeLabel, EdgeLabel, number> = buildBlockGraph(graph, layering, root, reverseSep);
    const borderType: string = reverseSep ? "borderLeft" : "borderRight";

    function iterate(setXsFunc: (elem: string) => void, nextNodesFunc: (elem: string) => string[]): void {
        const stack: string[] = blockG.nodes().slice(); // Create a copy of the node list.
        const visited: { [key: string]: boolean } = {};
        let elem: string | undefined = stack.pop();

        while (elem) {
            if (visited[elem]) {
                setXsFunc(elem);
            } else {
                visited[elem] = true;
                // Put the element back into the stack, so that we can process it
                // again after all of the `nextNodesFunc` items are processed.
                stack.push(elem);
                for (const nextElem of nextNodesFunc(elem)) {
                    stack.push(nextElem);
                }
            }

            elem = stack.pop();
        }
    }

    // First pass, assign smallest coordinates
    function pass1(elem: string): void {
        const inEdges = blockG.inEdges(elem);
        if (inEdges) {
            xs[elem] = inEdges.reduce((acc, e) => {
                const xsV = xs[e.v] ?? 0;
                const edgeWeight = blockG.edge(e);
                return Math.max(acc, xsV + (edgeWeight !== undefined ? edgeWeight : 0));
            }, 0);
        } else {
            xs[elem] = 0;
        }
    }

    // Second pass, assign greatest coordinates
    function pass2(elem: string): void {
        const outEdges = blockG.outEdges(elem);
        let min = Number.POSITIVE_INFINITY;
        if (outEdges) {
            min = outEdges.reduce((acc, e) => {
                const xsW = xs[e.w];
                const edgeWeight = blockG.edge(e);
                return Math.min(acc, (xsW !== undefined ? xsW : 0) - (edgeWeight !== undefined ? edgeWeight : 0));
            }, Number.POSITIVE_INFINITY);
        }

        const node = graph.node(elem) as NodeLabel;
        if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
            xs[elem] = Math.max(xs[elem] !== undefined ? xs[elem] : 0, min);
        }
    }

    function predecessorsWrapper(elem: string): string[] {
        return blockG.predecessors(elem) || [];
    }

    function successorsWrapper(elem: string): string[] {
        return blockG.successors(elem) || [];
    }

    iterate(pass1, predecessorsWrapper);
    iterate(pass2, successorsWrapper);

    // Assign x coordinates to all nodes
    Object.keys(align).forEach(v => {
        const rootV = root[v];
        if (rootV !== undefined) {
            xs[v] = xs[rootV] ?? 0;
        }
    });

    return xs;
}


function buildBlockGraph(
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    layering: string[][],
    root: { [key: string]: string },
    reverseSep: boolean
): Graph<NodeLabel, EdgeLabel, number> {
    const blockGraph = new Graph<NodeLabel, EdgeLabel, number>();
    const graphLabel: GraphLabel = graph.graph();
    const sepFn: (g: Graph<GraphLabel, NodeLabel, EdgeLabel>, v: string, u: string) => number = sep(graphLabel.nodesep!, graphLabel.edgesep!, reverseSep);

    layering.forEach(layer => {
        let u: string | undefined;
        layer.forEach(v => {
            const vRoot = root[v];
            if (vRoot !== undefined) {
                blockGraph.setNode(vRoot);
                if (u !== undefined) {
                    const uRoot = root[u];
                    if (uRoot !== undefined) {
                        const prevMax: number | undefined = blockGraph.edge(uRoot, vRoot);
                        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(graph, v, u), prevMax || 0));
                    }
                }
                u = v;
            }
        });
    });

    return blockGraph;
}

/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
function findSmallestWidthAlignment(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, xss: XssMap): PositionMap {
    return Object.values(xss).reduce((currentMinAndXs: [number, PositionMap | null], xs: PositionMap) => {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;

        Object.entries(xs).forEach(([v, x]) => {
            const halfWidth: number = width(graph, v) / 2;

            max = Math.max(x + halfWidth, max);
            min = Math.min(x - halfWidth, min);
        });

        const newMin: number = max - min;
        if (newMin < currentMinAndXs[0]) {
            currentMinAndXs = [newMin, xs];
        }
        return currentMinAndXs;
    }, [Number.POSITIVE_INFINITY, null])[1]!;
}

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
function alignCoordinates(xss: XssMap, alignTo: PositionMap): void {
    const alignToVals: number[] = Object.values(alignTo);
    const alignToMin: number = util.applyWithChunking(Math.min, alignToVals);
    const alignToMax: number = util.applyWithChunking(Math.max, alignToVals);

    ["u", "d"].forEach(vert => {
        ["l", "r"].forEach(horiz => {
            const alignment: string = vert + horiz;
            const xs: PositionMap | undefined = xss[alignment];

            if (!xs || xs === alignTo) return;

            const xsVals: number[] = Object.values(xs);
            let delta: number = alignToMin - util.applyWithChunking(Math.min, xsVals);
            if (horiz !== "l") {
                delta = alignToMax - util.applyWithChunking(Math.max, xsVals);
            }

            if (delta) {
                xss[alignment] = util.mapValues(xs, x => x + delta);
            }
        });
    });
}

function balance(xss: XssMap, align: string | undefined = undefined): PositionMap {
    const ulMap = xss.ul;
    if (!ulMap) {
        return {};
    }
    return util.mapValues(ulMap, (num: number, v: string) => {
        if (align) {
            const alignmentKey = align.toLowerCase();
            const alignment = xss[alignmentKey];
            if (alignment && alignment[v] !== undefined) {
                return alignment[v];
            }
        }
        const xs: number[] = Object.values(xss).map(xs => {
            const val = xs[v];
            return val !== undefined ? val : 0;
        }).sort((a, b) => a - b);
        return ((xs[1] ?? 0) + (xs[2] ?? 0)) / 2;
    });
}

function positionX(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>): PositionMap {
    const layering: string[][] = util.buildLayerMatrix(graph);
    const conflicts: Conflicts = Object.assign(
        findType1Conflicts(graph, layering),
        findType2Conflicts(graph, layering));

    const xss: XssMap = {};
    let adjustedLayering: string[][];
    ["u", "d"].forEach(vert => {
        adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
        ["l", "r"].forEach(horiz => {
            if (horiz === "r") {
                adjustedLayering = adjustedLayering.map(inner => {
                    return Object.values(inner).reverse();
                });
            }

            const neighborFn = (v: string): string[] => {
                const result = vert === "u" ? graph.predecessors(v) : graph.successors(v);
                return result || [];
            };
            const align: AlignmentResult = verticalAlignment(graph, adjustedLayering, conflicts, neighborFn);
            let xs: PositionMap = horizontalCompaction(graph, adjustedLayering,
                align.root, align.align, horiz === "r");
            if (horiz === "r") {
                xs = util.mapValues(xs, x => -x);
            }
            xss[vert + horiz] = xs;
        });
    });


    const smallestWidth: PositionMap = findSmallestWidthAlignment(graph, xss);
    alignCoordinates(xss, smallestWidth);
    return balance(xss, graph.graph().align);
}

function sep(nodeSep: number, edgeSep: number, reverseSep: boolean): (g: Graph<GraphLabel, NodeLabel, EdgeLabel>, v: string, w: string) => number {
    return (g: Graph<GraphLabel, NodeLabel, EdgeLabel>, v: string, w: string): number => {
        const vLabel = g.node(v) as NodeLabel;
        const wLabel = g.node(w) as NodeLabel;
        let sum = 0;
        let delta: number | undefined;

        sum += vLabel.width / 2;
        if (Object.hasOwn(vLabel, "labelpos")) {
            switch ((vLabel.labelpos as string).toLowerCase()) {
            case "l":
                delta = -vLabel.width / 2;
                break;
            case "r":
                delta = vLabel.width / 2;
                break;
            }
        }
        if (delta) {
            sum += reverseSep ? delta : -delta;
        }
        delta = undefined;

        sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
        sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

        sum += wLabel.width / 2;
        if (Object.hasOwn(wLabel, "labelpos")) {
            switch ((wLabel.labelpos as string).toLowerCase()) {
            case "l":
                delta = wLabel.width / 2;
                break;
            case "r":
                delta = -wLabel.width / 2;
                break;
            }
        }
        if (delta) {
            sum += reverseSep ? delta : -delta;
        }

        return sum;
    };
}

function width(graph: Graph<GraphLabel, NodeLabel, EdgeLabel>, v: string): number {
    return (graph.node(v) as NodeLabel).width;
}
