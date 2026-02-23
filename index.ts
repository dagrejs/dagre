/*
@license

Copyright (c) 2012-2014 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

import * as graphlib from '@dagrejs/graphlib';
import {notime, time} from './lib/util';
import {version} from './lib/version';
import {layout} from './lib/layout';
import {debugOrdering as debug} from './lib/debug';

export {graphlib};

export {Graph} from '@dagrejs/graphlib';
export {version} from './lib/version';
export {layout} from './lib/layout';
export {debugOrdering as debug} from './lib/debug';

export const util = {time, notime};

// Export types
export type {
    GraphLabel,
    NodeConfig,
    EdgeConfig,
    LayoutConfig,
    LayoutOptions,
    NodeLabel,
    EdgeLabel,
    Point,
    OrderConstraint,
    WeightFunction,
    RankerFunction,
    Edge
} from './lib/types';

const dagre = {
    graphlib,
    version,
    layout,
    debug,
    util: {time, notime},
};

export default dagre;

