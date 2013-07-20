// This program tests the quality of the dagre odering algorithm.

var path = require("path"),
    fs = require("fs"),
    dagre = require("../index");

var graphBase = path.resolve(__dirname, "graphs");
var totalCC = 0;
fs.readdirSync(graphBase).forEach(function(file) {
  if (/\.dot$/.test(file)) {
    var f = fs.readFileSync(path.resolve(graphBase, file), "UTF-8");
    var g = dagre.dot.toGraph(f);
    dagre.layout.acyclic().run(g);
    dagre.layout.rank().run(g);
    dagre.layout()._normalize(g);
    var layering = dagre.layout.order().run(g);
    var cc = dagre.layout.order.crossCount(g, layering);
    console.log(file + ": " + cc);
    totalCC += cc;
  }
});
console.log("Total crossings: " + totalCC);
