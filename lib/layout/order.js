var util = require("../util"),
    crossCount = require("./order/crossCount");

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
    initOrder(g);
    saveBest(g);

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

function sortLayer(g, movable, adjacent) {
  var bs = barycenters(g, movable, adjacent);

  var toSort = movable.filter(function(u) { return bs[u] !== -1; });
  toSort.sort(function(x, y) {
    return bs[x] - bs[y] || g.node(x).order - g.node(y).order;
  });

  for (var m = 0, s = 0; s < toSort.length; ++m) {
    if (bs[movable[m]] === -1) {
      continue;
    }
    g.node(toSort[s++]).order = m;
  }
}

function barycenters(g, movable, adjacent) {
  var bs = {}; // barycenters

  movable.forEach(function(u) {
    var vs = adjacent[u];
    bs[u] = -1;
    if (vs && vs.length > 0) {
      bs[u] = util.sum(vs.map(function(v) { return g.node(v).order; })) / vs.length;
    }
  });

  return bs;
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
  if (!("orderInitCC" in graph)) {
    graph.orderInitCC = cc;
  }
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

/*
 * Given a graph with a set of layered nodes (i.e. nodes that have a `rank`
 * attribute) this function attaches an `order` attribute that uniquely
 * arranges each node of each rank. The assigned order is arbitrary.
 */
function initOrder(g) {
  var orderCount = [];
  g.eachNode(function(u, value) {
    if (!(value.rank in orderCount)) {
      orderCount[value.rank] = 0;
    }
    value.order = orderCount[value.rank]++;
  });
}
