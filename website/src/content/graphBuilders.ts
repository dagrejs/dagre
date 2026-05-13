import * as dagre from '@dagrejs/dagre';
import type {EdgeLabel, GraphLabel, NodeLabel} from '@dagrejs/dagre';
import type {Graph} from '@dagrejs/graphlib';
import type {DemoSettings, LabelPosition, RankDirection} from './types';

type DagreGraph = Graph<GraphLabel, NodeLabel, EdgeLabel>;

type NodeInput = {
    id: string;
    label: string;
    width: number;
    height: number;
    className?: string;
};

type EdgeInput = {
    v: string;
    w: string;
    label?: string;
    minlen?: number;
    weight?: number;
    labelpos?: LabelPosition;
    labeloffset?: number;
    className?: string;
    width?: number;
    height?: number;
};

function createGraph(settings: DemoSettings): DagreGraph {
    const graph = new dagre.graphlib.Graph<GraphLabel, NodeLabel, EdgeLabel>({
        multigraph: true,
        compound: true,
    });

    const graphLabel: GraphLabel = {
        rankdir: settings.rankdir ?? 'TB',
        align: settings.align,
        nodesep: settings.nodesep ?? 50,
        ranksep: settings.ranksep ?? 70,
        edgesep: settings.edgesep ?? 20,
        marginx: settings.marginx ?? 24,
        marginy: settings.marginy ?? 24,
        ranker: settings.ranker,
        acyclicer: settings.acyclicer === 'greedy' ? 'greedy' : undefined,
    };

    graph.setGraph(graphLabel);
    graph.setDefaultEdgeLabel(() => ({}));

    return graph;
}

function addNodes(graph: DagreGraph, nodes: NodeInput[]): void {
    nodes.forEach((node) => {
        graph.setNode(node.id, {
            label: node.label,
            width: node.width,
            height: node.height,
            class: node.className,
        });
    });
}

function addEdges(graph: DagreGraph, edges: EdgeInput[]): void {
    edges.forEach((edge) => {
        graph.setEdge(edge.v, edge.w, {
            label: edge.label,
            width: edge.width ?? (edge.label ? Math.max(48, edge.label.length * 7) : 0),
            height: edge.height ?? (edge.label ? 20 : 0),
            minlen: edge.minlen,
            weight: edge.weight,
            labelpos: edge.labelpos,
            labeloffset: edge.labeloffset,
            class: edge.className,
        });
    });
}

export function buildGettingStartedGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph(settings);

    addNodes(graph, [
        {id: 'configure', label: 'Configure', width: 116, height: 44, className: 'accent'},
        {id: 'build', label: 'Build graph', width: 118, height: 44},
        {id: 'layout', label: 'Run layout', width: 112, height: 44},
        {id: 'render', label: 'Render SVG', width: 112, height: 44, className: 'success'},
    ]);
    addEdges(graph, [
        {v: 'configure', w: 'build'},
        {v: 'build', w: 'layout'},
        {v: 'layout', w: 'render'},
    ]);

    return graph;
}

export function buildWorkflowGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph(settings);

    addNodes(graph, [
        {id: 'request', label: 'Request', width: 100, height: 44, className: 'accent'},
        {id: 'auth', label: 'Authorize', width: 104, height: 44},
        {id: 'validate', label: 'Validate data', width: 122, height: 44},
        {id: 'quote', label: 'Quote', width: 88, height: 44},
        {id: 'approval', label: 'Approval', width: 104, height: 44},
        {id: 'fulfill', label: 'Fulfill', width: 96, height: 44},
        {id: 'notify', label: 'Notify', width: 92, height: 44, className: 'success'},
        {id: 'reject', label: 'Reject', width: 92, height: 44, className: 'warning'},
    ]);
    addEdges(graph, [
        {v: 'request', w: 'auth'},
        {v: 'auth', w: 'validate'},
        {v: 'validate', w: 'quote'},
        {v: 'quote', w: 'approval'},
        {v: 'approval', w: 'fulfill', label: 'approved'},
        {v: 'fulfill', w: 'notify'},
        {v: 'approval', w: 'reject', label: 'denied'},
    ]);

    return graph;
}

export function buildSpacingGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph(settings);

    addNodes(graph, [
        {id: 'a', label: 'A', width: 64, height: 42},
        {id: 'b', label: 'B', width: 64, height: 42},
        {id: 'c', label: 'C', width: 64, height: 42},
        {id: 'd', label: 'D', width: 64, height: 42},
        {id: 'e', label: 'E', width: 64, height: 42},
        {id: 'f', label: 'F', width: 64, height: 42},
    ]);
    addEdges(graph, [
        {v: 'a', w: 'b'},
        {v: 'a', w: 'c'},
        {v: 'b', w: 'd'},
        {v: 'c', w: 'd'},
        {v: 'c', w: 'e'},
        {v: 'd', w: 'f'},
        {v: 'e', w: 'f'},
    ]);

    return graph;
}

export function buildNodeSizesGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph(settings);
    const wide = settings.nodeSize === 'wide';
    const mixed = settings.nodeSize !== 'compact';

    addNodes(graph, [
        {id: 'source', label: 'Source', width: 88, height: 42, className: 'accent'},
        {id: 'parser', label: mixed ? 'Parse and normalize' : 'Parse', width: mixed ? 164 : 86, height: 44},
        {id: 'rules', label: wide ? 'Apply business validation rules' : 'Rules', width: wide ? 238 : 92, height: 52},
        {id: 'store', label: 'Store', width: 86, height: mixed ? 62 : 42},
        {id: 'report', label: mixed ? 'Generate report' : 'Report', width: mixed ? 148 : 92, height: 44, className: 'success'},
    ]);
    addEdges(graph, [
        {v: 'source', w: 'parser'},
        {v: 'parser', w: 'rules'},
        {v: 'rules', w: 'store'},
        {v: 'rules', w: 'report'},
        {v: 'store', w: 'report'},
    ]);

    return graph;
}

