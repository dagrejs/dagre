// This program tests the quality of the dagre odering algorithm.

var path = require("path"),
    fs = require("fs"),
    dagre = require("../index"),
    util = require("../lib/util");

var graphBase = path.resolve(__dirname, "graphs");
var samples = [];
var times = [];
fs.readdirSync(graphBase).forEach(function(file) {
  if (/\.dot$/.test(file)) {
    var f = fs.readFileSync(path.resolve(graphBase, file), "UTF-8");
    var g = dagre.dot.toGraph(f);
    dagre.layout.acyclic().run(g);
    dagre.layout.rank().run(g);
    dagre.layout()._normalize(g);
    var preLayering = dagre.layout.order()._initOrder(g);
    var pre = dagre.layout.order.crossCount(g, preLayering);
    if (pre !== 0) {
      var start = new Date().getTime();
      var postLayering = dagre.layout.order().run(g);
      var end = new Date().getTime();
      var post = dagre.layout.order.crossCount(g, postLayering);
      var eff = (pre - post) / pre;
      console.log(file + ": PRE: " + pre + " POST: " + post + " Efficiency: " + eff);
      samples.push(eff);
      times.push(end - start);
    } else {
      console.log(file + ": SKIPPING - 0 CROSSINGS");
    }
  }
});
console.log("# Graphs: " + samples.length);
console.log("Reduction efficiency (larger is better): " + (util.sum(samples) / samples.length));
console.log("Execution time: " + util.sum(times) + "ms (avg: " + Math.round(util.sum(times) / times.length) + "ms)");
