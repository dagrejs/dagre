"use strict";

var rankUtil = require("./util"),
    util = require("../util"),
    longestPath = rankUtil.longestPath,
    normalizeRanks = rankUtil.normalizeRanks,
    feasibleTree = require("./feasible-tree"),
    networkSimplex = require("./network-simplex"),
    nestingGraph = require("./nesting-graph");

module.exports = rank;

/*
 * Assigns a rank to each node in the input graph that respects the "minlen"
 * constraint specified on edges between nodes.
 *
 * This basic structure is derived from Gansner, et al., "A Technique for
 * Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects
 *    3. Graph edges must have "weight" and "minlen" attributes
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have a "rank" attribute based on the results of the
 *       algorithm. Ranks start from 0 and increment.
 */
function rank(g, ranker) {
  nestingGraph.run(g);
  var simplified = util.asNonCompoundGraph(g);
  runRanker(simplified, ranker);
  nestingGraph.cleanup(g);
  rankUtil.removeEmptyRanks(g);
  normalizeRanks(g);
}

function runRanker(g, ranker) {
  switch(ranker) {
    case "network-simplex": networkSimplexRanker(g); break;
    case "tight-tree": tightTreeRanker(g); break;
    case "longest-path": longestPathRanker(g); break;
    default: networkSimplexRanker(g);
  }
}

// A fast and simple ranker, but results are far from optimal.
var longestPathRanker = longestPath;

function tightTreeRanker(g) {
  longestPath(g);
  feasibleTree(g);
}

function networkSimplexRanker(g) {
  networkSimplex(g);
}
