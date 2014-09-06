var _ = require("lodash"),
    findFAS = require("graphlib").alg.greedyFAS;

module.exports = {
  makeAcyclic: makeAcyclic
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

function reverseEdge(g, v, w, label) {
  var otherLabel = g.getEdge(w, v),
      newLabel = [];

  label.reversed = true;

  var weight = label.weight,
      minlen = label.minlen;
  newLabel.push(label);
  if (otherLabel) {
    newLabel.push(otherLabel);
    weight += otherLabel.weight;
    minlen += otherLabel.minlen;
  }

  newLabel.weight = weight;
  newLabel.minlen = minlen;

  g.removeEdge(v, w);
  g.setEdge(w, v, newLabel);
}
