// This program tests the quality of the dagre odering algorithm.

var path = require("path"),
    fs = require("fs"),
    dagre = require("../index"),
    util = require("../lib/util"),
    dot = require("../lib/dot"),
    acyclic = require("../lib/layout/acyclic"),
    rank = require("../lib/layout/rank"),
    order = require("../lib/layout/order"),
    layout = require("../lib/layout/layout");

var graphBase = path.resolve(__dirname, "graphs");
var samples = [];
var times = [];
fs.readdirSync(graphBase).forEach(function(file) {
  if (/\.dot$/.test(file)) {
    var f = fs.readFileSync(path.resolve(graphBase, file), "UTF-8");
    var g = dot.toGraph(f);
    acyclic().run(g);
    rank().run(g);
    layout()._normalize(g);
    var preLayering = order()._initOrder(g);
    var pre = order().crossCount(g, preLayering);
    if (pre !== 0) {
      var start = new Date().getTime();
      var postLayering = order().run(g);
      var end = new Date().getTime();
      var post = order().crossCount(g, postLayering);
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
