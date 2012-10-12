dagre.layout.order = (function() {
  function crossCount(layering) {
    var cc = 0;
    var prevLayer;
    layering.forEach(function(layer) {
      if (prevLayer) {
        cc += bilayerCrossCount(prevLayer, layer);
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
  function bilayerCrossCount(layer1, layer2) {
    var layer2Pos = {};
    layer2.forEach(function(u, i) { layer2Pos[u.id()] = i; });

    var edgeIndices = [];
    layer1.forEach(function(u) {
      var nodeEdges = [];
      u.outEdges().forEach(function(e) {
        nodeEdges.push(layer2Pos[e.head().id()]);
      });
      // TODO consider radix sort
      nodeEdges.sort(function(x, y) { return x - y; });
      edgeIndices = edgeIndices.concat(nodeEdges);
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
    edgeIndices.forEach(function(i) {
      var treeIndex = i + firstIndex;
      tree[treeIndex]++;
      while (treeIndex > 0) {
        if (treeIndex % 2) {
          cc += tree[treeIndex + 1];
        }
        treeIndex = (treeIndex - 1) >> 1;
        tree[treeIndex]++;
      }
    });

    return cc;
  }

  function initOrder(g) {
    var layering = [];
    var visited = {};

    function dfs(u) {
      if (u.id() in visited) {
        return;
      }
      visited[u.id()] = true;

      var rank = u.attrs.rank;
      for (var i = layering.length; i <= rank; ++i) {
        layering[i] = [];
      }
      layering[rank].push(u);

      u.neighbors().forEach(function(v) {
        dfs(v);
      });
    }

    g.nodes().forEach(function(u) {
      if (u.attrs.rank === 0) {
        dfs(u);
      }
    });

    return layering;
  }

  function improveOrdering(i, layering) {
    layering = layering.slice(0);
    if (i % 2 === 0) {
      for (var j = 1; j < layering.length; ++j) {
        improveRank(layering[j - 1], layering[j], "inEdges");
      }
    } else {
      for (var j = layering.length - 2; j >= 0; --j) {
        improveRank(layering[j + 1], layering[j], "outEdges");
      }
    }
    return layering;
  }

  /*
   * Given a fixed layer and a movable layer in a graph this function will
   * attempt to find an improved ordering for the movable layer such that
   * edge crossings may be reduced.
   *
   * This algorithm is based on the barycenter method.
   */
  function improveRank(fixed, movable, neighbors) {
    var weights = rankWeights(fixed, movable, neighbors);

    var toSort = [];

    movable.forEach(function(u) {
      var weight = weights[u.id()];
      if (weight !== -1) {
        toSort.push({node: u, weight: weight});
      }
    });

    toSort.sort(function(x, y) { return x.weight - y.weight; });

    var toSortIndex = 0;
    for (var i = 0; i < movable.length; ++i) {
      var u = movable[i];
      var weight = weights[u.id()];
      if (weight !== -1) {
        movable[i] = toSort[toSortIndex++].node;
      }
    }
  }

  /*
   * Given a fixed layer and a movable layer in a graph, this function will
   * return weights for the movable layer that can be used to reorder the layer
   * for potentially reduced edge crossings.
   */
  function rankWeights(fixed, movable, neighbors) {
    var fixedPos = {};
    fixed.forEach(function(u, i) { fixedPos[u.id()] = i; });

    var weights = {};
    movable.forEach(function(u) {
      var weight = -1;
      var edges = u[neighbors]();
      if (edges.length > 0) {
        weight = 0;
        edges.forEach(function(e) {
          var neighborId = e.tail().id() === u.id() ? e.head().id() : e.tail().id();
          weight += fixedPos[neighborId];
        });
        weight = weight / edges.length;
      }
      weights[u.id()] = weight;
    });

    return weights;
  }

  return function(g) {
    // TODO make this configurable
    var MAX_ITERATIONS = 24;
    
    var layering = initOrder(g);
    var bestLayering = layering;
    var bestCC = crossCount(layering);

    var cc;
    for (var i = 0; i < MAX_ITERATIONS; ++i) {
      layering = improveOrdering(i, layering);
      cc = crossCount(layering);
      if (cc < bestCC) {
        bestLayering = layering;
        bestCC = cc;
      }
    }

    return bestLayering;
  }
})();
