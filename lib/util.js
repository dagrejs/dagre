var _ = require("lodash");

module.exports = {
  addDummyNode: addDummyNode,
  buildLayerMatrix: buildLayerMatrix,
  time: time,
  log: log
};

/*
 * Adds a dummy node to the graph and return { v, label }.
 */
function addDummyNode(g) {
  var v;
  do {
    v = _.uniqueId("dummy");
  } while (g.hasNode(v));

  var label = { dummy: true };
  g.setNode(v, label);
  return { v: v, label: label };
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * function will produce a matrix with the ids of each node.
 */
function buildLayerMatrix(g) {
  var maxRank = _.max(_.map(g.nodes(), function(node) { return node.label.rank; })),
      layering = _.map(_.range(maxRank + 1), function() { return []; });
  _.each(g.nodes(), function(node) {
    layering[node.label.rank][node.label.order] = node.v;
  });
  return layering;
}

/*
 * Returns a new function that wraps `func` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
function time(name, func) {
  var start = log.level ? _.now() : null;
  try {
    return func();
  } finally {
    log(1, name + " time: " + (_.now() - start) + "ms");
  }
}

/*
 * A global logger with the specification `log(level, message, ...)` that
 * will log a message to the console if `log.level >= level`.
 */
function log(level) {
  if (log.level >= level) {
    console.log.apply(console, _.toArray(arguments).slice(1));
  }
}
log.level = 0;
