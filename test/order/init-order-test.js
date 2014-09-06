var _ = require("lodash"),
    expect = require("../chai").expect,
    Digraph = require("graphlib").Digraph,
    initOrder = require("../../lib/order/init-order"),
    util = require("../../lib/util");

describe("order/initOrder", function() {
  var g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  it("assigns non-overlapping orders for each rank in a tree", function() {
    _.each({ a: 0, b: 1, c: 2, d: 2, e: 1 }, function(rank, v) {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setEdge("a", "e");
    initOrder(g);

    var layering = util.buildLayerMatrix(g);
    expect(layering[0]).to.eql(["a"]);
    expect(_.sortBy(layering[1])).to.eql(["b", "e"]);
    expect(_.sortBy(layering[2])).to.eql(["c", "d"]);
  });

  it("assigns non-overlapping orders for each rank in a DAG", function() {
    _.each({ a: 0, b: 1, c: 1, d: 2 }, function(rank, v) {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);
    initOrder(g);

    var layering = util.buildLayerMatrix(g);
    expect(layering[0]).to.eql(["a"]);
    expect(_.sortBy(layering[1])).to.eql(["b", "c"]);
    expect(_.sortBy(layering[2])).to.eql(["d"]);
  });
});
