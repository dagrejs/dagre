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
import type {Edge, EdgeLabel, GraphLabel, LayoutOptions, NodeCollection, NodeLabel, Point} from "./types";

interface SelfEdge {
    e: Edge;
    label: EdgeLabel;
}

interface ExtendedNodeLabel extends NodeLabel {
    selfEdges?: SelfEdge[];
}

/** Internal-only: cluster node label augmented with a transient subgraph reference used during layout. */
interface ClusterNodeLabel extends NodeLabel {
    _dagreClusterSubgraph?: Graph<GraphLabel, NodeLabel, EdgeLabel>;
}

interface SelfEdgeNodeLabel extends Omit<NodeLabel, 'e' | 'label'> {
    e: Edge;
}

interface EdgeProxyNodeLabel extends Omit<NodeLabel, 'e'> {
    e: Edge;
}

interface PreviousLayout {
    graph: Graph<GraphLabel, NodeLabel, EdgeLabel>;
    rawNodes: NodeCollection;
}

// Remember layout state per input graph so unrelated callers cannot affect each other.
const previousLayouts = new WeakMap<Graph<GraphLabel, NodeLabel, EdgeLabel>, PreviousLayout>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function layout<G = any, N = any, E = any>(g: Graph<G, N, E>, opts: LayoutOptions = {}): Graph<G, N, E> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recursiveClusterLayout(g as any, util.notime, opts);
    return g;
}

/** Returns the direct child of `cluster` that is an ancestor-or-equal of `node`, or undefined. */
function topLevelChildOf(g: Graph<GraphLabel, NodeLabel, EdgeLabel>, node: string, cluster: string): string | undefined {
    let current: string | undefined = node;
    while (current !== undefined) {
        const parent = g.parent(current) as string | undefined;
        if (parent === cluster) return current;
        current = parent;
    }
    return undefined;
}

