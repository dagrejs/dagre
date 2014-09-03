module.exports = {
  slack: slack
};

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
function slack(g, edge) {
  return g.getNode(edge.w).rank - g.getNode(edge.v).rank - edge.label.minlen;
}
