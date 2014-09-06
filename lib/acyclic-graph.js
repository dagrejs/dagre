var _ = require("lodash"),
    findFAS = require("graphlib").alg.greedyFAS;

module.exports = {
  makeAcyclic: makeAcyclic,
  undo: undo
};

function makeAcyclic(g) {
  var fas = findFAS(g, weightFn);
  _.each(fas, function(edge) {
    var v = edge.v,
        w = edge.w;
    reverseEdge(g, v, w, g.getEdge(v, w));
  });
}

function weightFn(edge) {
  return edge.label.weight;
}

/*
 * Removes the edge (v, w) and inserts a new edge (w, v) that has the old
 * edge's label in the "reversed" field. If the edge (w, v) already exists save
 * its label into the "forward" field". Assign new weight and minlen attributes
 * to the edge to account for the labels for both directions.
 */
function reverseEdge(g, v, w, label) {
  var forwardLabel = g.getEdge(w, v),
      newLabel = {};

  var weight = label.weight,
      minlen = label.minlen;
  if (forwardLabel) {
    newLabel.forward = forwardLabel;
    weight += forwardLabel.weight;
    minlen += forwardLabel.minlen;
  }

  newLabel.weight = weight;
  newLabel.minlen = minlen;
  newLabel.reversed = label;

  g.removeEdge(v, w);
  g.setEdge(w, v, newLabel);
}

function undo(g) {
  _.each(g.edges(), function(edge) {
    var label = edge.label;
    if (label.reversed) {
      var v = edge.v,
          w = edge.w;
      g.setEdge(v, w, label.forward);
      g.setEdge(w, v, label.reversed);
    }
  });
}
