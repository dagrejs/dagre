var _ = require("lodash");

module.exports = barycenter;

function barycenter(fixed, movable, neighbors, bias) {
  var bs = calcBarycenters(fixed, movable, neighbors),
      sorted = [];

  _.each(bs, function(b, v) {
    sorted.push({ v: v, b: b, i: sorted.length });
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

function calcBarycenters(fixed, movable, neighbors) {
  var sortable = _.filter(movable, function(v) { return !_.isEmpty(neighbors[v]); }),
      fixedPos = _.zipObject(fixed, _.map(fixed, function(v, i) { return i; })),
      bs =_.map(sortable, function(v) {
        var sum = _.reduce(neighbors[v], function(acc, weight, w) {
                    return {
                      weight: acc.weight + weight,
                      b: acc.b + (weight * fixedPos[w])
                    };
                  }, { weight: 0, b: 0 });
        return sum.b / sum.weight;
      });
  return _.zipObject(sortable, bs);
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
