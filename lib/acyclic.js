"use strict";

var _ = require("./lodash");
var greedyFAS = require("./greedy-fas");

module.exports = {
  run: run,
  undo: undo
};

function run(g) {
  var fas =
    g.graph().acyclicer === "greedy" ? greedyFAS(g, weightFn(g)) : dfsFAS(g);
  _.forEach(fas, function(e) {
    var label = g.edge(e);
    g.removeEdge(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, _.uniqueId("rev"));
  });

  function weightFn(g) {
    return function(e) {
      return g.edge(e).weight;
    };
  }
}

function dfsFAS(g) {
  var fas = [];
  var stack = {};
  var visited = {};

  function dfs(v) {
    var s = [v];

    while (s.length > 0) {
      var curr = s.pop();

      if (_.has(visited, curr)) continue;

      visited[curr] = true;
      stack[v] = true;
      _.forEachRight(g.outEdges(curr), function (e) {
        if (_.has(stack, e.w)) {
          fas.push(e);
        } else {
          s.push(e.w);
        }
      });

      delete stack[curr];
    }
  }

  _.forEach(g.nodes(), dfs);
  return fas;
}

function undo(g) {
  _.forEach(g.edges(), function(e) {
    var label = g.edge(e);
    if (label.reversed) {
      g.removeEdge(e);

      var forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
}
