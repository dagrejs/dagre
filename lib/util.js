/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
exports.mergeAttributes = function(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
};

/*
 * Returns the smallest value in the array.
 */
exports.min = function(values) {
  return Math.min.apply(null, values);
};

/*
 * Returns the largest value in the array.
 */
exports.max = function(values) {
  return Math.max.apply(null, values);
};

/*
 * Accumulates the sum of elements in the given array using the `+` operator.
 */
exports.sum = function(values) {
  return values.reduce(function(acc, x) { return acc + x; }, 0);
};

/*
 * Joins all of the given arrays into a single array.
 */
exports.concat = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};

/*
 * Returns an array of all values in the given object.
 */
exports.values = function(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
};

/*
 * Treats each input array as a set and returns the union of all of the arrays.
 * This function biases towards the last array. That is, if an "equivalent"
 * key appears in more than on array, the resulting array will contain the last
 * "equivalent" key.
 */
exports.union = function(arrays) {
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
};

exports.intersectRect = function(rect, point) {
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

exports.pointStr = function(point) {
  return point.x + "," + point.y;
};

exports.createTimer = function(enabled) {
  var self = {};

  // Default to disabled
  enabled = enabled || false;

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

exports.propertyAccessor = function(self, config, field, setHook) {
  return function(x) {
    if (!arguments.length) return config[field];
    config[field] = x;
    if (setHook) setHook(x);
    return self;
  };
};
