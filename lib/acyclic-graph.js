var _ = require("lodash"),
    findFAS = require("graphlib").alg.greedyFAS;

module.exports = {
  makeAcyclic: makeAcyclic
};

function makeAcyclic(g) {
  var fas = findFAS(g, weightFn);
  _.each(fas, function(edge) {
    g.removeEdge(edge.v, edge.w);
  });
}

function weightFn(edge) {
  return edge.label.weight;
}
