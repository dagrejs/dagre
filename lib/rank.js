var util = require("./util"),
    components = require("graphlib").alg.components,
    filter = require("graphlib").filter,
    PriorityQueue = require("graphlib").data.PriorityQueue,
    /* jshint -W079 */
    Set = require("graphlib").data.Set,
    Digraph = require("graphlib").Digraph;

module.exports = rank;

function rank(g, useSimplex) {
  g = g.filterNodes(util.filterNonSubgraphs(g));
  var reduced = combineRanks(g);

  initRank(reduced);

  components(reduced).forEach(function(cmpt) {
    var subgraph = reduced.filterNodes(filter.nodesFromList(cmpt));
    var spanningTree = feasibleTree(subgraph);
    if (useSimplex) {
      initCutValues(subgraph, spanningTree);
      while (true) {
        var e = leaveEdge(spanningTree);
        if (e === null) break;
        var f = enterEdge(subgraph, spanningTree, e);
        exchange(reduced, spanningTree, e, f);
      }
    }
    normalize(subgraph);
  });

  expandRanks(reduced);
}

// If there are rank constraints on nodes, then build a condensed graph,
// with one node per rank set.  Modify edges to that the minimum rank
// will be ranked before any others and the maximum rank will be ranked
// after any others.
function combineRanks(g) {
  var hasRankConstraint = false;
  var ranks = {};
  var uid = 1;
  g.eachNode(function(n, value) {
    if (value.hasOwnProperty("prefRank")) {
      hasRankConstraint = true;
      var preferredRank = value.prefRank;
      if (!ranks.hasOwnProperty(preferredRank)) {
        ranks[preferredRank] = [];
      }
      ranks[preferredRank].push(n);
    } else {
      // Nodes with no rank constraint get their own rank id
      var ur = "unconstrained_rank_" + uid++;
      ranks[ur] = [n];
      if (g.node(n)) {
        g.node(n).prefRank = ur;
      } else {
        g.node(n, {prefRank: ur});
      }
    }
  });

  if (hasRankConstraint) {
    var reduced = new Digraph();
    reduced.graph({originalGraph: g});
    // Create one node for each rank, containing the ids of all nodes in
    // that rank as its value.
    for (var preferredRank in ranks) {
      reduced.addNode(preferredRank.toString(), {originals: ranks[preferredRank]});
    }

    // Add edges for each rank crossing edge in the original graph.
    g.eachEdge(function(id, source, target, value) {
      var source_pref = g.node(source).prefRank;
      var target_pref = g.node(target).prefRank;
      if (source_pref !== target_pref) {
        reduced.addEdge(null, source_pref, target_pref, {minLen: value.minLen});
      }
    });

    if (reduced.hasNode("min")) {
      // Add edges from "min" to any node without in-edges.
      reduced.eachNode(function(n) {
        if (n !== "min" && n !== "max" && reduced.inEdges(n).length === 0) {
          reduced.addEdge(null, "min", n, {internal: true, minLen: 1});
        }
      });
    }

    if (reduced.hasNode("max")) {
      // Add edges from any node without out-edges to "max".
      reduced.eachNode(function(n) {
        if (n !== "max" && reduced.outEdges(n).length === 0) {
          reduced.addEdge(null, n, "max", {internal: true, minLen: 1});
        }
      });
    }

    return reduced;
  } else {
    return g;
  }
}

// If the argument graph was a reduced version of some original graph
// then copy assigned ranks from it to the original.  Otherwise, the
// ranks are already assigned.
function expandRanks(reduced) {
  if (reduced.graph() && reduced.graph().originalGraph) {
    var expanded = reduced.graph().originalGraph;
    reduced.eachNode(function(n, value) {
      for (var o in value.originals) {
        expanded.node(value.originals[o]).rank = value.rank;
      }
    });
    return expanded;
  } else {
    return reduced;
  }
}

function initRank(g) {
  var minRank = {};
  var pq = new PriorityQueue();

  g.eachNode(function(u) {
    pq.add(u, g.inEdges(u).length);
    minRank[u] = 0;
  });

  function updateTargetNode(e) {
    var rank = g.node(g.source(e)).rank;
    var target = g.target(e);
    minRank[target] = Math.max(minRank[target], rank + (g.edge(e).minLen || 1));
    pq.decrease(target, pq.priority(target) - 1);
  }

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error("Input graph is not acyclic: " + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(updateTargetNode);
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
      minLen.push(minLenMap[id] = { e: e, u: u, v: v, len: 1 });
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
    nodeVal = g.node(result.graphNode);
    remaining.remove(result.graphNode);
    tree.addNode(result.graphNode, nodeVal);
    tree.addEdge(result.mle.e, result.treeNode, result.graphNode, {});
    nodeVal.rank = g.node(result.treeNode).rank + result.len;
  }

  return tree;
}

function initCutValues(graph, spanningTree) {
  computeLowLim(spanningTree);

  spanningTree.eachEdge(function(id, u, v, treeValue) {
    treeValue.cutValue = 0;
  });

  // Propagate cut values up the tree.
  function dfs(n) {
    var children = spanningTree.successors(n);
    for (var c in children) {
      var child = children[c];
      dfs(child);
    }
    if (n !== spanningTree.graph().root) {
      setCutValue(graph, spanningTree, n);
    }
  }
  dfs(spanningTree.graph().root);
}

