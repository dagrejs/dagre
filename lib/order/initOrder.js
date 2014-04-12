var PriorityQueue = require('cp-data').PriorityQueue,
    nodesFromList = require('graphlib').filter.nodesFromList;

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
function initOrder(layeredGraphs, cg, random) {
  layeredGraphs.forEach(function(layer) {
    var layerCG = cg.filterNodes(nodesFromList(layer.nodes()));
    initOrderLayer(layer, layerCG, random);
  });
}

function initOrderLayer(g, cg, random) {
  var nextOrder = 0;

  function dfs(u) {
    var children = g.children(u);
    if (!children.length) {
      g.node(u).order = nextOrder++;
      return;
    }

    var pq = new PriorityQueue(),
        keys = {},
        successors;

    function tryEnqueue(v) {
      if (!cg.hasNode(v) || !cg.inEdges(v).length) {
        pq.add(v, keys[v]);
      }
    }

    // For each node, assign a key which can be used to determine the order
    // (sans constraints). If we're using random ordering, we just assign
    // Math.random here.
    children.forEach(function(v, i) {
      keys[v] = random ? Math.random() : i;
      tryEnqueue(v);
    });

    while (pq.size()) {
      u = pq.removeMin();

      dfs(u);

      if (cg.hasNode(u)) {
        successors = cg.successors(u);
        cg.delNode(u);
        successors.forEach(tryEnqueue);
      }
    }
  }

  dfs(null);
}
