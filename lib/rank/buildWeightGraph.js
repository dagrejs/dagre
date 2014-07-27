'use strict';

var Digraph = require('graphlib').Digraph;

module.exports = buildWeightGraph;

/*
 * This function takes a directed acyclic multi-graph and produces a
 * simple directed graph. Nodes are simply copied from the input graph to the
 * output graph.Edges are collapsed and assigned `weight` and `minLen`
 * attributes.
 *
 * The weight of an edge consists of a sign and a magnitude. The sign is
 * negative if the edge has a truthy `reversed` attribute; otherwise it is
 * positive. Because the input graph is acyclic multi-edges between a pair of
 * nodes must be in the same direction, so there is no difficulty in
 * determining the sign. The magnitude represents the number of edges between
 * the pair of nodes. This entire value is represented as a single attribute
 * called `weight`.
 *
 * The `minLen` of an edge in the output graph is the max value for `minLen`
 * between the adjacent nodes in the input graph. If the edge in the input
 * graph is reversed then `minLen` will be a negative value (or 0 in the case
 * of a sideways edge).
 */
function buildWeightGraph(g) {
  var result = new Digraph();
  g.eachNode(function(u, value) { result.addNode(u, value); });
  g.eachEdge(function(e, u, v, value) {
    var id = incidenceId(u, v);
    if (!result.hasEdge(id)) {
      result.addEdge(id, u, v, { weight: 0, minLen: 0 });
    }
    var resultEdge = result.edge(id);
    resultEdge.weight += (value.reversed ? -1 : 1);
    resultEdge.minLen = (value.reversed ? -1 : 1) *
                            Math.max(Math.abs(resultEdge.minLen), Math.abs(value.minLen));
  });
  return result;
}

/*
 * This id can be used to group (in an undirected manner) multi-edges
 * incident on the same two nodes.
 */
function incidenceId(u, v) {
  return u < v ?  u.length + ':' + u + '-' + v : v.length + ':' + v + '-' + u;
}
