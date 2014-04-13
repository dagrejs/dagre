var util = require('../util');

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
    var children = g.children(u),
        topIdGen = util.idGen('_ct-' + u),
        bottomIdGen = util.idGen('_cb-' + u);

    if (children.length) {
      children.forEach(function(v) { dfs(v); });

      var value;
      if (u !== null) {
        value = g.node(u);
      } else {
        value = g.graph();
      }

      var depth = u === null ? -1 : value.treeDepth,
          top = g.addNode(topIdGen(), { width: 0, height: 0, nestingGraphTop: true, dummy: true }),
          bottom = g.addNode(bottomIdGen(), { width: 0, height: 0, nestingGraphBottom: true, dummy: true });
      g.parent(top, u);
      g.parent(bottom, u);
      value.borderNodeTop = top;
      value.borderNodeBottom = bottom;

      children.forEach(function(v) {
        var minLen = height - depth + 1,
            childTop = v,
            childBottom = v;
        if (g.children(v).length) {
          minLen = u === null ? height + g.node(v).treeDepth : 1;
          childTop = g.node(v).borderNodeTop;
          childBottom = g.node(v).borderNodeBottom;
        }

        g.addEdge(topIdGen(), top, childTop, { minLen: minLen, nestingEdge: true });
        g.addEdge(bottomIdGen(), childBottom, bottom, { minLen: minLen, nestingEdge: true });
      });
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
  g.delNode(g.graph().borderNodeTop);
  g.delNode(g.graph().borderNodeBottom);
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
