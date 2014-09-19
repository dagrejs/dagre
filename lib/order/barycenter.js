var _ = require("lodash");

module.exports = barycenter;

function barycenter(g, movable) {
  _.each(movable, function(v) {
    var node = g.getNode(v),
        inV = g.inEdges(v);
    if (!inV.length) {
      delete node.barycenter;
      delete node.barycenterWeight;
    } else {
      var result = _.reduce(inV, function(acc, e) {
        var edge = g.getEdge(e),
            nodeU = g.getNode(e.v);
        return {
          sum: acc.sum + (edge.weight * nodeU.order),
          weight: acc.weight + edge.weight
        };
      }, { sum: 0, weight: 0 });
      node.barycenter = result.sum / result.weight;
      node.barycenterWeight = result.weight;
    }
  });
}

