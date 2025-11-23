var addBorderSegments = require("../lib/add-border-segments");
var Graph = require("@dagrejs/graphlib").Graph;

describe("addBorderSegments", () => {
  var g;

  beforeEach(() => g = new Graph({ compound: true }));

  it("does not add border nodes for a non-compound graph", () => {
    var g = new Graph();
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).toBe(1);
    expect(g.node("a")).toEqual({ rank: 0 });
  });

  it("does not add border nodes for a graph with no clusters", () => {
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).toBe(1);
    expect(g.node("a")).toEqual({ rank: 0 });
  });

  it("adds a border for a single-rank subgraph", () => {
    g.setNode("sg", { minRank: 1, maxRank: 1 });
    addBorderSegments(g);

    var bl = g.node("sg").borderLeft[1];
    var br = g.node("sg").borderRight[1];
    expect(g.node(bl)).toEqual({
      dummy: "border", borderType: "borderLeft",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(bl)).toBe("sg");
    expect(g.node(br)).toEqual({
      dummy: "border", borderType: "borderRight",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(br)).toBe("sg");
  });

  it("adds a border for a multi-rank subgraph", () => {
    g.setNode("sg", { minRank: 1, maxRank: 2 });
    addBorderSegments(g);

    var sgNode = g.node("sg");
    var bl2 = sgNode.borderLeft[1];
    var br2 = sgNode.borderRight[1];
    expect(g.node(bl2)).toEqual({
      dummy: "border", borderType: "borderLeft",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(bl2)).toBe("sg");
    expect(g.node(br2)).toEqual({
      dummy: "border", borderType: "borderRight",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(br2)).toBe("sg");

    var bl1 = sgNode.borderLeft[2];
    var br1 = sgNode.borderRight[2];
    expect(g.node(bl1)).toEqual({
      dummy: "border", borderType: "borderLeft",
      rank: 2, width: 0, height: 0 });
    expect(g.parent(bl1)).toBe("sg");
    expect(g.node(br1)).toEqual({
      dummy: "border", borderType: "borderRight",
      rank: 2, width: 0, height: 0 });
    expect(g.parent(br1)).toBe("sg");

    expect(g.hasEdge(sgNode.borderLeft[1], sgNode.borderLeft[2])).toBe(true);
    expect(g.hasEdge(sgNode.borderRight[1], sgNode.borderRight[2])).toBe(true);
  });

  it("adds borders for nested subgraphs", () => {
    g.setNode("sg1", { minRank: 1, maxRank: 1 });
    g.setNode("sg2", { minRank: 1, maxRank: 1 });
    g.setParent("sg2", "sg1");
    addBorderSegments(g);

    var bl1 = g.node("sg1").borderLeft[1];
    var br1 = g.node("sg1").borderRight[1];
    expect(g.node(bl1)).toEqual({
      dummy: "border", borderType: "borderLeft",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(bl1)).toBe("sg1");
    expect(g.node(br1)).toEqual({
      dummy: "border", borderType: "borderRight",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(br1)).toBe("sg1");

    var bl2 = g.node("sg2").borderLeft[1];
    var br2 = g.node("sg2").borderRight[1];
    expect(g.node(bl2)).toEqual({
      dummy: "border", borderType: "borderLeft",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(bl2)).toBe("sg2");
    expect(g.node(br2)).toEqual({
      dummy: "border", borderType: "borderRight",
      rank: 1, width: 0, height: 0 });
    expect(g.parent(br2)).toBe("sg2");
  });
});
