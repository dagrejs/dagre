var _ = require("lodash"),
    expect = require("../chai").expect,
    sortSubgraph = require("../../lib/order/sort-subgraph"),
    Graph = require("graphlib").Graph;

describe("order/sortSubgraph", function() {
  var g, cg;

  beforeEach(function() {
    g = new Graph({ compound: true })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
    _.each(_.range(5), function(v) { g.setNode(v, { order: v }); });
    cg = new Graph();
  });

  it("sorts a flat subgraph based on barycenter", function() {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    _.each(["x", "y"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["y", "x"]);
  });

  it("preserves the pos of a node (y) w/o neighbors in a flat subgraph", function() {
    g.setEdge(3, "x");
    g.setNode("y");
    g.setEdge(1, "z", { weight: 2 });
    g.setEdge(4, "z");
    _.each(["x", "y", "z"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["z", "y", "x"]);
  });

  it("biases to the left without reverse bias", function() {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    _.each(["x", "y"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "y"]);
  });

  it("biases to the right with reverse bias", function() {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    _.each(["x", "y"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg, true).vs).eqls(["y", "x"]);
  });

  it("aggregates stats about the subgraph", function() {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    _.each(["x", "y"], function(v) { g.setParent(v, "movable"); });

    var results = sortSubgraph(g, "movable", cg);
    expect(results.barycenter).to.equal(2.25);
    expect(results.weight).to.equal(4);
  });

  it("can sort a nested subgraph with no barycenter", function() {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    _.each(["x", "y", "z"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "z", "a", "b", "c"]);
  });

  it("can sort a nested subgraph with a barycenter", function() {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a", { weight: 3 });
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    _.each(["x", "y", "z"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "a", "b", "c", "z"]);
  });

  it("can sort a nested subgraph with no in-edges", function() {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a");
    g.setEdge(1, "b");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    _.each(["x", "y", "z"], function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "a", "b", "c", "z"]);
  });
});
