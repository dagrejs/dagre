"use strict";

var _ = require("lodash"),
    initOrder = require("./init-order");

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
  var layering = initOrder(g);
  assignOrder(g, layering);
}

function assignOrder(g, layering) {
  _.each(layering, function(layer) {
    _.each(layer, function(v, i) {
      g.getNode(v).order = i;
    });
  });
}
