var _ = require("lodash"),
    rankUtil = require("./util");

module.exports = networkSimplex;

// Expose some internals for testing purposes
networkSimplex.assignLowLim = assignLowLim;
networkSimplex.calcCutValue = calcCutValue;
networkSimplex.leaveEdge = leaveEdge;
networkSimplex.enterEdge = enterEdge;
networkSimplex.exchange = exchange;

/*
 * The network simplex algorithm assigns ranks to each node in the input graph
 * and iteratively improves the ranking to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minlen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "rank" attribute that
 *       has been optimized by the network simplex algorithm.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial ranks to each node. We use the longest path algorithm,
 *       which assigns ranks to the lowest position possible. In general this
 *       leads to very wide bottom ranks and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minlen for the edge). This by itself greatly improves the assigned
 *       rankings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 */
function networkSimplex() {
}

function calcCutValue(tree, g, child) {
  var childLab = tree.getNode(child),
      parent = childLab.parent,
      // True if the child is on the tail end of the edge in the directed graph
      childIsTail = true,
      // The graph's view of the tree edge we're inspecting
      graphEdge = g.getEdge(child, parent),
      // The accumulated cut value for the edge between this node and its parent
      cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g.getEdge(parent, child);
  }

  cutValue = graphEdge.weight;

  _.each(g.nodeEdges(child), function(edge) {
    var isOutEdge = edge.v === child,
        other = isOutEdge ? edge.w : edge.v;

    if (other !== parent) {
      var pointsToHead = isOutEdge === childIsTail,
          otherWeight = edge.label.weight;

      cutValue += pointsToHead ? otherWeight : -otherWeight;
      if (isTreeEdge(tree, child, other)) {
        var otherCutValue = tree.getEdge(child, other).cutvalue;
        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
      }
    }
  });

  return cutValue;
}

function assignLowLim(tree, root) {
  postorder(tree, {}, 1, root);
}

// Updates the low and lim numbers for nodes under the root.
function updateLowLim(tree, root) {
  var rootLabel = tree.getNode(root),
      parent = rootLabel.parent,
      visited = {};
  visited[parent] = true;
  postorder(tree, visited, rootLabel.low, root, parent);
}

function postorder(tree, visited, nextLim, v, parent) {
  var low = nextLim,
      label = tree.getNode(v);

  visited[v] = true;
  _.each(tree.neighbors(v), function(w) {
    if (!_.has(visited, w)) {
      nextLim = postorder(tree, visited, nextLim, w, v);
    }
  });

  label.low = low;
  label.lim = nextLim++;
  if (parent) {
    label.parent = parent;
  }

  return nextLim;
}


function leaveEdge(tree) {
  return _.find(tree.edges(), function(edge) {
    return edge.label.cutvalue < 0;
  });
}

function enterEdge(tree, g, edge) {
  var v = edge.v,
      w = edge.w,
      vLabel = tree.getNode(v),
      wLabel = tree.getNode(w),
      tailLabel = vLabel,
      flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if (vLabel.lim > wLabel.lim) {
    tailLabel = wLabel;
    flip = true;
  }

  var candidates = _.filter(g.edges(), function(edge) {
    return flip === isDescendant(tree, tree.getNode(edge.v), tailLabel) &&
           flip !== isDescendant(tree, tree.getNode(edge.w), tailLabel);
  });

  return _.min(candidates, function(edge) { return rankUtil.slack(g, edge); });
}

function exchange(tree, g, e, f) {
  var v = e.v,
      w = e.w,
      lca = findLCA(tree, v, w);
  tree.removeEdge(v, w);
  tree.setEdge(f.v, f.w, {});
  updateLowLim(tree, lca);
  updateCutValues(tree, g, v, lca);
  updateCutValues(tree, g, w, lca);
}

function updateCutValues(tree, g, v, lca) {
  var parent;
  while (v !== lca) {
    parent = tree.getNode(v).parent;
    tree.getEdge(v, parent).cutvalue = calcCutValue(tree, g, v);
    v = parent;
  }
}

function findLCA(tree, v, w) {
  var vLabel = tree.getNode(v),
      wLabel = tree.getNode(w),
      low = Math.min(vLabel.low, wLabel.low),
      lim = Math.max(vLabel.lim, wLabel.lim),
      lca = v,
      lcaLabel = vLabel;
  while (lcaLabel.low > low || lcaLabel.lim < lim) {
    lca = lcaLabel.parent;
    lcaLabel = tree.getNode(lca);
  }
  return lca;
}

/*
 * Returns true if the edge is in the tree.
 */
function isTreeEdge(tree, u, v) {
  return tree.hasEdge(u, v);
}

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
function isDescendant(tree, vLabel, rootLabel) {
  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
}
