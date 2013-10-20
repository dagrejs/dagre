var PriorityQueue = require('cp-data').PriorityQueue;

module.exports = initRank;

/*
 * Assigns `rank` attribute to each node in the input graph and ensures that
 * this rank respects the `minLen` attribute of incident edges.
 *
 * Prerequisites:
 *
 *  * The input graph must be acyclic
 *  * Each edge in the input graph must have an assigned 'minLen' attribute
 */
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
    var value = g.edge(e);
    var minLen = 'minLen' in value ? value.minLen : 1;
    minRank[target] = Math.max(minRank[target], rank + minLen);
    pq.decrease(target, pq.priority(target) - 1);
  }

  while (pq.size() > 0) {
    var minId = pq.min();
    if (pq.priority(minId) > 0) {
      throw new Error('Input graph is not acyclic: ' + g.toString());
    }
    pq.removeMin();

    var rank = minRank[minId];
    g.node(minId).rank = rank;

    g.outEdges(minId).forEach(updateTargetNode);
  }
}
