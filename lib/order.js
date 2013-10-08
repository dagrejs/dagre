var util = require("./util"),
    crossCount = require("./order/crossCount"),
    initLayerGraphs = require("./order/initLayerGraphs"),
    initOrder = require("./order/initOrder"),
    sortLayer = require("./order/sortLayer");

module.exports = order;

// The maximum number of sweeps to perform before finishing the order phase.
var DEFAULT_MAX_SWEEPS = 24;
order.DEFAULT_MAX_SWEEPS = DEFAULT_MAX_SWEEPS;

/*
 * Runs the order phase with the specified `graph, `maxSweeps`, and
 * `debugLevel`. If `maxSweeps` is not specified we use `DEFAULT_MAX_SWEEPS`.
 * If `debugLevel` is not set we assume 0.
 */
function order(g, maxSweeps) {
  if (arguments.length < 2) {
    maxSweeps = DEFAULT_MAX_SWEEPS;
  }

  var layerGraphs = initLayerGraphs(g);
  initOrder(g);

  util.log(2, "Order phase start cross count: " + g.graph().orderInitCC);

  var i, lastBest;
  for (i = 0, lastBest = 0; lastBest < 4 && i < maxSweeps; ++i, ++lastBest) {
    sweep(g, layerGraphs, i);
    if (saveBest(g)) {
      lastBest = 0;
    }
    util.log(3, "Order phase iter " + i + " cross count: " + g.graph().orderCC);
  }

  restoreBest(g);

  util.log(2, "Order iterations: " + i);
  util.log(2, "Order phase best cross count: " + g.graph().orderCC);
}

function predecessorWeights(g, nodes) {
  var weights = {};
  nodes.forEach(function(u) {
    weights[u] = g.inEdges(u).map(function(e) {
      return g.node(g.source(e)).order;
    });
  });
  return weights;
}

function successorWeights(g, nodes) {
  var weights = {};
  nodes.forEach(function(u) {
    weights[u] = g.outEdges(u).map(function(e) {
      return g.node(g.target(e)).order;
    });
  });
  return weights;
}

function sweep(g, layerGraphs, iter) {
  if (iter % 2 === 0) {
    sweepDown(g, layerGraphs, iter);
  } else {
    sweepUp(g, layerGraphs, iter);
  }
}

function sweepDown(g, layerGraphs) {
  var cg;
  for (i = 1; i < layerGraphs.length; ++i) {
    cg = sortLayer(layerGraphs[i], cg, predecessorWeights(g, layerGraphs[i].nodes()));
  }
}

function sweepUp(g, layerGraphs) {
  var cg;
  for (i = layerGraphs.length - 2; i >= 0; --i) {
    sortLayer(layerGraphs[i], cg, successorWeights(g, layerGraphs[i].nodes()));
  }
}

/*
 * Checks if the current ordering of the graph has a lower cross count than the
 * current best. If so, saves the ordering of the current nodes and the new
 * best cross count. This can be used with restoreBest to restore the last best
 * ordering.
 *
 * If this is the first time running the function the current ordering will be
 * assumed as the best.
 *
 * Returns `true` if this layout represents a new best.
 */
function saveBest(g) {
  var graph = g.graph();
  var cc = crossCount(g);
  if (!("orderCC" in graph) || graph.orderCC > cc) {
    graph.orderCC = cc;
    graph.order = {};
    g.eachNode(function(u, value) {
      if ("order" in value) {
        graph.order[u] = value.order;
      }
    });
    return true;
  }
  return false;
}

function restoreBest(g) {
  var order = g.graph().order;
  g.eachNode(function(u, value) {
    if ("order" in value) {
      value.order = order[u];
    }
  });
}
