import * as graphlib from '@dagrejs/graphlib';
import { notime, time } from './lib/util';
import { layout } from './lib/layout';
import { debugOrdering as debug } from './lib/debug';
export { graphlib };
export { Graph } from '@dagrejs/graphlib';
export { version } from './lib/version';
export { layout } from './lib/layout';
export { debugOrdering as debug } from './lib/debug';
export declare const util: {
    time: typeof time;
    notime: typeof notime;
};
export type { GraphLabel, NodeConfig, EdgeConfig, LayoutConfig, LayoutOptions, NodeLabel, EdgeLabel, Point, OrderConstraint, WeightFunction, RankerFunction, Edge } from './lib/types';
declare const dagre: {
    graphlib: typeof graphlib;
    version: string;
    layout: typeof layout;
    debug: typeof debug;
    util: {
        time: typeof time;
        notime: typeof notime;
    };
};
export default dagre;
//# sourceMappingURL=index.d.ts.map