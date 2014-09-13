var _ = require("lodash"),
    findFAS = require("graphlib").alg.greedyFAS;

module.exports = {
  run: run,
  undo: undo
};

function run(g) {
  var fas = findFAS(g, weightFn(g));
  _.each(fas, function(e) {
    var label = g.getEdge(e);
    g.removeEdge(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, _.uniqueId("rev"));
  });
}

function weightFn(g) {
  return function(e) {
    return g.getEdge(e).weight;
  };
}

function undo(g) {
  _.each(g.edges(), function(e) {
    var label = g.getEdge(e);
    if (label.reversed) {
      g.removeEdge(e);

      var forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
}
