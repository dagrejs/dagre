"use strict";

var _ = require("lodash"),
    rankUtil = require("./util"),
    longestPath = rankUtil.longestPath,
    normalizeRanks = rankUtil.normalizeRanks,
    feasibleTree = require("./feasible-tree"),
    networkSimplex = require("./network-simplex"),
    components = require("graphlib").alg.components;

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
  var root = addFakeRoot(g);
  runRanker(g, ranker);
  g.removeNode(root);
  normalizeRanks(g);
}

function runRanker(g, ranker) {
  if (g.nodeCount() === 1) {
    ranker = "longest-path";
  }

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

/*
 * Adds a fake root node to the graph that connects to at least one node in
 * component. This serves 2 purposes: 1) it makes the entire graph connected,
 * which simplifies the implementation for some ranking algorithms, and 2) it
 * makes it possible to align node when there are constraints on which ranks
 * nodes, edges, and cluster border nodes can appear.
 */
function addFakeRoot(g) {
  var cmpts = components(g),
      root;
  do {
    root = _.uniqueId("_root");
  } while (g.hasNode(root));

  g.setNode(root, {});
  _.each(cmpts, function(cmpt) {
    g.setEdge(root, cmpt[0], { minlen: 0, weight: 0 });
  });
  return root;
}
