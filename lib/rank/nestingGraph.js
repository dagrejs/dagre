exports.augment = augment;
exports.removeEdges = removeEdges;
exports.removeEmptyLayers = removeEmptyLayers;

/*
 * The concept of a nesting graph comes from Sander, "Layout of Compound
 * Directed Graphs". The idea is to add new "border nodes" at the top and
 * bottom of each cluster. This serves to define a portion of the bounding box
 * for the cluster. We also add edges between the top and bottom border nodes
 * and any nodes or clusters contained within it. This ensures that all
 * children are contained within the cluster's border.
 *
 * We do not want regular (or base) nodes to be at the same level as border
 * nodes because the latter should be much smaller than the former. Sander
 * proposes to place base nodes at levels in 2k + 1, where k is the height of
 * the tree.
 *
 * We currently do not support cluster to cluster edges with this algorithm.
 *
 * This algorithm expects as input a directed graph with each edge having a
 * `minLen` attribute. It updates the graph by adding edges as described above
 * and by lengthening existing edges to ensure that base nodes and border nodes
 * are never at the same level.
 */
function augment(g) {
  var height = treeHeight(g) - 1;

  g.eachEdge(function(e, u, v, value) {
    value.minLen *= 2 * height + 1;
  });

  function dfs(u) {
    var children = g.children(u);

    if (children.length) {
      children.forEach(function(v) { dfs(v); });

      // Add a top and bottom border for clusters (except the root graph)
      if (u !== null) {
        var top = g.addNode(null, { width: 0, height: 0 }),
            bottom = g.addNode(null, { width: 0, height: 0 }),
            value = g.node(u),
            depth = value.treeDepth;
        g.parent(top, u);
        g.parent(bottom, u);
        value.borderNodeTop = top;
        value.borderNodeBottom = bottom;

        children.forEach(function(v) {
          var minLen = g.children(v).length ? 1 : height - depth + 1;
          g.addEdge(null, top, v, { minLen: minLen, nestingEdge: true });
          g.addEdge(null, v, bottom, { minLen: minLen, nestingEdge: true });
        });
      }
    }
  }

  dfs(null);
}

/*
 * This function removes any nesting edges that were added with the `augment`
 * function.
 */
function removeEdges(g) {
  g.eachEdge(function(e, u, v, value) {
    if (value.nestingEdge) {
      g.delEdge(e);
    }
  });
}

function removeEmptyLayers(g) {
  var height = treeHeight(g) - 1;

  var layers = [];
  g.eachNode(function(u, value) {
    if (!(value.rank in layers)) {
      layers[value.rank] = [u];
    } else {
      layers[value.rank].push(u);
    }
  });

  for (var i = 0, il = layers.length, j = 0; i < il; ++i) {
    var layer = layers[i];
    if (layer) {
      for (var k = 0, kl = layer.length; k < kl; ++k) {
        g.node(layer[k]).rank = j;
      }
      ++j;
    } else if (i % (2 * height + 1) === 0) {
      ++j;
    }
  }
}

/*
 * Return the height of the given tree and augments each compound node with
 * its depth.
 */
function treeHeight(g) {
  function dfs(u, height) {
    var children = g.children(u);
    if (children.length === 0) {
      return height;
    } else {
      if (u !== null) {
        g.node(u).treeDepth = height;
      }
      return Math.max.apply(Math,
                            children.map(function(v) { return dfs(v, height + 1); }));
    }
  }
  return dfs(null, 0);
}