function computeLowLim(tree) {
  // Perform a DFS postorder traversal, labeling each node v with
  // its traversal order "lim(v)" and the minimum traversal number
  // of any of its descendants "low(v)".
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

function setCutValue(graph, tree, child) {
  // To compute the cut value of the edge parent -> child, we consider
  // it and two other edges:
  //          parent
  //             |
  //           child
  //          /      \
  //         u        v

  var parentEdge = tree.inEdges(child)[0];

  var grandchildren = [];
  var grandchildEdges = tree.outEdges(child);
  for (var gce in grandchildEdges) {
    grandchildren.push(tree.target(grandchildEdges[gce]));
  }

  var cutValue = 0;

  // TODO: Replace unit increment/decrement with edge weights.
  var E = 0;    // Edges from child to grandchild's subtree.
  var F = 0;    // Edges to child from grandchild's subtree.
  var G = 0;    // Edges from child to nodes outside of child's subtree.
  var H = 0;    // Edges from nodes outside of child's subtree to child.
  var outEdges = graph.outEdges(child);
  var gc;
  for (var oe in outEdges) {
    var succ = graph.target(outEdges[oe]);
    for (gc in grandchildren) {
      if (inSubtree(tree, succ, grandchildren[gc])) {
        E++;
      }
    }
    if (!inSubtree(tree, succ, child)) {
      G++;
    }
  }

  var inEdges = graph.inEdges(child);
  for (var ie in inEdges) {
    var pred = graph.source(inEdges[ie]);
    for (gc in grandchildren) {
      if (inSubtree(tree, pred, grandchildren[gc])) {
        F++;
      }
    }
    if (!inSubtree(tree, pred, child)) {
      H++;
    }
  }

  // Contributions depend on the alignment of the parent -> child edge
  // and the child -> u or v edges.
  var grandchildCutSum = 0;
  for (gc in grandchildren) {
    var cv = tree.edge(grandchildEdges[gc]).cutValue;
    if (tree.source(grandchildEdges[gc]) === graph.source(grandchildEdges[gc])) {
      grandchildCutSum += cv;
    } else {
      grandchildCutSum -= cv;
    }
  }

  if (tree.source(parentEdge) === graph.source(parentEdge)) {
    cutValue += grandchildCutSum - E + F - G + H;
  } else {
    cutValue -= grandchildCutSum - E + F - G + H;
  }

  tree.edge(parentEdge).cutValue = cutValue;
}

function inSubtree(tree, n, root) {
  // Is n in the subtree rooted at root, including root itself?
  return (tree.node(root).low <= tree.node(n).lim &&
          tree.node(n).lim <= tree.node(root).lim);
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
// in the graph, with a negative cut value.  Of the two nodes incident
// on the edge, take the lower one.  enterEdge returns an edge with
// minimum slack going from outside of that node's subtree to inside
// of that node's subtree.
function enterEdge(graph, tree, e) {
  var source = tree.source(e);
  var target = tree.target(e);
  var lower = tree.node(target).lim < tree.node(source).lim ? target : source;

  // Is the tree edge aligned with the graph edge?
  var aligned = tree.source(e) === graph.source(e);

  var minSlack = Number.POSITIVE_INFINITY;
  var minSlackEdge;
  if (aligned) {
    graph.eachEdge(function(id, u, v, value) {
      if (id !== e && inSubtree(tree, u, lower) && !inSubtree(tree, v, lower)) {
        var slack = Math.abs(graph.node(u).rank - graph.node(v).rank) -
          (value.minLen || 1);
        if (slack < minSlack) {
          minSlack = slack;
          minSlackEdge = id;
        }
      }
    });
  } else {
    graph.eachEdge(function(id, u, v, value) {
      if (id !== e && !inSubtree(tree, u, lower) && inSubtree(tree, v, lower)) {
        var slack = Math.abs(graph.node(u).rank - graph.node(v).rank) -
          (value.minLen || 1);
        if (slack < minSlack) {
          minSlack = slack;
          minSlackEdge = id;
        }
      }
    });
  }


  if (minSlackEdge === undefined) {
    var outside = [];
    var inside = [];
    graph.eachNode(function(id) {
      if (!inSubtree(tree, id, lower)) {
        outside.push(id);
      } else {
        inside.push(id);
      }
    });
    throw new Error("No edge found from outside of tree to inside");
  }

  return minSlackEdge;
}

// Replace edge e with edge f in the tree, recalculating the tree root,
// the nodes' low and lim properties and the edges' cut values.
function exchange(graph, tree, e, f) {
  tree.delEdge(e);
  var source = graph.source(f);
  var target = graph.target(f);

  // Redirect edges so that target is the root of it's subtree.
  function redirect(v) {
    var edges = tree.inEdges(v);
    for (var i in edges) {
      var e = edges[i];
      var u = tree.source(e);
      var value = tree.edge(e);
      redirect(u);
      tree.delEdge(e);
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

  tree.addEdge(f, source, target, {cutValue: 0});

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
