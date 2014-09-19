var _ = require("lodash"),
    barycenter = require("./barycenter");

module.exports = sortSubgraph;

function sortSubgraph(g, v, biasRight) {
  var movable = g.getChildren(v),
      subgraphs = {};

  _.each(movable, function(v) {
    if (g.getChildren(v).length) {
      subgraphs[v] = sortSubgraph(g, v, biasRight);
    }
  });

  barycenter(g, movable);

  _.each(subgraphs, function(entry, v) {
    if (!_.isUndefined(entry.barycenter)) {
      mergeBarycenters(g.getNode(v), entry);
    }
  });

  var sorted = [];
  _.each(movable, function(v, i) {
    var node = g.getNode(v);
    if (!_.isUndefined(node.barycenter)) {
      sorted.push({ v: v, barycenter: g.getNode(v).barycenter, i: i });
    }
  });

  sorted.sort(compareWithBias(biasRight));

  return buildResult(g, movable, sorted, subgraphs);
}

function buildResult(g, vs, sorted, subgraphs) {
  var i = 0,
      barycenterSum = 0,
      barycenterWeight = 0;

  _.each(vs, function(v, j) {
    var node = g.getNode(v);
    if (!_.isUndefined(node.barycenter)) {
      barycenterSum += (node.barycenter * node.barycenterWeight);
      barycenterWeight += node.barycenterWeight;
      v = sorted[i++].v;
    }
    vs[j] = subgraphs[v] ? subgraphs[v].list : v;
  });

  var result = { list: _.flatten(vs, true) };
  if (barycenterWeight) {
    result.barycenter = barycenterSum / barycenterWeight;
    result.barycenterWeight = barycenterWeight;
  }
  return result;
}

function mergeBarycenters(target, other) {
  if (!_.isUndefined(target.barycenter)) {
    target.barycenter = (target.barycenter * target.barycenterWeight +
                         other.barycenter * other.barycenterWeight) /
                        (target.barycenterWeight + other.barycenterWeight);
    target.barycenterWeight += other.barycenterWeight;
  } else {
    target.barycenter = other.barycenter;
    target.barycenterWeight = other.barycenterWeight;
  }
}

function compareWithBias(bias) {
  return function(v, w) {
    if (v.barycenter < w.barycenter) {
      return -1;
    } else if (v.barycenter > w.barycenter) {
      return 1;
    }

    return !bias ? v.i - w.i : w.i - v.i;
  };
}
