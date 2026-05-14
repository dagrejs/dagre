import {
    buildAttributeGraph,
    buildEdgeAttributesGraph,
    buildEdgeLabelsGraph,
    buildGettingStartedGraph,
    buildNodeSizesGraph,
    buildSpacingGraph,
    buildWorkflowGraph,
    graphOptionsSnippet,
    rankdirOptions,
} from './graphBuilders';
import type {AttributeDefinition, DemoSettings, PageDefinition} from './types';

const directionControls = [
    {
        type: 'segmented' as const,
        label: 'rankdir',
        key: 'rankdir' as const,
        options: rankdirOptions(),
    },
];

const alignOptions = [
    {label: 'UL', value: 'UL'},
    {label: 'UR', value: 'UR'},
    {label: 'DL', value: 'DL'},
    {label: 'DR', value: 'DR'},
];

const rankerOptions = [
    {label: 'Network', value: 'network-simplex'},
    {label: 'Tight', value: 'tight-tree'},
    {label: 'Longest', value: 'longest-path'},
];

const acyclicerOptions = [
    {label: 'Off', value: 'none'},
    {label: 'Greedy', value: 'greedy'},
];

const labelPositionOptions = [
    {label: 'Left', value: 'l'},
    {label: 'Center', value: 'c'},
    {label: 'Right', value: 'r'},
];

const graphAttributes: AttributeDefinition[] = [
    {
        target: 'graph',
        name: 'rankdir',
        defaultValue: 'TB',
        description: 'Direction for rank nodes. Can be TB, BT, LR, or RL, where T = top, B = bottom, L = left, and R = right.',
    },
    {
        target: 'graph',
        name: 'align',
        defaultValue: 'undefined',
        description: 'Alignment for rank nodes. Can be UL, UR, DL, or DR, where U = up, D = down, L = left, and R = right.',
    },
    {
        target: 'graph',
        name: 'nodesep',
        defaultValue: '50',
        description: 'Number of pixels that separate nodes horizontally in the layout.',
    },
    {
        target: 'graph',
        name: 'edgesep',
        defaultValue: '20',
        description: 'Number of pixels that separate edges horizontally in the layout.',
    },
    {
        target: 'graph',
        name: 'ranksep',
        defaultValue: '50',
        description: 'Number of pixels between each rank in the layout.',
    },
    {
        target: 'graph',
        name: 'marginx',
        defaultValue: '0',
        description: 'Number of pixels to use as a margin around the left and right of the graph.',
    },
    {
        target: 'graph',
        name: 'marginy',
        defaultValue: '0',
        description: 'Number of pixels to use as a margin around the top and bottom of the graph.',
    },
    {
        target: 'graph',
        name: 'acyclicer',
        defaultValue: 'undefined',
        description: 'If set to greedy, uses a greedy heuristic for finding a feedback arc set for a graph.',
    },
    {
        target: 'graph',
        name: 'ranker',
        defaultValue: 'network-simplex',
        description: 'Type of algorithm to assign a rank to each node. Can be network-simplex, tight-tree, or longest-path.',
    },
];

const nodeAttributes: AttributeDefinition[] = [
    {
        target: 'node',
        name: 'width',
        defaultValue: '0',
        description: 'The width of the node in pixels.',
    },
    {
        target: 'node',
        name: 'height',
        defaultValue: '0',
        description: 'The height of the node in pixels.',
    },
];

const edgeAttributes: AttributeDefinition[] = [
    {
        target: 'edge',
        name: 'minlen',
        defaultValue: '1',
        description: 'The number of ranks to keep between the source and target of the edge.',
    },
    {
        target: 'edge',
        name: 'weight',
        defaultValue: '1',
        description: 'The weight to assign the edge. Higher weight edges are generally made shorter and straighter than lower weight edges.',
    },
    {
        target: 'edge',
        name: 'width',
        defaultValue: '0',
        description: 'The width of the edge label in pixels.',
    },
    {
        target: 'edge',
        name: 'height',
        defaultValue: '0',
        description: 'The height of the edge label in pixels.',
    },
    {
        target: 'edge',
        name: 'labelpos',
        defaultValue: 'r',
        description: 'Where to place the label relative to the edge. Can be l = left, c = center, or r = right.',
    },
    {
        target: 'edge',
        name: 'labeloffset',
        defaultValue: '10',
        description: 'How many pixels to move the label away from the edge. Applies only when labelpos is l or r.',
    },
];

