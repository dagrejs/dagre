var util = require('../util'),
    initCutValues = require('./simplex/initCutValues'),
    rankUtil = require('./rankUtil');

module.exports = simplex;

function simplex(graph, spanningTree) {
  // The network simplex algorithm repeatedly replaces edges of
  // the spanning tree with negative cut values until no such
  // edge exists.
  initCutValues(graph, spanningTree);
  computeLowLim(spanningTree);
  while (true) {
    var e = leaveEdge(spanningTree);
    if (e === null) break;
    var f = enterEdge(graph, spanningTree, e);
    exchange(graph, spanningTree, e, f);
  }
}

/*
 * Return an edge from the tree with a negative cut value, or null if there
 * is none.
 */
function leaveEdge(tree) {
  var edges = tree.edges();
  for (var n in edges) {
    var e = edges[n];
    var treeValue = tree.edge(e);
    if (treeValue.cutValue < 0) {
      return e;
    }
  }
  return null;
}

/*
 * The edge e should be an edge in the tree, with an underlying edge
 * in the graph, with a negative cut value.  Of the two nodes incident
 * on the edge, take the lower one.  enterEdge returns an edge with
 * minimum slack going from outside of that node's subtree to inside
 * of that node's subtree.
 */
function enterEdge(graph, tree, e) {
  var source = tree.source(e);
  var target = tree.target(e);
  var lower = tree.node(target).lim < tree.node(source).lim ? target : source;

  // Is the tree edge aligned with the graph edge?
  var aligned = !tree.edge(e).reversed;

  var minSlack = Number.POSITIVE_INFINITY;
  var minSlackEdge;
  if (aligned) {
    graph.eachEdge(function(id, u, v, value) {
      if (id !== e && inSubtree(tree, u, lower) && !inSubtree(tree, v, lower)) {
        var slack = rankUtil.slack(graph, u, v, value.minLen);
        if (slack < minSlack) {
          minSlack = slack;
          minSlackEdge = id;
        }
      }
    });
  } else {
    graph.eachEdge(function(id, u, v, value) {
      if (id !== e && !inSubtree(tree, u, lower) && inSubtree(tree, v, lower)) {
        var slack = rankUtil.slack(graph, u, v, value.minLen);
        if (slack < minSlack) {
          minSlack = slack;
          minSlackEdge = id;
        }
      }
    });
  }

  if (minSlackEdge === undefined) {
    /* This commented code is helpful for debug
    var outside = [];
    var inside = [];
    graph.eachNode(function(id) {
      if (!inSubtree(tree, id, lower)) {
        outside.push(id);
      } else {
        inside.push(id);
      }
    });
    */
    throw new Error('No edge found from outside of tree to inside');
  }

  return minSlackEdge;
}

/*
 * Replace edge e with edge f in the tree, recalculating the tree root,
 * the nodes' low and lim properties and the edges' cut values.
 */
function exchange(graph, tree, e, f) {
  tree.delEdge(e);
  var source = graph.source(f);
  var target = graph.target(f);

  // Redirect edges so that target is the root of its subtree.
  function redirect(v) {
    var edges = tree.inEdges(v);
    for (var i in edges) {
      var e = edges[i];
      var u = tree.source(e);
      var value = tree.edge(e);
      redirect(u);
      tree.delEdge(e);
      value.reversed = !value.reversed;
      tree.addEdge(e, v, u, value);
    }
  }

  redirect(target);

  var root = source;
  var edges = tree.inEdges(root);
  while (edges.length > 0) {
    root = tree.source(edges[0]);
    edges = tree.inEdges(root);
  }

  tree.graph().root = root;

  tree.addEdge(null, source, target, {cutValue: 0});

  initCutValues(graph, tree);

  computeLowLim(tree);

  adjustRanks(graph, tree);
}

/*
 * Reset the ranks of all nodes based on the current spanning tree.
 * The rank of the tree's root remains unchanged, while all other
 * nodes are set to the sum of minimum length constraints along
 * the path from the root.
 */
function adjustRanks(graph, tree) {
  function dfs(p) {
    var children = tree.successors(p);
    children.forEach(function(c) {
      var minLen = minimumLength(graph, p, c);
      graph.node(c).rank = graph.node(p).rank + minLen;
      dfs(c);
    });
  }

  dfs(tree.graph().root);
}

/*
 * If u and v are connected by some edges in the graph, return the
 * minimum length of those edges, as a positive number if v succeeds
 * u and as a negative number if v precedes u.
 */
function minimumLength(graph, u, v) {
  var outEdges = graph.outEdges(u, v);
  if (outEdges.length > 0) {
    return util.max(outEdges.map(function(e) {
      return graph.edge(e).minLen;
    }));
  }

  var inEdges = graph.inEdges(u, v);
  if (inEdges.length > 0) {
    return -util.max(inEdges.map(function(e) {
      return graph.edge(e).minLen;
    }));
  }
}

/*
 * Return whether n is a node in the subtree with the given
 * root.
 */
function inSubtree(tree, n, root) {
  return (tree.node(root).low <= tree.node(n).lim &&
          tree.node(n).lim <= tree.node(root).lim);
}

/*
 * Perform a DFS postorder traversal, labeling each node v with
 * its traversal order 'lim(v)' and the minimum traversal number
 * of any of its descendants 'low(v)'.  This provides an efficient
 * way to test whether u is an ancestor of v since
 * low(u) <= lim(v) <= lim(u) if and only if u is an ancestor.
 */
function computeLowLim(tree) {
  var postOrderNum = 0;
  
  function dfs(n) {
    var children = tree.successors(n);
    var low = postOrderNum;
    for (var c in children) {
      var child = children[c];
      dfs(child);
      low = Math.min(low, tree.node(child).low);
    }
    tree.node(n).low = low;
    tree.node(n).lim = postOrderNum++;
  }

  dfs(tree.graph().root);
}

