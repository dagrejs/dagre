#!/usr/bin/env node

let Benchmark = require("benchmark"),
  sprintf = require("sprintf").sprintf;

let Graph = require("graphlib").Graph,
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
      return Math.floor(this.count++ % range );
    };
  };
  new Benchmark(name, fn, options).run();
}

let g = new Graph()
  .setGraph({})
  .setDefaultNodeLabel(function() { return { width: 1, height: 1}; })
  .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
  .setPath(["a", "b", "c", "d", "h"])
  .setPath(["a", "e", "g", "h"])
  .setPath(["a", "f", "g"]);

runBenchmark("longest-path ranker", function() {
  g.graph().ranker = "longest-path";
  rank(g);
});

runBenchmark("tight-tree ranker", function() {
  g.graph().ranker = "tight-tree";
  rank(g);
});

runBenchmark("network-simplex ranker", function() {
  g.graph().ranker = "network-simplex";
  rank(g);
});

runBenchmark("layout", function() {
  delete g.graph().ranker;
  layout(g);
});
