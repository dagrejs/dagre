var PriorityQueue = require("../data/PriorityQueue");

/*
 * This algorithm uses undirected traversal to find a miminum spanning tree
 * using the supplied weight function. The algorithm is described in
 * Cormen, et al., "Introduction to Algorithms". The returned structure
 * is an array of node id to an array of adjacent nodes.
 */
module.exports = function(g, weight) {
  var result = {};
  var parent = {};
  var q = new PriorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.eachNode(function(u) {
    q.add(u, Number.POSITIVE_INFINITY);
    result[u] = [];
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0], 0);

  var u;
  var init = false;
  while (q.size() > 0) {
    u = q.removeMin();
    if (u in parent) {
      result[u].push(parent[u]);
      result[parent[u]].push(u);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + g.toString());
    } else {
      init = true;
    }

    g.neighbors(u).forEach(function(v) {
      var pri = q.priority(v);
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parent[v] = u;
          q.decrease(v, edgeWeight);
        }
      }
    });
  }

  return result;
};

