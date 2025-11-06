#!/usr/bin/env node

let Benchmark = require("benchmark"),
    sprintf = require("sprintf").sprintf;

let Graph = require("@dagrejs/graphlib").Graph,
    rank = require("../lib/rank"),
    layout = require("..").layout;

function runBenchmark(name, fn) {
  let options = {};
  options.onComplete = function(bench) {
    let target = bench.target,
        hz = target.hz,
        stats = target.stats,
        rme = stats.rme,
        samples = stats.sample.length,
        msg = sprintf("    %25s: %13s ops/sec \xb1 %s%% (%3d run(s) sampled)",
                      target.name,
                      Benchmark.formatNumber(hz.toFixed(2)),
                      rme.toFixed(2),
                      samples);
    console.log(msg);
  };
  options.onError = function(bench) {
    console.error("    " + bench.target.error);
  };
  options.setup = function() {
    this.count = Math.random() * 1000;
    this.nextInt = function(range) {
      return Math.floor(this.count++ % range);
    };
  };
  new Benchmark(name, fn, options).run();
}

// Create a small graph (baseline test)
let smallGraph = new Graph()
  .setGraph({})
  .setDefaultNodeLabel(function() { return { width: 1, height: 1}; })
  .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
  .setPath(["a", "b", "c", "d", "h"])
  .setPath(["a", "e", "g", "h"])
  .setPath(["a", "f", "g"]);

// Create a large graph that exposes the quadratic performance issue in PR #481
function createLargeGraph() {
  let g = new Graph()
    .setGraph({})
    .setDefaultNodeLabel(function() { return { width: 1, height: 1}; })
    .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; });

  // Create a more complex graph with interconnected components
  let numGroups = 25;
  let nodesPerGroup = 27; // 25 groups * 27 nodes ≈ 675 nodes

  // Create hierarchical groups with internal structure
  for (let group = 0; group < numGroups; group++) {
    let groupNodes = [];

    // Create nodes for this group
    for (let node = 0; node < nodesPerGroup; node++) {
      let nodeId = `g${group}_n${node}`;
      g.setNode(nodeId, { width: 1, height: 1 });
      groupNodes.push(nodeId);
    }

    // Create internal group structure (not just linear chains)
    // 1. Create a "backbone" path through the group
    for (let i = 0; i < groupNodes.length - 1; i += 3) {
      if (i + 3 < groupNodes.length) {
        g.setEdge(groupNodes[i], groupNodes[i + 3]);
      }
    }

    // 2. Add branching structure within group
    for (let i = 1; i < groupNodes.length - 1; i += 4) {
      if (i - 1 >= 0) g.setEdge(groupNodes[i - 1], groupNodes[i]);
      if (i + 1 < groupNodes.length) g.setEdge(groupNodes[i], groupNodes[i + 1]);
      if (i + 2 < groupNodes.length) g.setEdge(groupNodes[i], groupNodes[i + 2]);
    }
  }

  // Add complex inter-group connections to create ranking conflicts
  for (let group = 0; group < numGroups - 1; group++) {
    // Connect multiple nodes from one group to multiple nodes in next group
    for (let offset = 0; offset < 3; offset++) {
      let fromNode = `g${group}_n${5 + offset * 7}`;
      let toNode = `g${group + 1}_n${2 + offset * 8}`;
      if (g.hasNode(fromNode) && g.hasNode(toNode)) {
        g.setEdge(fromNode, toNode);
      }
    }

    // Add some "skip ahead" connections that create ranking complexity
    if (group + 2 < numGroups) {
      let skipFrom = `g${group}_n${10}`;
      let skipTo = `g${group + 2}_n${3}`;
      if (g.hasNode(skipFrom) && g.hasNode(skipTo)) {
        g.setEdge(skipFrom, skipTo);
      }
    }
  }

  // Add some random cross-connections to increase complexity
  for (let i = 0; i < numGroups * 2; i++) {
    let fromGroup = Math.floor(Math.random() * (numGroups - 1));
    let toGroup = fromGroup + 1 + Math.floor(Math.random() * Math.min(3, numGroups - fromGroup - 1));
    let fromNode = `g${fromGroup}_n${Math.floor(Math.random() * nodesPerGroup)}`;
    let toNode = `g${toGroup}_n${Math.floor(Math.random() * nodesPerGroup)}`;

    if (g.hasNode(fromNode) && g.hasNode(toNode) && !g.hasEdge(fromNode, toNode)) {
      g.setEdge(fromNode, toNode);
    }
  }

  return g;
}

console.log("=== Small Graph Benchmarks (baseline) ===");

runBenchmark("longest-path ranker (small)", function() {
  smallGraph.graph().ranker = "longest-path";
  rank(smallGraph);
});

runBenchmark("tight-tree ranker (small)", function() {
  smallGraph.graph().ranker = "tight-tree";
  rank(smallGraph);
});

runBenchmark("network-simplex ranker (small)", function() {
  smallGraph.graph().ranker = "network-simplex";
  rank(smallGraph);
});

runBenchmark("layout (small)", function() {
  delete smallGraph.graph().ranker;
  layout(smallGraph);
});

console.log("");
console.log("=== Large Graph Benchmarks (exposes PR #481 optimization) ===");

// Create one large graph instance to use for all benchmarks
let largeGraph = createLargeGraph();
console.log(`Large graph: ${largeGraph.nodeCount()} nodes, ${largeGraph.edgeCount()} edges`);
console.log("");

runBenchmark("longest-path ranker (large)", function() {
  largeGraph.graph().ranker = "longest-path";
  rank(largeGraph);
});

runBenchmark("tight-tree ranker (large)", function() {
  largeGraph.graph().ranker = "tight-tree";
  rank(largeGraph);
});

runBenchmark("network-simplex ranker (large)", function() {
  largeGraph.graph().ranker = "network-simplex";
  rank(largeGraph);
});

runBenchmark("layout (large)", function() {
  delete largeGraph.graph().ranker;
  layout(largeGraph);
});

console.log("");
