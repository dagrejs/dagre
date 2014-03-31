var crossCount = require('./crossCount'),
    PriorityQueue = require('cp-data').PriorityQueue;
    util = require('../util');

module.exports = initOrder;

/*
 * Given a graph with a set of layered nodes (i.e. nodes that have a `rank`
 * attribute) this function attaches an `order` attribute that uniquely
 * arranges each node of each rank. If no constraint graph is provided the
 * order of the nodes in each rank is entirely arbitrary.
 *
 * TODO: doc this next bit further...
 * We need to take into account any constraints that affect the initial node
 * order. Furthermore we still want to respect random assignment as long as
 * it respects constraints. There may be a better way to do this. For now,
 * we add all unconstrained nodes to a priority queue with its key either being
 * its initial position (for stable order) or a random number. Then we add all
 * sources from the constraint graph. As we assigned a position to a source
 * in the constraint graph we remove it and add any new sources. This
 * process looks similar to topsort.
 *
 * TODO: More performant way to do this while retaining the above
 * characteristics?
 */
function initOrder(g, cg, random) {
  var layers = [];

  cg = cg.copy();

  g.eachNode(function(u, value) {
    var layer = layers[value.rank];
    if (g.children && g.children(u).length > 0) return;
    if (!layer) {
      layer = layers[value.rank] = [];
    }
    layer.push(u);
  });

  layers.forEach(function(layer) {
    var pq = new PriorityQueue(),
        keys = {},
        u,
        successors,
        i = 0;

    function tryAddToQueue(v) {
      if (!cg.hasNode(v) || !cg.inEdges(v).length) {
        pq.add(v, keys[v]);
      }
    }

    // Add initial set
    layer.forEach(function(v, i) {
      keys[v] = random ? Math.random() : i;
      tryAddToQueue(v);
    });

    while (pq.size()) {
      u = pq.removeMin();
      g.node(u).order = i++;

      if (cg.hasNode(u)) {
        successors = cg.successors(u);
        cg.delNode(u);
        successors.forEach(tryAddToQueue);
      }
    }
  });

  var cc = crossCount(g);
  g.graph().orderInitCC = cc;
  g.graph().orderCC = Number.MAX_VALUE;
}
