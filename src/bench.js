#!/usr/bin/env node

var Benchmark = require("benchmark"),
    sprintf = require("sprintf").sprintf;

var Graph = require("graphlib").Graph,
    rank = require("../lib/rank"),
    layout = require("..").layout;

function runBenchmark(name, fn) {
  var options = {};
  options.onComplete = function(bench) {
    var target = bench.target,
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

var g = new Graph()
  .setDefaultNodeLabel(function() { return {}; })
  .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
  .setPath(["a", "b", "c", "d", "h"])
  .setPath(["a", "e", "g", "h"])
  .setPath(["a", "f", "g"]);


runBenchmark("longest-path ranker", function() {
  rank(g, "longest-path");
});

runBenchmark("tight-tree ranker", function() {
  rank(g, "tight-tree");
});

runBenchmark("network-simplex ranker", function() {
  rank(g, "network-simplex");
});

runBenchmark("layout", function() {
  layout(g);
});
