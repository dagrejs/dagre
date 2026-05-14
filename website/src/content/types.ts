import type {Graph} from '@dagrejs/graphlib';
import type {EdgeLabel, GraphLabel, NodeLabel} from '@dagrejs/dagre';

export type RankDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type RankAlignment = 'UL' | 'UR' | 'DL' | 'DR';
export type Ranker = 'network-simplex' | 'tight-tree' | 'longest-path';
export type Acyclicer = 'none' | 'greedy';
export type LabelPosition = 'l' | 'c' | 'r';

export type DemoSettings = {
    rankdir?: RankDirection;
    align?: RankAlignment;
    nodesep?: number;
    ranksep?: number;
    edgesep?: number;
    marginx?: number;
    marginy?: number;
    ranker?: Ranker;
    acyclicer?: Acyclicer;
    nodeSize?: 'compact' | 'mixed' | 'wide';
    minlen?: number;
    weight?: number;
    labelpos?: LabelPosition;
    labeloffset?: number;
    labelWidth?: number;
};

export type Control =
    | {
        type: 'segmented';
        label: string;
        key: keyof DemoSettings;
        options: Array<{label: string; value: string}>;
    }
    | {
        type: 'range';
        label: string;
        key: keyof DemoSettings;
        min: number;
        max: number;
        step: number;
    };

export type DemoDefinition = {
    id: string;
    title: string;
    caption: string;
    initialSettings: DemoSettings;
    controls: Control[];
    buildGraph: (settings: DemoSettings) => Graph<GraphLabel, NodeLabel, EdgeLabel>;
    code: (settings: DemoSettings) => string;
};

export type AttributeDefinition = {
    target: 'graph' | 'node' | 'edge';
    name: string;
    defaultValue: string;
    description: string;
};

export type PageSection = {
    id: string;
    title: string;
    body: string[];
    demo?: DemoDefinition;
    attributes?: AttributeDefinition[];
};

export type PageDefinition = {
    id: string;
    navTitle: string;
    eyebrow: string;
    title: string;
    description: string;
    sections: PageSection[];
};
