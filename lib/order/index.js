"use strict";

var _ = require("lodash"),
    initOrder = require("./init-order"),
    crossCount = require("./cross-count"),
    barycenter = require("./barycenter"),
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

  for (var i = 0; i < 10; ++i) {
    sweepLayers(layering, predWeights, sucWeights, i);
    var cc = crossCount(g, layering);
    if (cc < bestCC) {
      best = _.cloneDeep(layering);
      bestCC = cc;
    }
  }

  assignOrder(g, layering);
}

function sweepLayers(layering, predWeights, sucWeights, iter) {
  var i, il;
  if (iter % 2) {
    for (i = layering.length - 1; i > 0; --i) {
      barycenter(layering[i], layering[i - 1], sucWeights);
    }
  } else {
    for (i = 0, il = layering.length - 1; i < il; ++i) {
      barycenter(layering[i], layering[i + 1], predWeights);
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
