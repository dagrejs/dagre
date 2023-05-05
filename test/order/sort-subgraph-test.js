var expect = require("../chai").expect;
var sortSubgraph = require("../../lib/order/sort-subgraph");
var Graph = require("@dagrejs/graphlib").Graph;

describe("order/sortSubgraph", function() {
  var g, cg;

  beforeEach(function() {
    g = new Graph({ compound: true })
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({ weight: 1 }));
    [0, 1, 2, 3, 4].forEach(v => g.setNode(v, { order: v }));
    cg = new Graph();
  });

  it("sorts a flat subgraph based on barycenter", function() {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    ["x", "y"].forEach(function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["y", "x"]);
  });

  it("preserves the pos of a node (y) w/o neighbors in a flat subgraph", function() {
    g.setEdge(3, "x");
    g.setNode("y");
    g.setEdge(1, "z", { weight: 2 });
    g.setEdge(4, "z");
    ["x", "y", "z"].forEach(function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["z", "y", "x"]);
  });

  it("biases to the left without reverse bias", function() {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    ["x", "y"].forEach(function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "y"]);
  });

  it("biases to the right with reverse bias", function() {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    ["x", "y"].forEach(function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg, true).vs).eqls(["y", "x"]);
  });

  it("aggregates stats about the subgraph", function() {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    ["x", "y"].forEach(function(v) { g.setParent(v, "movable"); });

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
    ["x", "y", "z"].forEach(function(v) { g.setParent(v, "movable"); });

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
    ["x", "y", "z"].forEach(function(v) { g.setParent(v, "movable"); });

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
    ["x", "y", "z"].forEach(function(v) { g.setParent(v, "movable"); });

    expect(sortSubgraph(g, "movable", cg).vs).eqls(["x", "a", "b", "c", "z"]);
  });

  it("sorts border nodes to the extremes of the subgraph", function() {
    g.setEdge(0, "x");
    g.setEdge(1, "y");
    g.setEdge(2, "z");
    g.setNode("sg1", { borderLeft: "bl", borderRight: "br" });
    ["x", "y", "z", "bl", "br"].forEach(function(v) { g.setParent(v, "sg1"); });
    expect(sortSubgraph(g, "sg1", cg).vs).eqls(["bl", "x", "y", "z", "br"]);
  });

  it("assigns a barycenter to a subgraph based on previous border nodes", function() {
    g.setNode("bl1", { order: 0 });
    g.setNode("br1", { order: 1 });
    g.setEdge("bl1", "bl2");
    g.setEdge("br1", "br2");
    ["bl2", "br2"].forEach(function(v) { g.setParent(v, "sg"); });
    g.setNode("sg", { borderLeft: "bl2", borderRight: "br2" });
    expect(sortSubgraph(g, "sg", cg)).eqls({
      barycenter: 0.5,
      weight: 2,
      vs: ["bl2", "br2"]
    });
  });
});
