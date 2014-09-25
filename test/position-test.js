var _ = require("lodash"),
    expect = require("./chai").expect,
    position = require("../lib/position"),
    Graph = require("graphlib").Graph;

describe("position", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true }).setGraph({
      ranksep: 50,
      nodesep: 50,
      edgesep: 10
    });
  });

  it("aligns a single node to the upper left corner when there are no margins", function() {
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.node("a").x).to.equal(50 / 2);
    expect(g.node("a").y).to.equal(100 / 2);
  });

  it("shifts a single node if margins are used", function() {
    g.graph().marginx = 5;
    g.graph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.node("a").x).to.equal(50 / 2 + 5);
    expect(g.node("a").y).to.equal(100 / 2 + 10);
  });

  it("sets dimension info", function() {
    g.graph().marginx = 5;
    g.graph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.graph().width).to.equal(50 + 5 * 2);
    expect(g.graph().height).to.equal(100 + 10 * 2);
  });

  it("respects ranksep", function() {
    g.graph().ranksep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 50, height:  80, rank: 1, order: 0 });
    g.setEdge("a", "b");
    position(g);
    expect(g.node("b").y).to.equal(100 + 1000 + 80 / 2);
  });

  it("use the largest height in each rank with ranksep", function() {
    g.graph().ranksep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 50, height:  80, rank: 0, order: 1 });
    g.setNode("c", { width: 50, height:  90, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(g.node("a").y).to.equal(100 / 2);
    expect(g.node("b").y).to.equal(100 / 2); // Note we used 100 and not 80 here
    expect(g.node("c").y).to.equal(100 + 1000 + 90 / 2);
  });

  it("respects nodesep", function() {
    g.graph().nodesep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 70, height:  80, rank: 0, order: 1 });
    position(g);
    expect(g.node("b").x).to.equal(50 + 1000 + 70 / 2);
  });

  it("can position nodes with rankdir=BT", function() {
    g.graph().rankdir = "BT";
    g.graph().ranksep = 30;
    g.graph().nodesep = 20;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 55, height:  75, rank: 0, order: 1 });
    g.setNode("c", { width: 70, height:  60, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(_.pick(g.node("c"), ["x", "y"]))
      .eqls({ x: 70 / 2,                        y: 60 / 2 });
    expect(_.pick(g.node("a"), ["x", "y"]))
      .eqls({ x: 70 / 2,                        y: 60 + 30 + 100 / 2 });
    expect(_.pick(g.node("b"), ["x", "y"]))
      .eqls({ x: 70 / 2 + 50 / 2 + 20 + 55 / 2, y: 60  + 30 + 100 / 2 });
  });

  it("can position nodes with rankdir=LR", function() {
    g.graph().rankdir = "LR";
    g.graph().ranksep = 30;
    g.graph().nodesep = 20;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 55, height:  75, rank: 0, order: 1 });
    g.setNode("c", { width: 70, height:  60, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(_.pick(g.node("a"), ["x", "y"]))
      .eqls({ x: 55 / 2,                        y: 100 / 2 });
    expect(_.pick(g.node("b"), ["x", "y"]))
      .eqls({ x: 55 / 2,                        y: 100 + 20 + 75 / 2 });
    // Note that the x coordinate is the max width from the previous layer. We
    // only compact horizontally (in the original TB layout), never vertically.
    expect(_.pick(g.node("c"), ["x", "y"]))
      .eqls({ x: 55 + 30 + 70 / 2,              y: 100 / 2 });
  });

  it("can position nodes with rankdir=RL", function() {
    g.graph().rankdir = "RL";
    g.graph().ranksep = 30;
    g.graph().nodesep = 20;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 55, height:  75, rank: 0, order: 1 });
    g.setNode("c", { width: 70, height:  60, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(_.pick(g.node("c"), ["x", "y"]))
      .eqls({ x: 70 / 2,                        y: 100 / 2 });
    // Note that the x coordinate is the max width from the previous layer. We
    // only compact horizontally (in the original TB layout), never vertically.
    expect(_.pick(g.node("a"), ["x", "y"]))
      .eqls({ x: 70 + 30 + 55 / 2,              y: 100 / 2 });
    expect(_.pick(g.node("b"), ["x", "y"]))
      .eqls({ x: 70 + 30 + 55 / 2,              y: 100 + 20 + 75 / 2 });
  });

  it("should not try to position the subgraph node itself", function() {
    g.setNode("a", { width: 50, height: 50, rank: 0, order: 0 });
    g.setNode("sg1", {});
    g.setParent("a", "sg1");
    position(g);
    expect(g.node("sg1")).to.not.have.property("x");
    expect(g.node("sg1")).to.not.have.property("y");
  });
});
