var util = require("../util"),
    crossCount = require("./order/crossCount"),
    initLayerTrees = require("./order/initLayerTrees"),
    initOrder = require("./order/initOrder"),
    sortLayer = require("./order/sortLayer");

module.exports = function() {
  var config = {
    iterations: 24, // max number of iterations
    debugLevel: 0
  };

  var timer = util.createTimer();

  var self = {};

  self.iterations = util.propertyAccessor(self, config, "iterations");

  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self._initOrder = initOrder;

  self.run = timer.wrap("Order Phase", run);

  return self;

  function run(g) {
    initLayerTrees(g);
    initOrder(g);

    if (config.debugLevel >= 2) {
      console.log("Order phase start cross count: " + g.graph().orderCC);
    }

    var i, lastBest;
    for (i = 0, lastBest = 0; lastBest < 4 && i < config.iterations; ++i, ++lastBest) {
      sweep(g, i);
      if (saveBest(g)) {
        lastBest = 0;
      }
      if (config.debugLevel >= 3) {
        console.log("Order phase iter " + i + " cross count: " + g.graph().orderCC);
      }
    }

    restoreBest(g);

    if (config.debugLevel >= 2) {
      console.log("Order iterations: " + i);
      console.log("Order phase best cross count: " + g.graph().orderCC);
    }
  }
};

function multiPredecessors(g) {
  var adjs = {};
  g.eachEdge(function(e, u, v) {
    (adjs[v] = adjs[v] || []).push(u);
  });
  return adjs;
}

function multiSuccessors(g) {
  var adjs = {};
  g.eachEdge(function(e, u, v) {
    (adjs[u] = adjs[u] || []).push(v);
  });
  return adjs;
}

function sweep(g, iter) {
  if (iter % 2 === 0) {
    sweepDown(g, iter);
  } else {
    sweepUp(g, iter);
  }
}

function sweepDown(g) {
  var ordering = util.ordering(g);
  var adjs = multiPredecessors(g);
  for (i = 1; i < ordering.length; ++i) {
    sortLayer(g, ordering[i], adjs);
  }
}

function sweepUp(g) {
  var ordering = util.ordering(g);
  var adjs = multiSuccessors(g);
  for (i = ordering.length - 2; i >= 0; --i) {
    sortLayer(g, ordering[i], adjs);
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
      graph.order[u] = value.order;
    });
    return true;
  }
  return false;
}

function restoreBest(g) {
  var order = g.graph().order;
  g.eachNode(function(u, value) {
    value.order = order[u];
  });
}
