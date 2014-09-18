var _ = require("lodash"),
    barycenter = require("./barycenter");

module.exports = sortLayer;

function sortLayer(fixed, movable, neighbors, bias) {
  var bs = barycenter(fixed, movable, neighbors),
      sorted = [];

  _.each(bs, function(val, v) {
    sorted.push({ v: v, b: val.barycenter, i: sorted.length });
  });
  sorted.sort(compareWithBias(bias));
  sorted = _.map(sorted, function(entry) { return entry.v; });

  var sortedIdx = 0;
  _.each(movable, function(v, i) {
    if (_.has(bs, v)) {
      movable[i] = sorted[sortedIdx++];
    }
  });
}

function compareWithBias(bias) {
  return function(l, r) {
    if (l.b < r.b) {
      return -1;
    } else if (l.b > r.b) {
      return 1;
    }

    return !bias ? l.i - r.i : r.i - l.i;
  };
}

