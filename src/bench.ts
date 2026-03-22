#!/usr/bin/env node

import Benchmark from 'benchmark';
import {Graph} from '@dagrejs/graphlib';
import rank from '../lib/rank';
import {layout} from '..';

interface BenchContext {
    count: number;

    nextInt(range: number): number;
}

function runBenchmark(name: string, fn: (this: BenchContext) => void): void {
    const options: Benchmark.Options = {};
    options.onComplete = function (bench: Benchmark.Event): void {
        const target = bench.target;
        if (!target) return;

        const hz = target.hz || 0;
        const stats = target.stats;
        if (!stats) return;

        const rme = stats.rme;
        const samples = stats.sample.length;
        const msg = `    ${name.padStart(25)}: ${Benchmark.formatNumber(hz).padStart(13)} ops/sec ± ${rme.toFixed(2)}% (${samples.toString().padStart(3)} run(s) sampled)`;
        console.log(msg);
    };
    options.onError = function (bench: Benchmark.Event): void {
        const target = bench.target as Benchmark.Target & { error?: string };
        if (target && target.error) {
            console.error('    ' + target.error);
        }
    };
    options.setup = function (this: BenchContext): void {
        this.count = Math.random() * 1000;
        this.nextInt = function (range: number): number {
            return Math.floor(this.count++ % range);
        };
    };
    new Benchmark(name, fn, options).run();
}

// Create a small graph (baseline test)
const smallGraph = new Graph()
    .setGraph({})
    .setDefaultNodeLabel(function () {
        return {width: 1, height: 1};
    })
    .setDefaultEdgeLabel(function () {
        return {minlen: 1, weight: 1};
    })
    .setPath(['a', 'b', 'c', 'd', 'h'])
    .setPath(['a', 'e', 'g', 'h'])
    .setPath(['a', 'f', 'g']);

// Create a large graph that exposes the quadratic performance issue in PR #481
function createLargeGraph(): Graph {
    const g = new Graph()
        .setGraph({})
        .setDefaultNodeLabel(function () {
            return {width: 1, height: 1};
        })
        .setDefaultEdgeLabel(function () {
            return {minlen: 1, weight: 1};
        });

    // Create a more complex graph with interconnected components
    const numGroups = 25;
    const nodesPerGroup = 27; // 25 groups * 27 nodes ≈ 675 nodes

    // Create hierarchical groups with internal structure
    for (let group = 0; group < numGroups; group++) {
        const groupNodes: string[] = [];

        // Create nodes for this group
        for (let node = 0; node < nodesPerGroup; node++) {
            const nodeId = `g${group}_n${node}`;
            g.setNode(nodeId, {width: 1, height: 1});
            groupNodes.push(nodeId);
        }

        // Create internal group structure (not just linear chains)
        // 1. Create a "backbone" path through the group
        for (let i = 0; i < groupNodes.length - 1; i += 3) {
            if (i + 3 < groupNodes.length) {
                g.setEdge(groupNodes[i]!, groupNodes[i + 3]!);
            }
        }

        // 2. Add branching structure within group
        for (let i = 1; i < groupNodes.length - 1; i += 4) {
            if (i - 1 >= 0) g.setEdge(groupNodes[i - 1]!, groupNodes[i]!);
            if (i + 1 < groupNodes.length) g.setEdge(groupNodes[i]!, groupNodes[i + 1]!);
            if (i + 2 < groupNodes.length) g.setEdge(groupNodes[i]!, groupNodes[i + 2]!);
        }
    }

    // Add complex inter-group connections to create ranking conflicts
    for (let group = 0; group < numGroups - 1; group++) {
        // Connect multiple nodes from one group to multiple nodes in next group
        for (let offset = 0; offset < 3; offset++) {
            const fromNode = `g${group}_n${5 + offset * 7}`;
            const toNode = `g${group + 1}_n${2 + offset * 8}`;
            if (g.hasNode(fromNode) && g.hasNode(toNode)) {
                g.setEdge(fromNode, toNode);
            }
        }

        // Add some "skip ahead" connections that create ranking complexity
        if (group + 2 < numGroups) {
            const skipFrom = `g${group}_n${10}`;
            const skipTo = `g${group + 2}_n${3}`;
            if (g.hasNode(skipFrom) && g.hasNode(skipTo)) {
                g.setEdge(skipFrom, skipTo);
            }
        }
    }

    // Add some random cross-connections to increase complexity
    for (let i = 0; i < numGroups * 2; i++) {
        const fromGroup = Math.floor(Math.random() * (numGroups - 1));
        const toGroup = fromGroup + 1 + Math.floor(Math.random() * Math.min(3, numGroups - fromGroup - 1));
        const fromNode = `g${fromGroup}_n${Math.floor(Math.random() * nodesPerGroup)}`;
        const toNode = `g${toGroup}_n${Math.floor(Math.random() * nodesPerGroup)}`;

        if (g.hasNode(fromNode) && g.hasNode(toNode) && !g.hasEdge(fromNode, toNode)) {
            g.setEdge(fromNode, toNode);
        }
    }

    return g;
}

console.log('=== Small Graph Benchmarks (baseline) ===');

runBenchmark('longest-path ranker (small)', function () {
    smallGraph.graph().ranker = 'longest-path';
    rank(smallGraph);
});

runBenchmark('tight-tree ranker (small)', function () {
    smallGraph.graph().ranker = 'tight-tree';
    rank(smallGraph);
});

runBenchmark('network-simplex ranker (small)', function () {
    smallGraph.graph().ranker = 'network-simplex';
    rank(smallGraph);
});

runBenchmark('layout (small)', function () {
    delete smallGraph.graph().ranker;
    layout(smallGraph);
});

console.log('');
console.log('=== Large Graph Benchmarks (exposes PR #481 optimization) ===');

// Create one large graph instance to use for all benchmarks
const largeGraph = createLargeGraph();
console.log(`Large graph: ${largeGraph.nodeCount()} nodes, ${largeGraph.edgeCount()} edges`);
console.log('');

runBenchmark('longest-path ranker (large)', function () {
    largeGraph.graph().ranker = 'longest-path';
    rank(largeGraph);
});

runBenchmark('tight-tree ranker (large)', function () {
    largeGraph.graph().ranker = 'tight-tree';
    rank(largeGraph);
});

runBenchmark('network-simplex ranker (large)', function () {
    largeGraph.graph().ranker = 'network-simplex';
    rank(largeGraph);
});

runBenchmark('layout (large)', function () {
    delete largeGraph.graph().ranker;
    layout(largeGraph);
});

console.log('');
