var _ = require("lodash"),
    util = require("../util");

module.exports = {
  run: run,
  cleanup: cleanup
};

/*
 * A nesting graph creates dummy nodes for the tops and bottoms of subgraphs,
 * adds appropriate edges to ensure that all cluster nodes are placed between
 * these boundries, and ensures that the graph is connected.
 *
 * In addition we ensure, through the use of the minlen property, that nodes
 * and subgraph border nodes to not end up on the same rank.
 *
 * Preconditions:
 *
 *    1. Input graph is a DAG
 *    2. Nodes in the input graph has a minlen attribute
 *
 * Postconditions:
 *
 *    1. Input graph is connected.
 *    2. Dummy nodes are added for the tops and bottoms of subgraphs.
 *    3. The minlen attribute for nodes is adjusted to ensure nodes do not
 *       get placed on the same rank as subgraph border nodes.
 *
 * The nesting graph idea comes from Sander, "Layout of Compound Directed
 * Graphs."
 */
function run(g) {
  var root = util.addDummyNode(g, {}, "_root"),
      nodeSep = 2 * treeHeight(g) - 1;

  g.getGraph().nestingRoot = root;

  // Multiply minlen by nodeSep to align nodes on non-border ranks.
  _.each(g.edges(), function(e) { g.getEdge(e).minlen *= nodeSep; });

  // Create border nodes and link them up
  _.each(g.getChildren(), function(child) { dfs(g, root, nodeSep, child); });
}

function dfs(g, root, nodeSep, v) {
  var children = g.getChildren(v);
  if (!children.length) {
    if (v !== root) {
      g.setEdge(root, v, { weight: 0, minlen: nodeSep });
    }
    return;
  }

  var top = util.addDummyNode(g, { width: 0, height: 0 }, "_bt"),
      bottom = util.addDummyNode(g, { width: 0, height: 0 }, "_bb"),
      label = g.getNode(v);

  g.setParent(top, v);
  label.borderTop = top;
  g.setParent(bottom, v);
  label.borderBottom = bottom;

  _.each(children, function(child) {
    dfs(g, root, nodeSep, child);

    var childNode = g.getNode(child),
        childTop = childNode.borderTop ? childNode.borderTop : child,
        childBottom = childNode.borderBottom ? childNode.borderBottom : child;

    g.setEdge(top, childTop, { weight: 0, minlen: 1, nestingEdge: true });
    g.setEdge(childBottom, bottom, { weight: 0, minlen: 1, nestingEdge: true });
  });

  if (!g.getParent(v)) {
    g.setEdge(root, top, { weight: 0, minlen: 1 });
  }
}

function treeHeight(g) {
  function dfs(v, height) {
    var children = g.getChildren(v);
    if (children && children.length) {
      var heights = _.map(children, function(child) {
        return dfs(child, height + 1);
      });
      return _.max(heights);
    }
    return height;
  }

  return dfs(undefined, 0);
}

function cleanup(g) {
  var graphLabel = g.getGraph();
  g.removeNode(graphLabel.nestingRoot);
  delete graphLabel.nestingRoot;
  _.each(g.edges(), function(e) {
    var edge = g.getEdge(e);
    if (edge.nestingEdge) {
      g.removeEdge(e);
    }
  });
}
