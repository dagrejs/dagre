var util = require("../util"),
    components = require("graphlib").alg.components,
    PriorityQueue = require("graphlib").data.PriorityQueue,
    Set = require("graphlib").data.Set,
    Digraph = require("graphlib").Digraph;

module.exports = function(g, debugLevel) {
  var timer = util.createTimer(debugLevel >= 1);
  timer.wrap("Rank phase", function() {
    initRank(g);

    components(g).forEach(function(cmpt) {
      var subgraph = g.subgraph(cmpt);
      var tree = feasibleTree(subgraph);
      console.log("Feasible tree: " + JSON.stringify(tree, null, 4));
      while (true) {
        var e = leaveEdge(tree);
        if (e == null) break;
        var f = enterEdge(subgraph, tree, e);
        exchange(g, tree, e, f);
        console.log("New feasible tree: " + JSON.stringify(tree, null, 4));
      }
      normalize(subgraph);
      // balance(subgraph);
    });
  })();
};

function initRank(g) {
  var minRank = {};
  var pq = new PriorityQueue();

  g.eachNode(function(u) {
    pq.add(u, g.inEdges(u).length);
    minRank[u] = 0;
  });

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error("Input graph is not acyclic: " + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(function(e) {
      var target = g.target(e);
      minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
      pq.decrease(target, pq.priority(target) - 1);
    });
  }
}

function feasibleTree(g) {
  var remaining = new Set(g.nodes()),
      minLen = [], // Array of {u, v, len}
      tree = new Digraph();

  // Collapse multi-edges and precompute the minLen, which will be the
  // max value of minLen for any edge in the multi-edge.
  var minLenMap = {};
  g.eachEdge(function(e, u, v, edge) {
    var id = incidenceId(u, v);
    if (!(id in minLenMap)) {
      minLen.push(minLenMap[id] = { u: u, v: v, len: 1 });
    }
    minLenMap[id].len = Math.max(minLenMap[id].len, edge.minLen || 1);
  });

  function slack(mle /* minLen entry*/) {
    return Math.abs(g.node(mle.u).rank - g.node(mle.v).rank) - mle.len;
  }

  // Remove arbitrary node - it is effectively the root of the spanning tree.
  var root = g.nodes()[0];
  remaining.remove(root);
  var nodeVal = g.node(root);
  nodeVal.depth = 0;
  tree.addNode(root, nodeVal);
  tree.graph({root: root});

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var result,
        eSlack = Number.POSITIVE_INFINITY;
    minLen.forEach(function(mle /* minLen entry */) {
      if (remaining.has(mle.u) !== remaining.has(mle.v)) {
        var mleSlack = slack(mle);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = { mle: mle, treeNode: mle.u, graphNode: mle.v, len: mle.len};
          } else {
            result = { mle: mle, treeNode: mle.v, graphNode: mle.u, len: -mle.len };
          }
          eSlack = mleSlack;
        }
      }
    });

    return result;
  }

  while (remaining.size() > 0) {
    var result = findMinSlack();
    var nodeVal = g.node(result.graphNode);
    remaining.remove(result.graphNode);
    tree.addNode(result.graphNode, nodeVal);
    tree.addEdge(null, result.treeNode, result.graphNode, {});
    nodeVal.rank = g.node(result.treeNode).rank + result.len;
    nodeVal.depth = g.node(result.treeNode).depth + 1;
  }

  initCutValues(g, tree);

  return tree;
}

function initCutValues(graph, spanningTree) {
  // Visit each edge (U -> V) of the graph.  Compute the nearest
  // common ancestor A of U and V in the spanning tree.  The edge
  // (U -> V) affects the cut value of an edge iff it is on the
  // path from A to U or A to V.
  spanningTree.eachEdge(function(id, u, v, treeValue) {
    treeValue.cutValue = 0;
  });
  graph.eachEdge(function(id, u, v, value) {
    var ancestor = commonAncestor(spanningTree, u, v);
    eachEdgeFrom(spanningTree, ancestor, u, function(id, s, t, treeValue) {
      // The edge (S -> T) in the tree may be (S -> T) or (T -> S) in
      // the graph.
      if (graph.successors(s).indexOf(t) != -1) {
        // Graph edge is (S -> T), so S (and V) are in the head and
        // T (and U) are in the tail.
        treeValue.cutValue -= 1;
      } else {
        // Graph edge is (T -> S), so T (and U) are in the head and
        // S (and V) are in the tail.
        treeValue.cutValue += 1;
      }
    });
    eachEdgeFrom(spanningTree, ancestor, v, function(id, s, t, treeValue) {
      if (graph.successors(s).indexOf(t) != -1) {
        // Graph edge is (S -> T), so S (and U) are in the head and
        // T (and V) are in the tail.
        treeValue.cutValue += 1;
      } else {
        // Graph edge is (T -> S), so T (and V) are in the head and
        // S (and U) are in the tail.
        treeValue.cutValue -= 1;
      }
    });
  });
}

