module.exports = edgeIter;

/*
 * Returns a zero-arg function that can be invoked to get the next edge in the
 * graph's edge list. This can be used to cycle through all edges without
 * restarting from the beginning of the list. Use `refresh` on the returned
 * function to update the edge list, e.g. after adding or removing edges in
 * the input graph.
 */
function edgeIter(g) {
  var i = 0,
      edges;

  function refresh() {
    edges = g.edges();
  }

  function next() {
    return edges[i++ % edges.length];
  }
  next.refresh = refresh;
  refresh();
  return next;
}
