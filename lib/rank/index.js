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
  if (g.nodeCount() === 1) {
    ranker = "longest-path";
  }

  switch(ranker) {
    case "network-simplex": networkSimplexRanker(g); break;
    case "tight-tree": tightTreeRanker(g); break;
    case "longest-path": longestPathRanker(g); break;
    default: networkSimplexRanker(g);
  }

  normalizeRanks(g);
}

// A fast and simple ranker, but results are far from optimal.
var longestPathRanker = longestPath;

function tightTreeRanker(g) {
  withFakeRoot(g, function() {
    longestPath(g);
    feasibleTree(g);
  });
}

function networkSimplexRanker(g) {
  withFakeRoot(g, function() {
    networkSimplex(g);
  });
}

/*
 * Creates a fake node to connect all components in the graph. This simplifies
 * some of the algorithms later and also avoids creating subgraphs, which is
 * expensive.
 */
function withFakeRoot(g, fn) {
  var cmpts = components(g);
  if (cmpts.length > 1) {
    var root;
    do {
      root = _.uniqueId("root");
    } while (g.hasNode(root));

    g.setNode(root, {});
    _.each(cmpts, function(cmpt) {
      g.setEdge(root, cmpt[0], { minlen: 0, weight: 0 });
    });

    fn(g);
    g.removeNode(root);
  } else {
    fn(g);
  }
}