export function buildEdgeLabelsGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph(settings);

    addNodes(graph, [
        {id: 'draft', label: 'Draft', width: 86, height: 42},
        {id: 'review', label: 'Review', width: 94, height: 42, className: 'accent'},
        {id: 'changes', label: 'Changes', width: 104, height: 42, className: 'warning'},
        {id: 'publish', label: 'Publish', width: 102, height: 42, className: 'success'},
    ]);
    addEdges(graph, [
        {v: 'draft', w: 'review', label: 'submit'},
        {v: 'review', w: 'changes', label: 'needs work'},
        {v: 'changes', w: 'review', label: 'resubmit', minlen: 2},
        {v: 'review', w: 'publish', label: 'approved'},
    ]);

    return graph;
}

export function buildEdgeAttributesGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph({
        ...settings,
        nodesep: Math.max(settings.nodesep ?? 54, settings.labelWidth ?? 72),
    });
    const labelWidth = settings.labelWidth ?? 72;
    const weight = settings.weight ?? 1;
    const competingWeight = Math.max(1, 26 - weight);

    addNodes(graph, [
        {id: 'source', label: 'Source', width: 90, height: 42},
        {id: 'main', label: 'High weight path', width: 138, height: 44, className: 'accent'},
        {id: 'alternate', label: 'Alternate path', width: 128, height: 44, className: 'warning'},
        {id: 'sink', label: 'Sink', width: 82, height: 42, className: 'success'},
        {id: 'audit', label: 'Audit', width: 84, height: 42},
    ]);
    addEdges(graph, [
        {
            v: 'source',
            w: 'main',
            label: 'controlled',
            minlen: settings.minlen,
            weight,
            labelpos: settings.labelpos,
            labeloffset: settings.labeloffset,
            className: 'focus',
            width: labelWidth,
            height: 24,
        },
        {
            v: 'main',
            w: 'sink',
            label: 'finish',
            minlen: settings.minlen,
            weight,
            labelpos: settings.labelpos,
            labeloffset: settings.labeloffset,
            className: 'focus',
            width: labelWidth,
            height: 24,
        },
        {v: 'source', w: 'alternate', label: 'other', weight: competingWeight},
        {v: 'alternate', w: 'sink', label: 'merge', weight: competingWeight},
        {v: 'main', w: 'audit', label: 'side check', minlen: 2, weight: 1},
        {v: 'audit', w: 'sink', label: 'report', weight: 1},
    ]);

    return graph;
}

export function buildAttributeGraph(settings: DemoSettings): DagreGraph {
    const graph = createGraph({
        rankdir: settings.rankdir ?? 'LR',
        align: settings.align,
        nodesep: settings.nodesep ?? 48,
        ranksep: settings.ranksep ?? 76,
        edgesep: settings.edgesep ?? 18,
        marginx: settings.marginx ?? 24,
        marginy: settings.marginy ?? 24,
        ranker: settings.ranker ?? 'network-simplex',
        acyclicer: settings.acyclicer,
    });

    addNodes(graph, [
        {id: 'start', label: 'Start', width: 82, height: 42, className: 'accent'},
        {id: 'split', label: 'Split', width: 82, height: 42},
        {id: 'fast', label: 'Fast path', width: 104, height: 42},
        {id: 'review', label: 'Review', width: 100, height: 42, className: 'warning'},
        {id: 'join', label: 'Join', width: 78, height: 42},
        {id: 'finish', label: 'Finish', width: 88, height: 42, className: 'success'},
    ]);
    addEdges(graph, [
        {v: 'start', w: 'split'},
        {v: 'split', w: 'fast', weight: 2},
        {v: 'split', w: 'review'},
        {v: 'review', w: 'split'},
        {v: 'fast', w: 'join'},
        {v: 'review', w: 'join', minlen: 2},
        {v: 'join', w: 'finish'},
    ]);

    return graph;
}

export function graphOptionsSnippet(settings: DemoSettings): string {
    const rankdir = settings.rankdir ?? 'TB';
    const nodesep = settings.nodesep ?? 50;
    const ranksep = settings.ranksep ?? 70;
    const edgesep = settings.edgesep ?? 20;
    const extraOptions = [
        settings.align ? `  align: "${settings.align}",` : undefined,
        settings.marginx !== undefined ? `  marginx: ${settings.marginx},` : undefined,
        settings.marginy !== undefined ? `  marginy: ${settings.marginy},` : undefined,
        settings.ranker ? `  ranker: "${settings.ranker}",` : undefined,
        settings.acyclicer === 'greedy' ? '  acyclicer: "greedy",' : undefined,
    ].filter(Boolean);

    return `g.setGraph({
  rankdir: "${rankdir}",
  nodesep: ${nodesep},
  ranksep: ${ranksep},
  edgesep: ${edgesep},${extraOptions.length ? `\n${extraOptions.join('\n')}` : ''}
});`;
}

export function rankdirOptions(): Array<{label: string; value: RankDirection}> {
    return [
        {label: 'TB', value: 'TB'},
        {label: 'BT', value: 'BT'},
        {label: 'LR', value: 'LR'},
        {label: 'RL', value: 'RL'},
    ];
}
