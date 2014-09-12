var _ = require("lodash"),
    findFAS = require("graphlib").alg.greedyFAS;

module.exports = {
  run: run,
  undo: undo
};

function run(g) {
  var fas = findFAS(g, weightFn(g));
  _.each(fas, function(e) {
    var v = e.v,
        w = e.w;
    reverseEdge(g, v, w, g.getEdge(v, w));
  });
}

function weightFn(g) {
  return function(e) {
    return g.getEdge(e).weight;
  };
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
  _.each(g.edges(), function(e) {
    var label = g.getEdge(e);
    if (label.reversed) {
      var v = e.v,
          w = e.w;
      g.setEdge(v, w, label.forward);
      g.setEdge(w, v, label.reversed);
    }
  });
}