function gettingStartedCode(settings: DemoSettings): string {
    return `import dagre from "@dagrejs/dagre";

const g = new dagre.graphlib.Graph();

${graphOptionsSnippet(settings)}
g.setDefaultEdgeLabel(() => ({}));

g.setNode("configure", {label: "Configure", width: 116, height: 44});
g.setNode("build", {label: "Build graph", width: 118, height: 44});
g.setNode("layout", {label: "Run layout", width: 112, height: 44});
g.setNode("render", {label: "Render SVG", width: 112, height: 44});

g.setEdge("configure", "build");
g.setEdge("build", "layout");
g.setEdge("layout", "render");

dagre.layout(g);

// D3 renders g.nodes(), g.edges(), and each edge's points.`;
}

export const pages: PageDefinition[] = [
    {
        id: 'getting-started',
        navTitle: 'Getting Started',
        eyebrow: 'Interactive docs',
        title: 'Graph layout for JavaScript',
        description: 'Build a directed graph, give Dagre node dimensions, run layout, and render the calculated positions with D3.',
        sections: [
            {
                id: 'first-layout',
                title: 'Your first layout',
                body: [
                    'Dagre computes positions for nodes and routing points for edges. The renderer can be SVG, Canvas, WebGL, or anything else that understands coordinates.',
                    'This demo uses D3 for the SVG layer, the same general approach as the existing standalone demo.',
                ],
                demo: {
                    id: 'getting-started-demo',
                    title: 'Basic directed graph',
                    caption: 'The graph is laid out by Dagre, then drawn with D3 paths, labels, and nodes.',
                    initialSettings: {rankdir: 'TB', nodesep: 50, ranksep: 70, edgesep: 20},
                    controls: directionControls,
                    buildGraph: buildGettingStartedGraph,
                    code: gettingStartedCode,
                },
            },
            {
                id: 'workflow',
                title: 'A practical workflow',
                body: [
                    'Dagre is most useful when the graph is created from application data. This example has a branching approval flow and labeled edges.',
                    'Changing direction keeps the graph semantics intact while Dagre recalculates the layout.',
                ],
                demo: {
                    id: 'workflow-demo',
                    title: 'Approval workflow',
                    caption: 'A more realistic graph with branches, labels, and a longer path.',
                    initialSettings: {rankdir: 'LR', nodesep: 44, ranksep: 80, edgesep: 18},
                    controls: directionControls,
                    buildGraph: buildWorkflowGraph,
                    code: (settings) => `const g = new dagre.graphlib.Graph();

${graphOptionsSnippet(settings)}
g.setDefaultEdgeLabel(() => ({}));

g.setNode("request", {label: "Request", width: 100, height: 44});
g.setNode("approval", {label: "Approval", width: 104, height: 44});
g.setNode("fulfill", {label: "Fulfill", width: 96, height: 44});
g.setNode("reject", {label: "Reject", width: 92, height: 44});

g.setEdge("approval", "fulfill", {label: "approved", width: 58, height: 20});
g.setEdge("approval", "reject", {label: "denied", width: 48, height: 20});

dagre.layout(g);`,
                },
            },
        ],
    },
    {
        id: 'attributes',
        navTitle: 'Attributes',
        eyebrow: 'Reference',
        title: 'Layout attributes',
        description: 'Set graph, node, and edge attributes before calling layout to control direction, spacing, ranking, sizing, and edge labels.',
        sections: [
            {
                id: 'graph-attributes',
                title: 'Graph attributes',
                body: [
                    'Graph attributes are set with g.setGraph(...). They configure the overall layout algorithm and graph canvas.',
                ],
                demo: {
                    id: 'graph-attributes-demo',
                    title: 'Graph attribute controls',
                    caption: 'Adjust direction, rank alignment, spacing, margins, cycle handling, and ranking strategy.',
                    initialSettings: {
                        rankdir: 'LR',
                        align: 'UL',
                        nodesep: 48,
                        ranksep: 76,
                        edgesep: 18,
                        marginx: 24,
                        marginy: 24,
                        ranker: 'network-simplex',
                        acyclicer: 'greedy',
                    },
                    controls: [
                        ...directionControls,
                        {type: 'segmented', label: 'align', key: 'align', options: alignOptions},
                        {type: 'segmented', label: 'ranker', key: 'ranker', options: rankerOptions},
                        {type: 'segmented', label: 'acyclicer', key: 'acyclicer', options: acyclicerOptions},
                        {type: 'range', label: 'nodesep', key: 'nodesep', min: 20, max: 120, step: 5},
                        {type: 'range', label: 'ranksep', key: 'ranksep', min: 30, max: 160, step: 5},
                        {type: 'range', label: 'edgesep', key: 'edgesep', min: 5, max: 80, step: 5},
                        {type: 'range', label: 'marginx', key: 'marginx', min: 0, max: 80, step: 4},
                        {type: 'range', label: 'marginy', key: 'marginy', min: 0, max: 80, step: 4},
                    ],
                    buildGraph: buildAttributeGraph,
                    code: (settings) => `const g = new dagre.graphlib.Graph();

${graphOptionsSnippet(settings)}

// Add nodes and edges, then run layout.
dagre.layout(g);`,
                },
                attributes: graphAttributes,
            },
            {
                id: 'node-attributes',
                title: 'Node attributes',
                body: [
                    'Node attributes are set with g.setNode(id, ...). Width and height should describe the rendered node before layout runs.',
                ],
                demo: {
                    id: 'node-attributes-demo',
                    title: 'Node size controls',
                    caption: 'Switch node dimensions and observe how Dagre preserves spacing around each measured box.',
                    initialSettings: {rankdir: 'LR', nodesep: 52, ranksep: 84, edgesep: 18, nodeSize: 'mixed'},
                    controls: [
                        ...directionControls,
                        {
                            type: 'segmented',
                            label: 'size',
                            key: 'nodeSize',
                            options: [
                                {label: 'Compact', value: 'compact'},
                                {label: 'Mixed', value: 'mixed'},
                                {label: 'Wide', value: 'wide'},
                            ],
                        },
                    ],
                    buildGraph: buildNodeSizesGraph,
                    code: (settings) => `g.setNode("parser", {
  label: "Parse and normalize",
  width: ${settings.nodeSize === 'compact' ? 86 : 164},
  height: 44
});

g.setNode("rules", {
  label: "Apply business validation rules",
  width: ${settings.nodeSize === 'wide' ? 238 : 92},
  height: ${settings.nodeSize === 'compact' ? 44 : 52}
});

dagre.layout(g);`,
                },
                attributes: nodeAttributes,
            },
            {
                id: 'edge-attributes',
                title: 'Edge attributes',
                body: [
                    'Edge attributes are set with g.setEdge(source, target, ...). They influence rank distance, edge straightness, and label placement.',
                ],
                demo: {
                    id: 'edge-attributes-demo',
                    title: 'Edge attribute controls',
                    caption: 'Change rank distance, edge weight, label size, label side, and label offset before layout runs.',
                    initialSettings: {
                        rankdir: 'LR',
                        nodesep: 54,
                        ranksep: 90,
                        edgesep: 22,
                        minlen: 1,
                        weight: 10,
                        labelpos: 'r',
                        labeloffset: 10,
                        labelWidth: 72,
                    },
                    controls: [
                        ...directionControls,
                        {type: 'segmented', label: 'labelpos', key: 'labelpos', options: labelPositionOptions},
                        {type: 'range', label: 'minlen', key: 'minlen', min: 1, max: 4, step: 1},
                        {type: 'range', label: 'weight', key: 'weight', min: 5, max: 25, step: 5},
                        {type: 'range', label: 'label width', key: 'labelWidth', min: 40, max: 140, step: 4},
                        {type: 'range', label: 'labeloffset', key: 'labeloffset', min: 0, max: 40, step: 2},
                    ],
                    buildGraph: buildEdgeAttributesGraph,
                    code: (settings) => `g.setGraph({rankdir: "${settings.rankdir ?? 'LR'}"});

g.setEdge("source", "main", {
  label: "controlled",
  width: ${settings.labelWidth ?? 72},
  height: 24,
  minlen: ${settings.minlen ?? 1},
  weight: ${settings.weight ?? 1},
  labelpos: "${settings.labelpos ?? 'r'}",
  labeloffset: ${settings.labeloffset ?? 10}
});

g.setEdge("source", "alternate", {
  label: "other",
  weight: ${Math.max(1, 26 - (settings.weight ?? 10))}
});

g.setEdge("main", "sink", {
  label: "finish",
  width: ${settings.labelWidth ?? 72},
  height: 24,
  minlen: ${settings.minlen ?? 1},
  weight: ${settings.weight ?? 1},
  labelpos: "${settings.labelpos ?? 'r'}",
  labeloffset: ${settings.labeloffset ?? 10}
});

dagre.layout(g);`,
                },
                attributes: edgeAttributes,
            },
        ],
    },
    {
        id: 'layout-direction',
        navTitle: 'Layout Direction',
        eyebrow: 'Configuration',
        title: 'Change graph direction',
        description: 'Use rankdir to choose whether ranks flow top-to-bottom, bottom-to-top, left-to-right, or right-to-left.',
        sections: [
            {
                id: 'rankdir',
                title: 'rankdir',
                body: [
                    'The same graph can be laid out in four directions. This is useful when matching a workflow, dependency graph, or diagram to the available screen space.',
                ],
                demo: {
                    id: 'rankdir-demo',
                    title: 'Direction control',
                    caption: 'Switch directions and watch Dagre recalculate the node positions and edge points.',
                    initialSettings: {rankdir: 'LR', nodesep: 48, ranksep: 76, edgesep: 18},
                    controls: directionControls,
                    buildGraph: buildSpacingGraph,
                    code: (settings) => `const g = new dagre.graphlib.Graph();

g.setGraph({
  rankdir: "${settings.rankdir ?? 'LR'}"
});

// Add nodes and edges, then run layout.
dagre.layout(g);`,
                },
            },
        ],
    },
    {
        id: 'spacing',
        navTitle: 'Spacing',
        eyebrow: 'Configuration',
        title: 'Tune spacing',
        description: 'Dagre exposes graph-level spacing options that control how much room appears between nodes, ranks, and edges.',
        sections: [
            {
                id: 'spacing-options',
                title: 'nodesep, ranksep, edgesep',
                body: [
                    'Spacing settings are graph-level options. They are especially important when node labels are long or dense graphs need more breathing room.',
                ],
                demo: {
                    id: 'spacing-demo',
                    title: 'Spacing controls',
                    caption: 'Adjust the sliders to update graph options before calling dagre.layout.',
                    initialSettings: {rankdir: 'TB', nodesep: 50, ranksep: 70, edgesep: 20},
                    controls: [
                        ...directionControls,
                        {type: 'range', label: 'nodesep', key: 'nodesep', min: 20, max: 120, step: 5},
                        {type: 'range', label: 'ranksep', key: 'ranksep', min: 30, max: 160, step: 5},
                        {type: 'range', label: 'edgesep', key: 'edgesep', min: 5, max: 80, step: 5},
                    ],
                    buildGraph: buildSpacingGraph,
                    code: (settings) => `const g = new dagre.graphlib.Graph();

${graphOptionsSnippet(settings)}

dagre.layout(g);`,
                },
            },
        ],
    },
    {
        id: 'node-sizes',
        navTitle: 'Node Sizes',
        eyebrow: 'Input data',
        title: 'Give Dagre real dimensions',
        description: 'Dagre needs the width and height of every node before layout so it can avoid overlaps and route edges around boxes.',
        sections: [
            {
                id: 'dimensions',
                title: 'Node dimensions',
                body: [
                    'Measure or decide each node size before calling layout. The calculated x and y values represent the center of each node.',
                ],
                demo: {
                    id: 'node-sizes-demo',
                    title: 'Mixed node sizes',
                    caption: 'Different dimensions produce different routing while keeping the same graph structure.',
                    initialSettings: {rankdir: 'LR', nodesep: 52, ranksep: 84, edgesep: 18, nodeSize: 'mixed'},
                    controls: [
                        ...directionControls,
                        {
                            type: 'segmented',
                            label: 'size',
                            key: 'nodeSize',
                            options: [
                                {label: 'Compact', value: 'compact'},
                                {label: 'Mixed', value: 'mixed'},
                                {label: 'Wide', value: 'wide'},
                            ],
                        },
                    ],
                    buildGraph: buildNodeSizesGraph,
                    code: (settings) => `g.setNode("parser", {
  label: "Parse and normalize",
  width: ${settings.nodeSize === 'compact' ? 86 : 164},
  height: 44
});

g.setNode("rules", {
  label: "Apply business validation rules",
  width: ${settings.nodeSize === 'wide' ? 238 : 92},
  height: ${settings.nodeSize === 'compact' ? 44 : 52}
});

dagre.layout(g);`,
                },
            },
        ],
    },
    {
        id: 'edge-labels',
        navTitle: 'Edge Labels',
        eyebrow: 'Rendering',
        title: 'Render edge labels and paths',
        description: 'Dagre returns edge points and label coordinates. D3 can turn those points into SVG paths and position labels.',
        sections: [
            {
                id: 'labels',
                title: 'Labeled edges',
                body: [
                    'Set edge label dimensions before layout. After layout, use the edge points for the path and the edge x/y values for the label.',
                ],
                demo: {
                    id: 'edge-labels-demo',
                    title: 'Review flow',
                    caption: 'Labels are part of the layout, so routed edges leave space for them.',
                    initialSettings: {rankdir: 'LR', nodesep: 54, ranksep: 90, edgesep: 22},
                    controls: directionControls,
                    buildGraph: buildEdgeLabelsGraph,
                    code: (settings) => `g.setGraph({rankdir: "${settings.rankdir ?? 'LR'}"});

g.setEdge("draft", "review", {
  label: "submit",
  width: 48,
  height: 20
});

dagre.layout(g);

const edge = g.edge("draft", "review");
// edge.points is rendered as a D3 line.
// edge.x and edge.y position the label.`,
                },
            },
        ],
    },
];
