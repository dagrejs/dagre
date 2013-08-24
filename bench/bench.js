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

var benchmarkFiles = process.argv.slice(2);
if (benchmarkFiles.length === 0) {
  process.stderr.write("Usage: " + __filename + " [DOT file]+\n");
  process.exit(1);
}

var samples = [];
var times = [];
var skipped = 0;
var failed = 0;

var entry;
while ((entry = benchmarkFiles.pop()) !== undefined) {
  // If we see a directory, push all of its files to the queue and move to the next entry.
  if (fs.statSync(entry).isDirectory()) {
    fs.readdirSync(entry).forEach(function(f) {
      benchmarkFiles.push(path.resolve(entry, f));
    });
    continue;
  }

  process.stdout.write(leftPad(20, entry) + ": ");
  var f = fs.readFileSync(entry, "UTF-8");
  try {
    var g = dot.toGraph(f);
    acyclic().run(g);
    rank(g);
    layout()._normalize(g);
    var preLayering = order()._initOrder(g);
    var pre = order().crossCount(g, preLayering);
    if (pre !== 0) {
      var start = new Date().getTime();
      var postLayering = order().run(g);
      var end = new Date().getTime();
      var post = order().crossCount(g, postLayering);
      var eff = (pre - post) / pre;
      console.log("SUCCESS  -" +
                  "  PRE: " + leftPad(8, pre) +
                  "  POST: " + leftPad(8, post) +
                  "  Efficiency: " + leftPad(8, eff.toString().substring(0, 8)) +
                  "  Time: " + leftPad(5, (end - start)) + "ms");
      samples.push(eff);
      times.push(end - start);
    } else {
      console.log("SKIPPING - 0 CROSSINGS");
      ++skipped;
    }
  } catch (e) {
    console.log("FAILED   - " + e.toString().split("\n")[0]);
    ++failed;
  }
};

console.log("# Graphs: " + leftPad(8, samples.length + skipped + failed));
console.log("Skipped : " + leftPad(8, skipped));
console.log("Failed  : " + leftPad(8, failed));
console.log("Reduction efficiency (larger is better): " + (util.sum(samples) / samples.length));
console.log("Execution time: " + util.sum(times) + "ms (avg: " + Math.round(util.sum(times) / times.length) + "ms)");

function leftPad(len, str) {
  var result = [];
  for (i = 0; i < len; ++i) {
    result.push(" ");
  }
  result.push(str);
  return result.join("").slice(-len);
}