// Recursively layout clusters/subgraphs with their own rankdir
function recursiveClusterLayout(g: Graph<GraphLabel, NodeLabel, EdgeLabel>, time: <T>(name: string, fn: () => T) => T, opts: LayoutOptions): void {
    // Find clusters (nodes with children)
    const clusterNodes: string[] = g.nodes().filter(v => g.children(v).length);
    // Map of cluster id to bounding box and offset
    const clusterBounds: Record<string, {minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, offsetX: number, offsetY: number}> = {};

    // First, recursively layout all clusters with their own rankdir
    clusterNodes.forEach(v => {
        const node = g.node(v);
        if (node && node.rankdir) {
            // Build a new graph for the cluster's subgraph
            const subgraph = new Graph<GraphLabel, NodeLabel, EdgeLabel>({ multigraph: true, compound: true });
            // Set the subgraph's direction on the graph label
            subgraph.setGraph({ rankdir: node.rankdir });
            // Copy nodes and edges belonging to this cluster
            const children = g.children(v);
            children.forEach(childId => {
                const childNode = { ...g.node(childId) };
                subgraph.setNode(childId, childNode);
                // Set parent if needed (for nested clusters)
                const parent = g.parent(childId);
                if (parent && parent !== v && children.includes(parent)) {
                    subgraph.setParent(childId, parent);
                }
            });
            // Copy edges between the cluster's direct children, treating edges whose endpoints
            // are inside a nested sub-cluster as proxy edges from that sub-cluster node.
            const proxiedEdges = new Set<string>();
            g.edges().forEach(e => {
                const srcChild = topLevelChildOf(g, e.v, v);
                const tgtChild = topLevelChildOf(g, e.w, v);
                if (srcChild === e.v && tgtChild === e.w) {
                    subgraph.setEdge(e, { ...g.edge(e) });
                } else if (srcChild && tgtChild && srcChild !== tgtChild) {
                    const key = `${srcChild}\x00${tgtChild}`;
                    if (!proxiedEdges.has(key)) {
                        proxiedEdges.add(key);
                        subgraph.setEdge(srcChild, tgtChild, { ...g.edge(e) });
                    }
                }
            });
            // Recursively layout the subgraph (with its own rankdir)
            recursiveClusterLayout(subgraph, time, opts);
            // Run the layout pipeline on the subgraph via a proper layout graph
            const subLayoutG = buildLayoutGraph(subgraph);
            runLayout(subLayoutG, time, opts, null);
            updateInputGraph(subgraph, subLayoutG);
            // Compute bounding box for the cluster
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            subgraph.nodes().forEach((u: string) => {
                if (u === v) return; // skip cluster node itself
                const n = subgraph.node(u);
                if (n && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.width === 'number' && typeof n.height === 'number') {
                    minX = Math.min(minX, n.x - n.width / 2);
                    maxX = Math.max(maxX, n.x + n.width / 2);
                    minY = Math.min(minY, n.y - n.height / 2);
                    maxY = Math.max(maxY, n.y + n.height / 2);
                }
            });
            // Fallback if no children
            if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
                minX = minY = 0; maxX = maxY = 0;
            }
            const width = maxX - minX;
            const height = maxY - minY;
            // Store bounding box and offset for this cluster
            clusterBounds[v] = {
                minX, minY, maxX, maxY, width, height,
                offsetX: minX, offsetY: minY
            };
            // Save the internal layout for later
            (node as ClusterNodeLabel)._dagreClusterSubgraph = subgraph;
        }
    });

    // Strict isolation: run cluster layout in a separate graph, only position as a group in parent
    const isolatedClusters: Array<{
        clusterId: string,
        subgraph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
        bounds: {minX: number, minY: number, maxX: number, maxY: number, width: number, height: number},
        children: string[],
        removedNodes: Array<{id: string, node: NodeLabel, parent: string | undefined}>,
        removedEdges: Array<{edge: Edge, label: EdgeLabel}>,
    }> = [];

    // --- Step 1: collect top-level clusters with ALL their descendants (BFS) ---
    // Nested cluster nodes (themselves children of another cluster) are handled via
    // the parent cluster's subgraph + the second pass below, not isolated here.
    const getAllDescendants = (nodeId: string): string[] => {
        const result: string[] = [];
        const queue: string[] = ((g.children(nodeId) || []) as string[]).filter(c => c !== nodeId);
        while (queue.length > 0) {
            const curr = queue.shift()!;
            result.push(curr);
            ((g.children(curr) || []) as string[]).filter(c => c !== curr).forEach(c => queue.push(c));
        }
        return result;
    };
    const rawClusterMap = new Map<string, string[]>();
    clusterNodes.forEach(v => {
        const node = g.node(v);
        if (node && node.rankdir && clusterBounds[v]) {
            rawClusterMap.set(v, ((g.children(v) || []) as string[]).filter(c => c !== v));
        }
    });
    // A cluster that is a direct child of another cluster is nested — skip it here
    const allDirectChildrenFlat = new Set<string>([...rawClusterMap.values()].flat());
    const clusterChildrenMap = new Map<string, string[]>();
    rawClusterMap.forEach((_, v) => {
        if (!allDirectChildrenFlat.has(v)) {
            // Top-level cluster: include ALL descendants so orphaned grandchildren are removed too
            clusterChildrenMap.set(v, getAllDescendants(v));
        }
    });
    const allIsolatedChildren = new Set<string>(
        [...clusterChildrenMap.values()].flat()
    );
    // Resolve a node to its top-level cluster representative (or itself if not a child)
    const topLevelNode = (id: string): string => {
        for (const [cId, ch] of clusterChildrenMap) {
            if (ch.includes(id)) return cId;
        }
        return id;
    };

    // --- Step 2: save edges incident to any isolated child BEFORE removing any node ---
    const allSavedEdges: Array<{edge: Edge, label: EdgeLabel}> = [];
    g.edges().forEach(e => {
        if (allIsolatedChildren.has(e.v) || allIsolatedChildren.has(e.w)) {
            allSavedEdges.push({edge: e, label: g.edge(e)});
        }
    });

    // --- Step 3: remove cluster children, record per-cluster metadata ---
    // Pre-save parent info before any removals; g.removeNode() may re-parent children
    const savedParents = new Map<string, string | undefined>();
    allIsolatedChildren.forEach(id => {
        const p = g.parent(id);
        savedParents.set(id, typeof p === 'string' ? p : undefined);
    });
    clusterChildrenMap.forEach((children, v) => {
        const node = g.node(v);
        const removedNodes: Array<{id: string, node: NodeLabel, parent: string | undefined}> = [];
        children.forEach(childId => {
            const childNode = g.node(childId);
            if (!childNode) return; // already removed (e.g. inner cluster's children after inner was removed)
            removedNodes.push({id: childId, node: childNode, parent: savedParents.get(childId)});
            g.removeNode(childId); // graphlib also removes incident edges here
        });
        const removedEdges = allSavedEdges.filter(({edge}) =>
            children.includes(edge.v) || children.includes(edge.w)
        );
        const bounds = clusterBounds[v]!;
        if (!node) return;
        isolatedClusters.push({
            clusterId: v,
            subgraph: (node as ClusterNodeLabel)._dagreClusterSubgraph!,
            bounds,
            children,
            removedNodes,
            removedEdges,
        });
        // Set the cluster node's width/height for parent layout
        node.width = bounds.width;
        node.height = bounds.height;
    });

    // --- Step 4: add proxy edges between cluster nodes so the parent layout respects ordering ---
    const proxyEdgeKeys = new Set<string>();
    allSavedEdges.forEach(({edge, label}) => {
        const effV = topLevelNode(edge.v);
        const effW = topLevelNode(edge.w);
        if (effV !== effW && g.hasNode(effV) && g.hasNode(effW)) {
            const key = `${effV}\x00${effW}`;
            if (!proxyEdgeKeys.has(key)) {
                proxyEdgeKeys.add(key);
                g.setEdge(effV, effW, {...label, width: 0, height: 0});
            }
        }
    });

    // --- Step 5: run the main layout for the top-level graph ---
    const layoutG = buildLayoutGraph(g);
    const result = runLayout(layoutG, time, opts, previousLayouts.get(g) ?? null);
    previousLayouts.set(g, result);
    updateInputGraph(g, layoutG);

    // --- Step 6: remove proxy edges, restore cluster internals, position children ---
    // Remove proxy edges before restoring original edges
    proxyEdgeKeys.forEach(key => {
        const sep = key.indexOf('\x00');
        const effV = key.slice(0, sep);
        const effW = key.slice(sep + 1);
        if (g.hasEdge(effV, effW)) g.removeEdge(effV, effW);
    });

    // Restore all clusters' internal nodes and edges, and position them as a group
    isolatedClusters.forEach(({clusterId, subgraph, bounds, removedNodes, removedEdges}) => {
        // Get cluster node position from parent layout
        const clusterNode = g.node(clusterId);
        const clusterX = clusterNode?.x ?? 0;
        const clusterY = clusterNode?.y ?? 0;
        // Compute the center of the subgraph's bounding box
        const subgraphCenterX = (bounds.minX + bounds.maxX) / 2;
        const subgraphCenterY = (bounds.minY + bounds.maxY) / 2;
        // Restore internal nodes
        removedNodes.forEach(({id, node, parent}) => {
            g.setNode(id, node);
            if (parent !== undefined) g.setParent(id, parent);
        });
        // Restore internal edges
        removedEdges.forEach(({edge, label}) => {
            g.setEdge(edge, label);
        });
        // Offset all child nodes (except the cluster node itself) as a group
        subgraph.nodes().forEach((u: string) => {
            if (u === clusterId) return;
            const subNode = subgraph.node(u);
            const mainNode = g.node(u);
            if (
                mainNode && subNode &&
                typeof subNode.x === 'number' && typeof subNode.y === 'number'
            ) {
                mainNode.x = clusterX + (subNode.x - subgraphCenterX);
                mainNode.y = clusterY + (subNode.y - subgraphCenterY);
            }
        });
        updateClusterEdges(g, subgraph, clusterX - subgraphCenterX, clusterY - subgraphCenterY);
        delete (clusterNode as ClusterNodeLabel)._dagreClusterSubgraph;
    });

    // After parent layout, forcibly swap x/y for cluster children if needed
    clusterNodes.forEach(v => {
        const node = g.node(v);
        const bounds = clusterBounds[v];
        if (node && node.rankdir && (node as ClusterNodeLabel)._dagreClusterSubgraph && bounds) {
            const subgraph = (node as ClusterNodeLabel)._dagreClusterSubgraph as Graph<GraphLabel, NodeLabel, EdgeLabel>;
            // Find where the parent layout placed the cluster node
            const parentX = node.x ?? 0;
            const parentY = node.y ?? 0;
            // Compute the center of the subgraph's bounding box
            const subgraphCenterX = (bounds.minX + bounds.maxX) / 2;
            const subgraphCenterY = (bounds.minY + bounds.maxY) / 2;
            // Offset all child nodes (except the cluster node itself)
            subgraph.nodes().forEach((u: string) => {
                if (u === v) return;
                const subNode = subgraph.node(u);
                const mainNode = g.node(u);
                if (
                    mainNode && subNode &&
                    typeof subNode.x === 'number' && typeof subNode.y === 'number'
                ) {
                    const dx = subNode.x - subgraphCenterX;
                    const dy = subNode.y - subgraphCenterY;
                    mainNode.x = parentX + dx;
                    mainNode.y = parentY + dy;
                }
            });
            updateClusterEdges(g, subgraph, parentX - subgraphCenterX, parentY - subgraphCenterY);
            // Optionally, clean up
            delete (node as ClusterNodeLabel)._dagreClusterSubgraph;
        }
    });
}

