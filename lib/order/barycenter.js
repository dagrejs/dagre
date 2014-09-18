var _ = require("lodash");

module.exports = barycenter;

function barycenter(fixed, movable, neighbors) {
  var sortable = _.filter(movable, function(v) { return !_.isEmpty(neighbors[v]); }),
      fixedPos = _.zipObject(fixed, _.map(fixed, function(v, i) { return i; })),
      bs =_.map(sortable, function(v) {
        var sum = _.reduce(neighbors[v], function(acc, weight, w) {
                    return {
                      weight: acc.weight + weight,
                      b: acc.b + (weight * fixedPos[w])
                    };
                  }, { weight: 0, b: 0 });
        return { barycenter: sum.b / sum.weight, weight: sum.weight };
      });
  return _.zipObject(sortable, bs);
}