// Nodes u and v are ids of nodes in the tree.  Return the id of their
// nearest common ancestor.
function commonAncestor(tree, u, v) {
  if (u === v) {
    return u;
  }
  var uDepth = tree.node(u).depth;
  var vDepth = tree.node(v).depth;
  if (uDepth > vDepth) {
    return commonAncestor(tree, tree.predecessors(u)[0], v);
  } else {
    return commonAncestor(tree, u, tree.predecessors(v)[0]);
  }
}

// Nodes u and v are ids of nodes in the tree, with u an ancestor of v.
// Invoke function func on each edge of the path from u to v.
function eachEdgeFrom(tree, u, v, func) {
  while (u !== v) {
    var e = tree.inEdges(v)[0];
    func(e, tree.source(e), tree.target(e), tree.edge(e));
    v = tree.source(e);
  }
}

// Return an edge from the tree with a negative cut value, or null if there
// is none.
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

// The edge e should be an edge in the tree, with an underlying edge
// in the graph, with a negative cut value.  It divides the tree into
// a head and a tail set.  enterEdge returns a new edge of the graph
// from the head to the tail with minimum slack.
function enterEdge(graph, tree, e) {
  var source = tree.source(e);
  var target = tree.target(e);
  // The head set is connected (in the tree) to the source, while the
  // tail set is connected to the target.
  var head = new Set();
  var tail = new Set();
  var reverse = false;
  var higher = source;
  var lower = target;
  if (tree.node(source).depth > tree.node(target).depth) {
    higher = target;
    lower = source;
    reverse = true;
  }

  // Perform a DFS traversal of the tree.
  // Collect nodes into the head component until we see the higher node, then
  // switch to the tail component while in that sub-part of the tree.
  var component = head;

  function dfs(node) {
    component.add(node);
    if (node === higher) {
      component = tail;
    }
    var children = tree.successors(node);
    for (var c in children) {
      var child = children[c];
      dfs(child);
    }
    if (node === higher) {
      component = head;
    }
  }

  dfs(tree.graph().root);

  if (reverse) {
    // Swap head and tail because the edge being removed was from reversed
    // in the spanning tree.
    var tmp = head;
    head = tail;
    tail = tmp;
  }

  // Find a minimum slack edge from head to tail.
  var minSlack = Number.POSITIVE_INFINITY;
  var minSlackEdge;
  graph.eachEdge(function(id, u, v, value) {
    if (head.has(u) && tail.has(v)) {
      var slack = Math.abs(graph.node(u).rank - graph.node(v).rank) -
        (value.minLen || 1);
      if (slack < minSlack) {
        minSlack = slack;
        minSlackEdge = id;
      }
    }
  });

  if (minSlackEdge === undefined) {
    throw new Error("No edge found between head and tail components");
  }

  return minSlackEdge;
}

// Replace edge e with edge f in the tree, recalculating the depth and cut
// value properties.
function exchange(graph, tree, e, f) {
  tree.delEdge(e);
  tree.addEdge(f, graph.source(f), graph.target(f), {cutValue: 0});

  function dfs(node, depth) {
    node.depth = depth;
    var children = tree.successors(node);
    for (var c in children) {
      var child = children[c];
      dfs(child, depth + 1);
    }
  }
  var start = tree.source(f);
  dfs(start, start.depth + 1);

  initCutValues(graph, tree);
}

function normalize(g) {
  var m = util.min(g.nodes().map(function(u) { return g.node(u).rank; }));
  g.eachNode(function(u, node) { node.rank -= m; });
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return u < v ?  u.length + ":" + u + "-" + v : v.length + ":" + v + "-" + u;
}