// Copy routes for original internal edges, excluding proxy edges between sub-clusters.
function updateClusterEdges(
    g: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    subgraph: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    offsetX: number,
    offsetY: number
): void {
    subgraph.edges().forEach(e => {
        if (!g.hasEdge(e)) return;
        const source = subgraph.edge(e);
        const target = g.edge(e);
        target.points = source.points!.map(p => ({x: p.x + offsetX, y: p.y + offsetY}));
        if (Object.hasOwn(source, "x")) {
            target.x = source.x! + offsetX;
            target.y = source.y! + offsetY;
        }
    });
}

function runLayout(
    g: Graph<GraphLabel, NodeLabel, EdgeLabel>,
    time: <T>(name: string, fn: () => T) => T,
    opts: LayoutOptions,
    previous: PreviousLayout | null = null
): PreviousLayout {
    const dynamic = opts?.useDynamic !== false;
    const oldGraph = dynamic ? previous?.graph ?? null : null;
    const rawOldNodes = dynamic ? previous?.rawNodes ?? null : null;
    time("    makeSpaceForEdgeLabels", () => makeSpaceForEdgeLabels(g));
    time("    removeSelfEdges", () => removeSelfEdges(g));
    time("    acyclic", () => acyclic.run(g, oldGraph));
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
    time("    order", () => order(g, opts, rawOldNodes));
    time("    insertSelfEdges", () => insertSelfEdges(g));
    time("    adjustCoordinateSystem", () => coordinateSystem.adjust(g));
    time("    position", () => position(g, opts.corePath));
    time("    positionSelfEdges", () => positionSelfEdges(g));
    const rawNodes: NodeCollection = JSON.parse(JSON.stringify((g as unknown as { _nodes: NodeCollection })._nodes));
    time("    removeBorderNodes", () => removeBorderNodes(g));
    time("    normalize.undo", () => normalize.undo(g));
    time("    fixupEdgeLabelCoords", () => fixupEdgeLabelCoords(g));
    time("    undoCoordinateSystem", () => coordinateSystem.undo(g));
    time("    translateGraph", () => translateGraph(g));
    time("    assignNodeIntersects", () => assignNodeIntersects(g));
    time("    reversePoints", () => reversePointsForReversedEdges(g));
    time("    acyclic.undo", () => acyclic.undo(g));

    return {graph: g, rawNodes};
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
        if ((edge.labelpos ?? "r").toLowerCase() !== "c") {
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
        if (e.v === e.w) return; // self-loops already have their full spline from positionSelfEdges
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
            // Defensive: assign default rank/order if missing
            if (typeof node.rank !== 'number') node.rank = 0;
            node.order = i + orderShift;
            (node.selfEdges || []).forEach(selfEdge => {
                util.addDummyNode(g, "selfedge", {
                    width: selfEdge.label.width!,
                    height: selfEdge.label.height!,
                    rank: node.rank,
                    order: i + (++orderShift),
                    e: selfEdge.e as unknown as number,
                    edgeLabel: selfEdge.label
                }, "_se");
                // If points array is not set, assign a default 7-point spline
                if (!Array.isArray(selfEdge.label.points) || selfEdge.label.points.length !== 7) {
                    selfEdge.label.points = [
                        {x: 0, y: -10},
                        {x: 0, y: -10},
                        {x: 0, y: 0},
                        {x: 0, y: 10},
                        {x: 0, y: 10},
                        {x: 0, y: 0},
                        {x: 0, y: 0}
                    ];
                }
            });
            delete node.selfEdges;
        });
    });
}

