"use strict";

import { default as greedyFAS } from "./greedy-fas.js";
import { uniqueId as uniqueId } from "./util.js";

export function run(g) {
  let fas = (g.graph().acyclicer === "greedy"
    ? greedyFAS(g, weightFn(g))
    : dfsFAS(g));
  fas.forEach(e => {
    let label = g.edge(e);
    g.removeEdge(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, uniqueId("rev"));
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

export function undo(g) {
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
