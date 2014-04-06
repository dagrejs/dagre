/*
 * Returns the smallest value in the array.
 */
exports.min = function(values) {
  return Math.min.apply(Math, values);
};

/*
 * Returns the largest value in the array.
 */
exports.max = function(values) {
  return Math.max.apply(Math, values);
};

/*
 * Returns `true` only if `f(x)` is `true` for all `x` in `xs`. Otherwise
 * returns `false`. This function will return immediately if it finds a
 * case where `f(x)` does not hold.
 */
exports.all = function(xs, f) {
  for (var i = 0; i < xs.length; ++i) {
    if (!f(xs[i])) {
      return false;
    }
  }
  return true;
};

/*
 * Accumulates the sum of elements in the given array using the `+` operator.
 */
exports.sum = function(values) {
  return values.reduce(function(acc, x) { return acc + x; }, 0);
};

/*
 * Returns an array of all values in the given object.
 */
exports.values = function(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
};

exports.shuffle = function(array) {
  for (i = array.length - 1; i > 0; --i) {
    var j = Math.floor(Math.random() * (i + 1));
    var aj = array[j];
    array[j] = array[i];
    array[i] = aj;
  }
};

exports.propertyAccessor = function(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
};

/*
 * Given a layered, directed graph with `rank` and `order` node attributes,
 * this function returns an array of ordered ranks. Each rank contains an array
 * of the ids of the nodes in that rank in the order specified by the `order`
 * attribute.
 */
exports.ordering = function(g) {
  var ordering = [];
  g.eachNode(function(u, value) {
    var rank = ordering[value.rank] || (ordering[value.rank] = []);
    rank[value.order] = u;
  });
  return ordering;
};

/*
 * A filter that can be used with `filterNodes` to get a graph that only
 * includes nodes that do not contain others nodes.
 */
exports.filterNonSubgraphs = function(g) {
  return function(u) {
    return g.children(u).length === 0;
  };
};

/*
 * Returns the lowest common ancestor of nodes u and v in the nesting tree of
 * graph g. If u === v this finds the parent of u.
 */
exports.findLCA = function(g, u, v) {
  var visited = {};
  u = g.parent(u);
  v = g.parent(v);
  while (u !== null && v !== null) {
    if (visited[u]) return u;
    visited[u] = true;
    u = g.parent(u);

    if (visited[v]) return v;
    visited[v] = true;
    v = g.parent(v);
  }
  return null;
};

/*
 * A function that returns an id generator that generates a new id on each
 * invocation. Each id is prefixed by the supplied prefix. Provided this
 * generator is the only code that uses that prefix, the id can be safely
 * assumed to be unique.
 *
 * Reserved prefixes:
 *
 *   * _d: dummy node or edge
 *   * _rc: node used to enforce rank constraints
 *   * _sl: self loop dummy node or edge
 *   * _se: sideways edge dummy node or edge
 *   * _ct: cluster top node or edge from top node
 *   * _cb: cluster bottom node or edge from bottom node
 *   * _cl: cluster left node or left segment
 *   * _cr: cluster right node or right segment
 */
exports.idGen = function(prefix) {
  var counter = 0;
  return function() {
    return prefix + '-' + (counter++);
  };
};

/*
 * Work around broken isNaN implementation. This approach comes from the ES6
 * docs.
 */
exports.isNaN = function(x) { return x !== x; };

/*
 * Returns a new function that wraps `func` with a timer. The wrapper logs the
 * time it takes to execute the function.
 *
 * The timer will be enabled provided `log.level >= 1`.
 */
function time(name, func) {
  return function() {
    var start = new Date().getTime();
    try {
      return func.apply(null, arguments);
    } finally {
      log(1, name + ' time: ' + (new Date().getTime() - start) + 'ms');
    }
  };
}
time.enabled = false;

exports.time = time;

/*
 * A global logger with the specification `log(level, message, ...)` that
 * will log a message to the console if `log.level >= level`.
 */
function log(level) {
  if (log.level >= level) {
    console.log.apply(console, Array.prototype.slice.call(arguments, 1));
  }
}
log.level = 0;

exports.log = log;
