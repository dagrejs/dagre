var expect = require("../chai").expect;
var Graph = require("@dagrejs/graphlib").Graph;
var initOrder = require("../../lib/order/init-order");

describe("order/initOrder", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true })
      .setDefaultEdgeLabel(() => ({ weight: 1 }));
  });

  it("assigns non-overlapping orders for each rank in a tree", function() {
    Object.entries({ a: 0, b: 1, c: 2, d: 2, e: 1 }).forEach(([v, rank]) => {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setEdge("a", "e");

    var layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(layering[1].sort()).to.eql(["b", "e"]);
    expect(layering[2].sort()).to.eql(["c", "d"]);
  });

  it("assigns non-overlapping orders for each rank in a DAG", function() {
    Object.entries({ a: 0, b: 1, c: 1, d: 2}).forEach(([v, rank]) => {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    var layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(layering[1].sort()).to.eql(["b", "c"]);
    expect(layering[2].sort()).to.eql(["d"]);
  });

  it("does not assign an order to subgraph nodes", function() {
    g.setNode("a", { rank: 0 });
    g.setNode("sg1", {});
    g.setParent("a", "sg1");

    var layering = initOrder(g);
    expect(layering).to.eql([["a"]]);
  });
});
