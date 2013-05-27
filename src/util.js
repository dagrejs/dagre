dagre.util = {};

/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
function mergeAttributes(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
}

/*
 * Returns the smallest value in the array.
 */
function min(values) {
  return Math.min.apply(null, values);
}

/*
 * Returns the largest value in the array.
 */
function max(values) {
  return Math.max.apply(null, values);
}

/*
 * Accumulates the sum of elements in the given array using the `+` operator.
 */
var sum = dagre.util.sum = function(values) {
  return values.reduce(function(acc, x) { return acc + x; }, 0);
};

/*
 * Joins all of the given arrays into a single array.
 */
function concat(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

var keys = dagre.util.keys = Object.keys;

/*
 * Returns an array of all values in the given object.
 */
function values(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
}

/*
 * Treats each input array as a set and returns the union of all of the arrays.
 * This function biases towards the last array. That is, if an "equivalent"
 * key appears in more than on array, the resulting array will contain the last
 * "equivalent" key.
 */
function union(arrays) {
  var obj = {};
  for (var i = 0; i < arrays.length; ++i) {
    var a = arrays[i];
    for (var j = 0; j < a.length; ++j) {
      var v = a[j];
      obj[v] = v;
    }
  }

  var results = [];
  for (var k in obj) {
    results.push(obj[k]);
  }

  return results;
}

/*
 * Returns all components in the graph using undirected navigation.
 */
var components = dagre.util.components = function(g) {
  var results = [];
  var visited = {};

  function dfs(u, component) {
    if (!(u in visited)) {
      visited[u] = true;
      component.push(u);
      g.neighbors(u).forEach(function(v) {
        dfs(v, component);
      });
    }
  }

  g.eachNode(function(u) {
    var component = [];
    dfs(u, component);
    if (component.length > 0) {
      results.push(component);
    }
  });

  return results;
};

/*
 * This algorithm uses undirected traversal to find a miminum spanning tree
 * using the supplied weight function. The algorithm is described in
 * Cormen, et al., "Introduction to Algorithms". The returned structure
 * is an array of node id to an array of adjacent nodes.
 */
var prim = dagre.util.prim = function(g, weight) {
  var result = {};
  var parent = {};
  var q = priorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.eachNode(function(u) {
    q.add(u, Number.POSITIVE_INFINITY);
    result[u] = [];
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0], 0);

  var u;
  var init = false;
  while (q.size() > 0) {
    u = q.removeMin();
    if (u in parent) {
      result[u].push(parent[u]);
      result[parent[u]].push(u);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + g.toString());
    } else {
      init = true;
    }

    g.neighbors(u).forEach(function(v) {
      var pri = q.priority(v);
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parent[v] = u;
          q.decrease(v, edgeWeight);
        }
      }
    });
  }

  return result;
};

var intersectRect = dagre.util.intersectRect = function(rect, point) {
  var x = rect.x;
  var y = rect.y;

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = point.x - x;
  var dy = point.y - y;
  var w = rect.width / 2;
  var h = rect.height / 2;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return {x: x + sx, y: y + sy};
};

var pointStr = dagre.util.pointStr = function(point) {
  return point.x + "," + point.y;
};

var createTimer = function() {
  var self = {},
      enabled = false;

  self.enabled = function(x) {
    if (!arguments.length) return enabled;
    enabled = x;
    return self;
  };

  self.wrap = function(name, func) {
    return function() {
      var start = enabled ? new Date().getTime() : null;
      try {
        return func.apply(null, arguments);
      } finally {
        if (start) console.log(name + " time: " + (new Date().getTime() - start) + "ms");
      }
    };
  };

  return self;
};

function propertyAccessor(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
}
