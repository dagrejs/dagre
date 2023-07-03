var expect = require("../chai").expect;
var barycenter = require("../../lib/order/barycenter");
var Graph = require("@dagrejs/graphlib").Graph;

describe("order/barycenter", function() {
  var g;

  beforeEach(function() {
    g = new Graph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  it("assigns an undefined barycenter for a node with no predecessors", function() {
    g.setNode("x", {});

    var results = barycenter(g, ["x"]);
    expect(results).to.have.length(1);
    expect(results[0]).to.eql({ v: "x" });
  });

  it("assigns the position of the sole predecessors", function() {
    g.setNode("a", { order: 2 });
    g.setEdge("a", "x");

    var results = barycenter(g, ["x"]);
    expect(results).to.have.length(1);
    expect(results[0]).eqls({ v: "x", barycenter: 2, weight: 1 });
  });

  it("assigns the average of multiple predecessors", function() {
    g.setNode("a", { order: 2 });
    g.setNode("b", { order: 4 });
    g.setEdge("a", "x");
    g.setEdge("b", "x");

    var results = barycenter(g, ["x"]);
    expect(results).to.have.length(1);
    expect(results[0]).eqls({ v: "x", barycenter: 3, weight: 2 });
  });

  it("takes into account the weight of edges", function() {
    g.setNode("a", { order: 2 });
    g.setNode("b", { order: 4 });
    g.setEdge("a", "x", { weight: 3 });
    g.setEdge("b", "x");

    var results = barycenter(g, ["x"]);
    expect(results).to.have.length(1);
    expect(results[0]).eqls({ v: "x", barycenter: 2.5, weight: 4 });
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

    var results = barycenter(g, ["x", "y", "z"]);
    expect(results).to.have.length(3);
    expect(results[0]).eqls({ v: "x", barycenter: 1.5, weight: 2 });
    expect(results[1]).eqls({ v: "y" });
    expect(results[2]).eqls({ v: "z", barycenter: 2, weight: 3 });
  });
});
