dagre.layout.order = function() {
  // External configuration
  var
    // Maximum number of passes to make
    iterations = 24,

    // Level 1: log time spent and best cross count found
    // Level 2: log cross count on each iteration
    debugLevel = 0;

  var self = {};

  self.iterations = function(x) {
    if (!arguments.length) return iterations;
    iterations = x;
    return self;
  }

  self.debugLevel = function(x) {
    if (!arguments.length) return debugLevel;
    debugLevel = x;
    return self;
  }

  self.run = function(g) {
    var timer = createTimer();

    var layering = initOrder(g);
    var bestLayering = copyLayering(layering);
    var bestCC = crossCount(g, layering);

    if (debugLevel >= 2) {
      console.log("Order phase start cross count: " + bestCC);
    }

    var cc;
    for (var i = 0; i < iterations; ++i) {
      cc = barycenterLayering(g, i, layering);
      if (cc < bestCC) {
        bestLayering = copyLayering(layering);
        bestCC = cc;
      }
      if (debugLevel >= 2) {
        console.log("Order phase iter " + i + " cross count: " + bestCC);
      }
    }

    bestLayering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        g.node(u).order = i;
      });
    });

    if (debugLevel >= 1) {
      console.log("Order phase time: " + timer.elapsedString());
      console.log("Order phase best cross count: " + bestCC);
    }

    return bestLayering;
  }

  return self;

  function initOrder(g) {
    var layering = [];
    g.eachNode(function(n, a) {
      var layer = layering[a.rank];
      if (!layer) layer = layering[a.rank] = [];
      layer.push(n);
    });
    return layering;
  }

  function barycenterLayering(g, i, layering) {
    var cc = 0;
    if (i % 2 === 0) {
      for (var j = 1; j < layering.length; ++j) {
        cc += barycenterLayer(g, layering[j - 1], layering[j], "inEdges");
      }
    } else {
      for (var j = layering.length - 2; j >= 0; --j) {
        cc += barycenterLayer(g, layering[j + 1], layering[j], "outEdges");
      }
    }
    return cc;
  }

  /*
   * Given a fixed layer and a movable layer in a graph this function will
   * attempt to find an improved ordering for the movable layer such that
   * edge crossings may be reduced.
   *
   * This algorithm is based on the barycenter method.
   */
  function barycenterLayer(g, fixed, movable, neighbors) {
    var weights = rankWeights(g, fixed, movable, neighbors);

    var toSort = [];

    movable.forEach(function(u, i) {
      var weight = weights[u];
      if (weight !== -1) {
        toSort.push({node: u, weight: weight, pos: i});
      }
    });

    toSort.sort(function(x, y) {
      var d = x.weight - y.weight;
      if (d === 0) {
        return x.pos - y.pos;
      }
      return d;
    });

    var toSortIndex = 0;
    for (var i = 0; i < movable.length; ++i) {
      var u = movable[i];
      var weight = weights[u];
      if (weight !== -1) {
        movable[i] = toSort[toSortIndex++].node;
      }
    }

    return neighbors === "inEdges"
      ? bilayerCrossCount(g, fixed, movable)
      : bilayerCrossCount(g, movable, fixed);
  }

  /*
   * Given a fixed layer and a movable layer in a graph, this function will
   * return weights for the movable layer that can be used to reorder the layer
   * for potentially reduced edge crossings.
   */
  function rankWeights(g, fixed, movable, neighbors) {
    var fixedPos = {};
    fixed.forEach(function(u, i) { fixedPos[u] = i; });

    var weights = {};
    movable.forEach(function(u) {
      var weight = -1;
      var edges = g[neighbors](u);
      if (edges.length > 0) {
        weight = 0;
        edges.forEach(function(e) {
          var source = g.source(e);
          var neighborId = g.source(e) === u ? g.target(e) : source;
          weight += fixedPos[neighborId];
        });
        weight = weight / edges.length;
      }
      weights[u] = weight;
    });

    return weights;
  }

  function copyLayering(layering) {
    return layering.map(function(l) { return l.slice(0); });
  }
}

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
}

/*
 * This function searches through a ranked and ordered graph and counts the
 * number of edges that cross. This algorithm is derived from:
 *
 *    W. Barth et al., Bilayer Cross Counting, JGAA, 8(2) 179–194 (2004)
 */
var bilayerCrossCount = dagre.layout.order.bilayerCrossCount = function(g, layer1, layer2, weightFunc) {
  if (!weightFunc) { weightFunc = function() { return 1; }; }

  var layer2Pos = {};
  layer2.forEach(function(u, i) { layer2Pos[u] = i; });

  var edges = [];
  layer1.forEach(function(u) {
    var nodeEdges = [];
    g.outEdges(u).forEach(function(e) {
      nodeEdges.push({ edge: e, pos: layer2Pos[g.target(e)] });
    });
    // TODO consider radix sort
    nodeEdges.sort(function(x, y) { return x.pos - y.pos; });
    edges = edges.concat(nodeEdges);
  });

  var firstIndex = 1;
  while (firstIndex < layer2.length) {
    firstIndex <<= 1;
  }

  var treeSize = 2 * firstIndex - 1;
  firstIndex -= 1;

  var tree = [];
  for (var i = 0; i < treeSize; ++i) { tree[i] = 0; }

  var cc = 0;
  edges.forEach(function(edge) {
    var edgeWeight = weightFunc(edge.edge);
    var treeIndex = edge.pos + firstIndex;
    tree[treeIndex] += edgeWeight;
    var weightSum = 0;
    while (treeIndex > 0) {
      if (treeIndex % 2) {
        weightSum += tree[treeIndex + 1];
      }
      treeIndex = (treeIndex - 1) >> 1;
      tree[treeIndex] += edgeWeight;
    }
    cc += edgeWeight * weightSum;
  });

  return cc;
}
