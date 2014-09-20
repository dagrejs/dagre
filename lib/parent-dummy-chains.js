var _ = require("lodash");

module.exports = parentDummyChains;

function parentDummyChains(g) {
  _.each(g.getGraph().dummyChains, function(v) {
    var node = g.getNode(v),
        edgeObj = node.edgeObj,
        stack,
        parent = g.getParent(edgeObj.v),
        parentNode;

    for (; v !== edgeObj.w; v = g.successors(v)[0], node = g.getNode(v)) {
      // !stack means we're traversing up the ancestors of v
      if (!stack) {
        for (parentNode = g.getNode(parent);
             !_.isUndefined(parent) && parentNode.maxRank < node.rank;
             parent = g.getParent(parent), parentNode = g.getNode(parent));
        if (!parent) {
          stack = [];
          parent = edgeObj.w;
          while (!_.isUndefined(parent = g.getParent(parent))) {
            stack.push({ v: parent, minRank: g.getNode(parent).minRank });
          }
        }
      }

      // Are we traversing down the ancestors of w?
      if (stack) {
        while (stack.length && _.last(stack).minRank <= node.rank) {
          parent = stack.pop().v;
        }
      }

      g.setParent(v, parent);
    }
  });
}
