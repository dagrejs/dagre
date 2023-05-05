module.exports = barycenter;

function barycenter(g, movable = []) {
  return movable.map(v => {
    var inV = g.inEdges(v);
    if (!inV.length) {
      return { v: v };
    } else {
      var result = inV.reduce((acc, e) => {
        var edge = g.edge(e),
          nodeU = g.node(e.v);
        return {
          sum: acc.sum + (edge.weight * nodeU.order),
          weight: acc.weight + edge.weight
        };
      }, { sum: 0, weight: 0 });

      return {
        v: v,
        barycenter: result.sum / result.weight,
        weight: result.weight
      };
    }
  });
}

