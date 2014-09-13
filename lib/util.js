var _ = require("lodash");

module.exports = {
  addDummyNode: addDummyNode,
  intersectRect: intersectRect,
  buildLayerMatrix: buildLayerMatrix,
  time: time,
  log: log
};

/*
 * Adds a dummy node to the graph and return v.
 */
function addDummyNode(g, attrs) {
  var v;
  do {
    v = _.uniqueId("dummy");
  } while (g.hasNode(v));

  attrs.dummy = true;
  g.setNode(v, attrs);
  return v;
}

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
function intersectRect(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  if (!dx && !dy) {
    throw new Error("Not possible to find intersection inside of the rectangle");
  }

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = w * dy / dx;
  }

  return { x: x + sx, y: y + sy };
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * function will produce a matrix with the ids of each node.
 */
function buildLayerMatrix(g) {
  var maxRank = _.max(_.map(g.nodes(), function(v) { return g.getNode(v).rank; })),
      layering = _.map(_.range(maxRank + 1), function() { return []; });
  _.each(g.nodes(), function(v) {
    var node = g.getNode(v);
    layering[node.rank][node.order] = v;
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
