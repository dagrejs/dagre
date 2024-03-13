"use strict";

import { default as initOrder } from "./init-order.js";
import { default as crossCount } from "./cross-count.js";
import { default as sortSubgraph } from "./sort-subgraph.js";
import { default as buildLayerGraph } from "./build-layer-graph.js";
import { default as addSubgraphConstraints } from "./add-subgraph-constraints.js";
import { Graph as Graph } from "@dagrejs/graphlib";
import  * as util from "../util.js";

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
export default function order(g) {
  let maxRank = util.maxRank(g),
    downLayerGraphs = buildLayerGraphs(g, util.range(1, maxRank + 1), "inEdges"),
    upLayerGraphs = buildLayerGraphs(g, util.range(maxRank - 1, -1, -1), "outEdges");

  let layering = initOrder(g);
  assignOrder(g, layering);

  let bestCC = Number.POSITIVE_INFINITY,
    best;

  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

    layering = util.buildLayerMatrix(g);
    let cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = Object.assign({}, layering);
      bestCC = cc;
    }
  }

  assignOrder(g, best);
}

function buildLayerGraphs(g, ranks, relationship) {
  return ranks.map(function(rank) {
    return buildLayerGraph(g, rank, relationship);
  });
}

function sweepLayerGraphs(layerGraphs, biasRight) {
  let cg = new Graph();
  layerGraphs.forEach(function(lg) {
    let root = lg.graph().root;
    let sorted = sortSubgraph(lg, root, cg, biasRight);
    sorted.vs.forEach((v, i) => lg.node(v).order = i);
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
}

function assignOrder(g, layering) {
  Object.values(layering).forEach(layer => layer.forEach((v, i) => g.node(v).order = i));
}
