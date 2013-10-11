var util = require("./util"),
    components = require("graphlib").alg.components,
    filter = require("graphlib").filter,
    PriorityQueue = require("graphlib").data.PriorityQueue,
    /* jshint -W079 */
    Set = require("graphlib").data.Set,
    Digraph = require("graphlib").Digraph;

module.exports = rank;

function rank(g) {
  g = g.filterNodes(util.filterNonSubgraphs(g));
  var reduced = combineRanks(g);

  initRank(reduced);

  components(reduced).forEach(function(cmpt) {
    var subgraph = reduced.filterNodes(filter.nodesFromList(cmpt));
    feasibleTree(subgraph);
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
    if (value.hasOwnProperty('prefRank')) {
      hasRankConstraint = true;
      var preferredRank = value.prefRank;
      if (!ranks.hasOwnProperty(preferredRank)) {
        ranks[preferredRank] = [];
      }
      ranks[preferredRank].push(n);
    } else {
      // Nodes with no rank constraint get their own rank id
      var ur = 'unconstrained_rank_' + uid++;
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
      console.log('source: ' + source + ' rank: ' + source_pref);
      console.log('target: ' + target + ' rank: ' + target_pref);
      if (source_pref != target_pref) {
        reduced.addEdge(null, source_pref, target_pref, {minLen: value.minLen});
      }
    });

    // Reverse in-edges into the minimum rank node and out-edges from
    // the maximum rank node.
    function reverse(edges) {
      for (var e in edges) {
        var edge = edges[e];
        var source = reduced.source(edges[e]);
        var target = reduced.target(edges[e]);
        var minLen = reduced.edge(e).minLen;
        reduced.delEdge(edges[e]);
        reduced.addEdge(edges[e], target, source, {reversed: true, minLen: minLen});
      }
    };

    if (reduced.hasNode('min')) {
      reverse(reduced.inEdges('min'));
      // Add edges from 'min' to any node without in-edges.
      reduced.eachNode(function(n, value) {
        if (n != 'min' && n != 'max' && reduced.inEdges(n).length == 0) {
          reduced.addEdge(null, 'min', n, {minLen: 1});
        }
      });
    }

    if (reduced.hasNode('max')) {
      reverse(reduced.outEdges('max'));
      // Add edges from any node without out-edges to 'max'.
      reduced.eachNode(function(n, value) {
        if (n != 'max' && reduced.outEdges(n).length == 0) {
          reduced.addEdge(null, n, 'max', {minLen: 1});
        }
      });
    }

    return reduced;
  } else {
    return g;
  }
}

function expandRanks(reduced) {
  if (reduced.graph() && reduced.graph().originalGraph) {
    // Copy ranks from reduced graph nodes to original graph
    // nodes.
    var expanded = reduced.graph().originalGraph;
    reduced.eachNode(function(n, value) {
      for (var n in value.originals) {
        expanded.node(value.originals[n]).rank = value.rank;
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
      minLen = []; // Array of {u, v, len}

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
  remaining.remove(g.nodes()[0]);

  // Finds the next edge with the minimum slack.
  function findMinSlack() {
    var result,
        eSlack = Number.POSITIVE_INFINITY;
    minLen.forEach(function(mle /* minLen entry */) {
      if (remaining.has(mle.u) !== remaining.has(mle.v)) {
        var mleSlack = slack(mle);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = { treeNode: mle.u, graphNode: mle.v, len: mle.len};
          } else {
            result = { treeNode: mle.v, graphNode: mle.u, len: -mle.len };
          }
          eSlack = mleSlack;
        }
      }
    });

    return result;
  }

  while (remaining.size() > 0) {
    var result = findMinSlack();
    remaining.remove(result.graphNode);
    g.node(result.graphNode).rank = g.node(result.treeNode).rank + result.len;
  }
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
