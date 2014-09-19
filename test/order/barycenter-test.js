var expect = require("../chai").expect,
    barycenter = require("../../lib/order/barycenter"),
    Graph = require("graphlib").Graph;

describe("order/barycenter", function() {
  var g;

  beforeEach(function() {
    g = new Graph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  it("assigns an undefined barycenter for a node with no predecessors", function() {
    g.setNode("x", {});

    barycenter(g, ["x"]);
    expect(g.getNode("x").barycenter).to.be.undefined;
    expect(g.getNode("x").barycenterWeight).to.be.undefined;
  });

  it("assigns the position of the sole predecessors", function() {
    g.setNode("a", { order: 2 });
    g.setEdge("a", "x");

    barycenter(g, ["x"]);
    expect(g.getNode("x")).eqls({ barycenter: 2, barycenterWeight: 1 });
  });

  it("assigns the average of multiple predecessors", function() {
    g.setNode("a", { order: 2 });
    g.setNode("b", { order: 4 });
    g.setEdge("a", "x");
    g.setEdge("b", "x");

    barycenter(g, ["x"]);
    expect(g.getNode("x")).eqls({ barycenter: 3, barycenterWeight: 2 });
  });

  it("takes into account the weight of edges", function() {
    g.setNode("a", { order: 2 });
    g.setNode("b", { order: 4 });
    g.setEdge("a", "x", { weight: 3 });
    g.setEdge("b", "x");

    barycenter(g, ["x"]);
    expect(g.getNode("x")).eqls({ barycenter: 2.5, barycenterWeight: 4 });
  });

  it("calculates barycenters for all nodes in the movable layer", function() {
    g.setNode("a", { order: 1 });
    g.setNode("b", { order: 2 });
    g.setNode("c", { order: 4 });
    g.setEdge("a", "x");
    g.setEdge("b", "x");
    g.setNode("y");
    g.setEdge("a", "z", { weight: 2 });
    g.setEdge("c", "z");

    barycenter(g, ["x", "y", "z"]);
    expect(g.getNode("x")).eqls({ barycenter: 1.5, barycenterWeight: 2 });
    expect(g.getNode("y").barycenter).to.be.undefined;
    expect(g.getNode("z")).eqls({ barycenter: 2, barycenterWeight: 3 });
  });
});
