var util = require("../util"),
    crossCount = require("./order/crossCount"),
    initLayerTrees = require("./order/initLayerTrees"),
    Digraph = require("graphlib").Digraph,
    topsort = require("graphlib").alg.topsort,
    nodesFromList = require("graphlib").filter.nodesFromList;

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

function sortLayer(g, movable, adjacent) {
  var cg = (g.graph().constraintGraph
      ? g.graph().constraintGraph.filterNodes(nodesFromList(movable))
      : new Digraph());

  var bs = {};
  var deg = {};
  var lists = {};
  var pos = {},
      nextPos = 0;;
  movable.forEach(function(u) {
    var vs = adjacent[u];
    deg[u] = vs ? vs.length : 0;
    bs[u] = (deg[u] > 0
        ? util.sum(vs.map(function(v) { return g.node(v).order; })) / deg[u]
        : 0);
    lists[u] = [u];
    pos[u] = g.node(u).order;
    if (pos[u] >= nextPos) nextPos = pos[u] + 1;
  });

  var violated;
  while ((violated = findViolatedConstraint(cg, bs)) !== undefined) {
    var source = cg.source(violated),
        sourceDeg = deg[source],
        target = cg.target(violated),
        targetDeg = deg[target];

    var v;
    while ((v = cg.addNode(null)) && g.hasNode(v)) {
      cg.delNode(v);
    }
    pos[v] = nextPos++;

    // Collapse barycenter and list
    deg[v] = sourceDeg + targetDeg;
    delete deg[source];
    delete deg[target];
    bs[v] = (bs[source] * sourceDeg + bs[target] * targetDeg) / deg[v];
    delete bs[source];
    delete bs[target];
    lists[v] = [].concat(lists[source], lists[target]);
    delete lists[source];
    delete lists[target];

    // Collapse node in constraint graph
    // TODO original paper removes self loops, but it is not obvious when this would happen
    cg.inEdges(source).forEach(function(e) {
      cg.delEdge(e);
      cg.addEdge(null, cg.source(e), v);
    });
    cg.outEdges(target).forEach(function(e) {
      cg.delEdge(e);
      cg.addEdge(null, v, cg.target(e));
    });
    cg.delNode(source);
    cg.delNode(target);
    if (cg.incidentEdges(v).length === 0) { cg.delNode(v); }
  }

  var bsKeys = Object.keys(bs);
  bsKeys.sort(function(x, y) {
    return bs[x] - bs[y] || pos[x] - pos[y];
  });

  var i = 0;
  bsKeys.forEach(function(u) {
    lists[u].forEach(function(v) {
      g.node(v).order = i++;
    });
  });
}

function findViolatedConstraint(cg, bs) {
  var us = topsort(cg);
  for (var i = 0; i < us.length; ++i) {
    var u = us[i];
    var inEdges = cg.inEdges(u);
    for (var j = 0; j < inEdges.length; ++j) {
      var e = inEdges[j];
      if (bs[cg.source(e)] >= bs[u]) {
        return e;
      }
    }
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

/*
 * Given a graph with a set of layered nodes (i.e. nodes that have a `rank`
 * attribute) this function attaches an `order` attribute that uniquely
 * arranges each node of each rank. If no constraint graph is provided the
 * order of the nodes in each rank is entirely arbitrary.
 */
function initOrder(g) {
  var orderCount = [];

  function addNode(value) {
    if ("order" in value) return;
    if (!(value.rank in orderCount)) {
      orderCount[value.rank] = 0;
    }
    value.order = orderCount[value.rank]++;
  }

  if (g.graph().constraintGraph) {
    var cg = g.graph().constraintGraph;
    topsort(cg).forEach(function(u) { addNode(g.node(u)); });
  }

  g.eachNode(function(u, value) { addNode(value); });
  var cc = crossCount(g);
  g.graph().orderInitCC = cc;
  g.graph().orderCC = Number.MAX_VALUE;
}
