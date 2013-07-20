dagre.layout.order = function() {
  var config = {
    iterations: 24, // max number of iterations
    debugLevel: 0
  };

  var timer = createTimer();

  var self = {};

  self.iterations = propertyAccessor(self, config, "iterations");

  self.debugLevel = propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Order Phase", run);

  return self;

  function run(g) {
    var layering = initOrder(g);
    var bestLayering = copyLayering(layering);
    var bestCC = crossCount(g, layering);

    if (config.debugLevel >= 2) {
      console.log("Order phase start cross count: " + bestCC);
    }

    var cc, i, lastBest;
    for (i = 0, lastBest = 0; lastBest < 4 && i < config.iterations; ++i, ++lastBest) {
      cc = sweep(g, i, layering);
      if (cc < bestCC) {
        bestLayering = copyLayering(layering);
        bestCC = cc;
        lastBest = 0;
      }
      if (config.debugLevel >= 3) {
        console.log("Order phase iter " + i + " cross count: " + bestCC);
      }
    }

    bestLayering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        g.node(u).order = i;
      });
    });

    if (config.debugLevel >= 2) {
      console.log("Order iterations: " + i);
      console.log("Order phase best cross count: " + bestCC);
    }

    return bestLayering;
  }

  function initOrder(g) {
    var layering = [];
    g.eachNode(function(n, a) {
      var layer = layering[a.rank] || (layering[a.rank] = []);
      layer.push(n);
    });
    return layering;
  }

  /*
   * Returns a function that will return the predecessors for a node. This
   * function differs from `g.predecessors(u)` in that a predecessor appears
   * for each incident edge (`g.predecessors(u)` treats predecessors as a set).
   * This allows pseudo-weighting of predecessor nodes.
   */
  function multiPredecessors(g) {
    return function(u) {
      var preds = [];
      g.inEdges(u).forEach(function(e) {
        preds.push(g.source(e));
      });
      return preds;
    };
  }

  /*
   * Same as `multiPredecessors(g)` but for successors.
   */
  function multiSuccessors(g) {
    return function(u) {
      var sucs = [];
      g.outEdges(u).forEach(function(e) {
        sucs.push(g.target(e));
      });
      return sucs;
    };
  }

  function sweep(g, iter, layering) {
    var i;
    if (iter % 2 === 0) {
      for (i = 1; i < layering.length; ++i) {
        sortLayer(layering[i], multiPredecessors(g), layerPos(layering[i-1]));
      }
    } else {
      for (i = layering.length - 2; i >= 0; --i) {
        sortLayer(layering[i], multiSuccessors(g), layerPos(layering[i+1]));
      }
    }
    return crossCount(g, layering);
  }

  /*
   * Given a list of nodes, a function that returns neighbors of a node, and
   * a mapping of the neighbor nodes to their weights, this function sorts
   * the node list by the barycenter calculated for each node.
   */
  function sortLayer(nodes, neighbors, weights) {
    var pos = layerPos(nodes);
    var bs = barycenters(nodes, neighbors, weights);

    var toSort = nodes.filter(function(u) { return bs[u] !== -1; });
    toSort.sort(function(x, y) {
      return bs[x] - bs[y] || pos[x] - pos[y];
    });

    for (var i = nodes.length - 1; i >= 0; --i) {
      if (bs[nodes[i]] !== -1) {
        nodes[i] = toSort.pop();
      }
    }
  }

  /*
   * Given a list of nodes, a function that returns neighbors of a node, and
   * a mapping of the neighbor nodes to their weights, this function returns
   * a mapping of the input nodes to their calculated barycenters. The
   * barycenter values are the average weights of all neighbors of the
   * node. If a node has no neighbors it is assigned a barycenter of -1.
   */
  function barycenters(nodes, neighbors, weights) {
    var bs = {}; // barycenters

    nodes.forEach(function(u) {
      var vs = neighbors(u);
      var b = -1;
      if (vs.length > 0)
        b = sum(vs.map(function(v) { return weights[v]; })) / vs.length;
      bs[u] = b;
    });

    return bs;
  }

  function copyLayering(layering) {
    return layering.map(function(l) { return l.slice(0); });
  }
};

var crossCount = dagre.layout.order.crossCount = function(g, layering) {
  var cc = 0;
  var prevLayer;
  layering.forEach(function(layer) {
    if (prevLayer) {
      cc += bilayerCrossCount(g, prevLayer, layer);
    }
    prevLayer = layer;
  });
  return cc;
};

/*
 * This function searches through a ranked and ordered graph and counts the
 * number of edges that cross. This algorithm is derived from:
 *
 *    W. Barth et al., Bilayer Cross Counting, JGAA, 8(2) 179–194 (2004)
 */
var bilayerCrossCount = dagre.layout.order.bilayerCrossCount = function(g, layer1, layer2) {
  var layer2Pos = layerPos(layer2);

  var indices = [];
  layer1.forEach(function(u) {
    var nodeIndices = [];
    g.outEdges(u).forEach(function(e) { nodeIndices.push(layer2Pos[g.target(e)]); });
    nodeIndices.sort(function(x, y) { return x - y; });
    indices = indices.concat(nodeIndices);
  });

  var firstIndex = 1;
  while (firstIndex < layer2.length) firstIndex <<= 1;

  var treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;

  var tree = [];
  for (var i = 0; i < treeSize; ++i) { tree[i] = 0; }

  var cc = 0;
  indices.forEach(function(i) {
    var treeIndex = i + firstIndex;
    ++tree[treeIndex];
    var weightSum = 0;
    while (treeIndex > 0) {
      if (treeIndex % 2) {
        cc += tree[treeIndex + 1];
      }
      treeIndex = (treeIndex - 1) >> 1;
      ++tree[treeIndex];
    }
  });

  return cc;
};

function layerPos(layer) {
  var pos = {};
  layer.forEach(function(u, i) { pos[u] = i; });
  return pos;
}
