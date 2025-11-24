let sortSubgraph = require("../../lib/order/sort-subgraph");
let Graph = require("@dagrejs/graphlib").Graph;

describe("order/sortSubgraph", () => {
  let g, cg;

  beforeEach(() => {
    g = new Graph({ compound: true })
      .setDefaultNodeLabel(() => ({}))
      .setDefaultEdgeLabel(() => ({ weight: 1 }));
    [0, 1, 2, 3, 4].forEach(v => g.setNode(v, { order: v }));
    cg = new Graph();
  });

  it("sorts a flat subgraph based on barycenter", () => {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    ["x", "y"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["y", "x"]);
  });

  it("preserves the pos of a node (y) w/o neighbors in a flat subgraph", () => {
    g.setEdge(3, "x");
    g.setNode("y");
    g.setEdge(1, "z", { weight: 2 });
    g.setEdge(4, "z");
    ["x", "y", "z"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["z", "y", "x"]);
  });

  it("biases to the left without reverse bias", () => {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    ["x", "y"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["x", "y"]);
  });

  it("biases to the right with reverse bias", () => {
    g.setEdge(1, "x");
    g.setEdge(1, "y");
    ["x", "y"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg, true).vs).toEqual(["y", "x"]);
  });

  it("aggregates stats about the subgraph", () => {
    g.setEdge(3, "x");
    g.setEdge(1, "y", { weight: 2 });
    g.setEdge(4, "y");
    ["x", "y"].forEach(v => g.setParent(v, "movable"));

    let results = sortSubgraph(g, "movable", cg);
    expect(results.barycenter).toBe(2.25);
    expect(results.weight).toBe(4);
  });

  it("can sort a nested subgraph with no barycenter", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    ["x", "y", "z"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["x", "z", "a", "b", "c"]);
  });

  it("can sort a nested subgraph with a barycenter", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a", { weight: 3 });
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    g.setEdge(2, "y");
    ["x", "y", "z"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["x", "a", "b", "c", "z"]);
  });

  it("can sort a nested subgraph with no in-edges", () => {
    g.setNodes(["a", "b", "c"]);
    g.setParent("a", "y");
    g.setParent("b", "y");
    g.setParent("c", "y");
    g.setEdge(0, "a");
    g.setEdge(1, "b");
    g.setEdge(0, "x");
    g.setEdge(1, "z");
    ["x", "y", "z"].forEach(v => g.setParent(v, "movable"));

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["x", "a", "b", "c", "z"]);
  });

  it("sorts border nodes to the extremes of the subgraph", () => {
    g.setEdge(0, "x");
    g.setEdge(1, "y");
    g.setEdge(2, "z");
    g.setNode("sg1", { borderLeft: "bl", borderRight: "br" });
    ["x", "y", "z", "bl", "br"].forEach(v => g.setParent(v, "sg1"));
    expect(sortSubgraph(g, "sg1", cg).vs).toEqual(["bl", "x", "y", "z", "br"]);
  });

  it("assigns a barycenter to a subgraph based on previous border nodes", () => {
    g.setNode("bl1", { order: 0 });
    g.setNode("br1", { order: 1 });
    g.setEdge("bl1", "bl2");
    g.setEdge("br1", "br2");
    ["bl2", "br2"].forEach(v => g.setParent(v, "sg"));
    g.setNode("sg", { borderLeft: "bl2", borderRight: "br2" });
    expect(sortSubgraph(g, "sg", cg)).toEqual({
      barycenter: 0.5,
      weight: 2,
      vs: ["bl2", "br2"]
    });
  });
});
