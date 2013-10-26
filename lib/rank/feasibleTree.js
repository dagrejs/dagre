/* jshint -W079 */
var Set = require('cp-data').Set,
/* jshint +W079 */
    Digraph = require('graphlib').Digraph,
    rankUtil = require('./rankUtil');

module.exports = feasibleTree;

/*
 * Given a connected acyclic graph with each node assigned a `rank` attribute,
 * this function constructs and returns a spanning tree. This function may
 * reduce the length of some edges from the initial rank assignment while
 * maintaining the `minLen` specified by each edge.
 *
 * Prerequisites:
 *
 * * The input graph is acyclic
 * * Each node in the input graph has an assigned `rank` attribute
 * * Each edge in the input graph has an assigned `minLen` attribute
 *
 * Outputs:
 *
 * A feasible spanning tree for the input graph (i.e. a spanning tree that
 * respects each graph edge's `minLen` attribute) represented as a Digraph with
 * a `root` attribute on graph.
 *
 * Nodes have the same id and value as that in the input graph.
 *
 * Edges in the tree have arbitrarily assigned ids. The attributes for edges
 * include `reversed` and `weight`. `reversed` indicates that the edge had to
 * be reversed to add it to the tree. `weight` is used to indicate how many
 * multi-edges are represented by the tree edge.
 */
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
      minLen.push(minLenMap[id] = { u: u, v: v, len: 0, weight: 0 });
    }
    var mle = minLenMap[id];
    mle.len = Math.max(mle.len, edge.minLen);
    mle.weight++;
  });

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
        var mleSlack = rankUtil.slack(g, mle.u, mle.v, mle.len);
        if (mleSlack < eSlack) {
          if (!remaining.has(mle.u)) {
            result = {
              treeNode: mle.u,
              graphNode: mle.v,
              len: mle.len,
              reversed: false,
              weight: mle.weight
            };
          } else {
            result = {
              treeNode: mle.v,
              graphNode: mle.u,
              len: -mle.len,
              reversed: true,
              weight: mle.weight
            };
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
    tree.addEdge(null, result.treeNode, result.graphNode, {
      reversed: result.reversed,
      weight: result.weight
    });
    nodeVal.rank = g.node(result.treeNode).rank + result.len;
  }

  return tree;
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return u < v ?  u.length + ':' + u + '-' + v : v.length + ':' + v + '-' + u;
}
