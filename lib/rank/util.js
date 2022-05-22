"use strict";

var _ = require("../lodash");

module.exports = {
  longestPath: longestPath,
  slack: slack
};

/*
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (unnormalized) "rank" property.
 */
function longestPath(g) {
  var visited = {};

  function dfs(v) {
    var stack = [[v, false]];
    while (stack.length > 0) {
      var cur = stack.pop();
      if (cur[1]) {
        var rank = _.min(
          _.map(g.outEdges(cur[0]), function(e) {
            return g.node(e.w).rank - g.edge(e).minlen;
          })
        );
        if (
          rank === Number.POSITIVE_INFINITY ||
          rank === undefined ||
          rank === null
        ) {
          rank = 0;
        }
        g.node(cur[0]).rank = rank;
      } else if (!_.has(visited, cur[0])) {
        visited[cur[0]] = true;
        stack.push([cur[0], true]);
        _.forEachRight(g.outEdges(cur[0]), function(e) {
          stack.push([e.w, false]);
        });
      }
    }
  }

  _.forEach(g.sources(), dfs);
}

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
function slack(g, e) {
  return g.node(e.w).rank - g.node(e.v).rank - g.edge(e).minlen;
}
