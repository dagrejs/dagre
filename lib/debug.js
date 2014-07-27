'use strict';

var util = require('./util');

/**
 * Renders a graph in a stringified DOT format that indicates the ordering of
 * nodes by layer. Circles represent normal nodes. Diamons represent dummy
 * nodes. While we try to put nodes in clusters, it appears that graphviz
 * does not respect this because we're later using subgraphs for ordering nodes
 * in each layer.
 */
exports.dotOrdering = function(g) {
  var ordering = util.ordering(g.filterNodes(util.filterNonSubgraphs(g)));
  var result = 'digraph {';

  function dfs(u) {
    var children = g.children(u);
    if (children.length) {
      result += 'subgraph cluster_' + u + ' {';
      result += 'label="' + u + '";';
      children.forEach(function(v) {
        dfs(v);
      });
      result += '}';
    } else {
      result += u;
      if (g.node(u).dummy) {
        result += ' [shape=diamond]';
      }
      result += ';';
    }
  }

  g.children(null).forEach(dfs);

  ordering.forEach(function(layer) {
    result += 'subgraph { rank=same; edge [style="invis"];';
    result += layer.join('->');
    result += '}';
  });

  g.eachEdge(function(e, u, v) {
    result += u + '->' + v + ';';
  });

  result += '}';

  return result;
};
