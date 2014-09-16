var _ = require("lodash"),
    addBorderNode = require("./util").addBorderNode,
    buildLayerMatrix = require("./util").buildLayerMatrix;

module.exports = {
  run: addBorderSegments,
  getPostorderNumbers: getPostorderNumbers,
  findLCA: findLCA
};

function addBorderSegments(g) {
  var postorder = getPostorderNumbers(g);

  _.each(buildLayerMatrix(g), function(layer, rank) {
    var order = 0,
        stack = [];

    function addBorderNodes(v) {
      var lca = findLCA(g, v, _.last(stack), postorder),
          curr;

      // Close out subgraphs by creating a right border as needed.
      while ((curr = _.last(stack)) !== lca) {
        addBorderSegment(g, curr, rank, order++, "borderRight", "_br");
        stack.pop();
      }

      // Open new subgraphs by creating a left border as needed.
      var tmpStack = [];
      for (curr = g.getParent(v); curr !== lca; curr = g.getParent(curr)) {
        tmpStack.push(curr);
      }
      for (curr = tmpStack.pop(); !_.isUndefined(curr); curr = tmpStack.pop()) {
        addBorderSegment(g, curr, rank, order++, "borderLeft", "_bl");
        stack.push(curr);
      }
    }

    _.each(layer, function(v) {
      addBorderNodes(v);
      g.getNode(v).order = order++;
    });

    addBorderNodes();
  });
}

function addBorderSegment(g, v, rank, order, attr, prefix) {
  var node = g.getNode(v),
      prev = node[attr];
  node[attr] = addBorderNode(g, prefix, rank, order);
  if (prev) {
    g.setEdge(prev, node[attr]);
  }
}

/*
 * Finds the lowest common ancestor (LCA) of two nodes in the postorder set or
 * returns undefined if no LCA can be found.
 */
function findLCA(g, v, w, postorder) {
  if (!_.isUndefined(v) && !_.isUndefined(w)) {
    var low = Math.min(postorder[v].low, postorder[w].low),
        lim = Math.max(postorder[v].lim, postorder[w].lim);
    while (!_.isUndefined(v) && (postorder[v].low > low || lim > postorder[v].lim)) {
      v = g.getParent(v);
    }
    return v;
  }
}

/*
 * Return a mapping of node to its postorder number and the least postorder
 * number of any of idts descendants.
 */
function getPostorderNumbers(g) {
  var result = {},
      lim = 0;

  function dfs(v) {
    var children = g.getChildren(v),
        low = lim;
    if (children.length) {
      low = _.min(_.map(children, dfs));
    }
    result[v] = { low: low, lim: lim++ };
    return low;
  }

  _.each(g.getChildren(), dfs);
  return result;
}

