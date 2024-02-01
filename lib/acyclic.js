"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = run;
exports.undo = undo;
var _greedyFas = _interopRequireDefault(require("./greedy-fas.js"));
var _util = require("./util.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function run(g) {
  let fas = g.graph().acyclicer === "greedy" ? (0, _greedyFas.default)(g, weightFn(g)) : dfsFAS(g);
  fas.forEach(e => {
    let label = g.edge(e);
    g.removeEdge(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, (0, _util.uniqueId)("rev"));
  });
  function weightFn(g) {
    return e => {
      return g.edge(e).weight;
    };
  }
}
function dfsFAS(g) {
  let fas = [];
  let stack = {};
  let visited = {};
  function dfs(v) {
    if (visited.hasOwnProperty(v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    g.outEdges(v).forEach(e => {
      if (stack.hasOwnProperty(e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  }
  g.nodes().forEach(dfs);
  return fas;
}
function undo(g) {
  g.edges().forEach(e => {
    let label = g.edge(e);
    if (label.reversed) {
      g.removeEdge(e);
      let forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
}
