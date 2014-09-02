module.exports = leaveEdge;

function leaveEdge(edgeIter) {
  var startingEdge = edgeIter(),
      edge = startingEdge;
  do {
    if (edge.label.cutvalue < 0) {
      return edge;
    }
    edge = edgeIter();
  } while (edge !== startingEdge);
}
