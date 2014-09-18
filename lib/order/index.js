"use strict";

var _ = require("lodash"),
    initOrder = require("./init-order"),
    crossCount = require("./cross-count"),
    sortLayer = require("./sort-layer"),
    util = require("../util");

module.exports = order;

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
function order(g) {
  var layering = initOrder(g),
      best = _.cloneDeep(layering),
      bestCC = crossCount(g, best),
      predWeights = util.predecessorWeights(g),
      sucWeights = util.successorWeights(g);

  for (var i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayers(layering, predWeights, sucWeights, i);
    var cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = _.cloneDeep(layering);
      bestCC = cc;
    }
  }

  assignOrder(g, best);
}

function sweepLayers(layering, predWeights, sucWeights, iter) {
  var i, il,
      bias = iter % 4 >= 2;
  if (iter % 2) {
    for (i = layering.length - 1; i > 0; --i) {
      sortLayer(layering[i], layering[i - 1], sucWeights, bias);
    }
  } else {
    for (i = 0, il = layering.length - 1; i < il; ++i) {
      sortLayer(layering[i], layering[i + 1], predWeights, bias);
    }
  }
}

function assignOrder(g, layering) {
  _.each(layering, function(layer) {
    _.each(layer, function(v, i) {
      g.getNode(v).order = i;
    });
  });
}