function positionSelfEdges(g: Graph<GraphLabel, NodeLabel, EdgeLabel>): void {
    g.nodes().forEach(v => {
        const node = g.node(v);
        const valid = (val: unknown) => typeof val === 'number' && isFinite(val);
        if (node.dummy === "selfedge") {
            const selfEdgeNode = node as unknown as SelfEdgeNodeLabel & { edgeLabel: EdgeLabel };
            const selfNode = g.node(selfEdgeNode.e.v);
            const xVal = valid(selfNode?.x) ? selfNode.x! : 0;
            const yVal = valid(selfNode?.y) ? selfNode.y! : 0;
            const widthVal = valid(selfNode?.width) ? selfNode.width! : 0;
            const heightVal = valid(selfNode?.height) ? selfNode.height! : 0;
            const nodeX = valid(node.x) ? node.x! : xVal;
            const nodeY = valid(node.y) ? node.y! : yVal;
            const dx = widthVal / 2;
            const dy = heightVal / 2;
            selfEdgeNode.edgeLabel.points = [
                {x: nodeX + dx, y: nodeY - dy},
                {x: nodeX + dx, y: nodeY - dy},
                {x: nodeX,      y: nodeY},
                {x: nodeX - dx, y: nodeY + dy},
                {x: nodeX - dx, y: nodeY + dy},
                {x: nodeX,      y: nodeY},
                {x: nodeX,      y: nodeY}
            ];
            selfEdgeNode.edgeLabel.x = nodeX;
            selfEdgeNode.edgeLabel.y = nodeY;
            g.setEdge(selfEdgeNode.e, selfEdgeNode.edgeLabel);
            g.removeNode(v);
        } else if (node && Array.isArray((node as ExtendedNodeLabel).selfEdges)) {
            // If node has selfEdges but no dummy node was created, ensure points is a 7-point spline centered on node
            ((node as ExtendedNodeLabel).selfEdges as Array<{label: EdgeLabel}>).forEach((selfEdge: {label: EdgeLabel}) => {
                if (!Array.isArray(selfEdge.label.points) || selfEdge.label.points.length !== 7) {
                    const xVal = valid(node.x) ? node.x! : 0;
                    const yVal = valid(node.y) ? node.y! : 0;
                    const widthVal = valid(node.width) ? node.width! : 0;
                    const heightVal = valid(node.height) ? node.height! : 0;
                    const dx = widthVal / 2;
                    const dy = heightVal / 2;
                    selfEdge.label.points = [
                        {x: xVal + dx, y: yVal - dy},
                        {x: xVal + dx, y: yVal - dy},
                        {x: xVal,      y: yVal},
                        {x: xVal - dx, y: yVal + dy},
                        {x: xVal - dx, y: yVal + dy},
                        {x: xVal,      y: yVal},
                        {x: xVal,      y: yVal}
                    ];
                }
            });
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
