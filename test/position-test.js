var _ = require("lodash"),
    expect = require("./chai").expect,
    position = require("../lib/position"),
    Graph = require("graphlib").Graph;

describe("position", function() {
  var g;

  beforeEach(function() {
    g = new Graph().setGraph({});
  });

  it("aligns a single node to the upper left corner when there are no margins", function() {
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.getNode("a").x).to.equal(50 / 2);
    expect(g.getNode("a").y).to.equal(100 / 2);
  });

  it("shifts a single node if margins are used", function() {
    g.getGraph().marginx = 5;
    g.getGraph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.getNode("a").x).to.equal(50 / 2 + 5);
    expect(g.getNode("a").y).to.equal(100 / 2 + 10);
  });

  it("sets dimension info", function() {
    g.getGraph().marginx = 5;
    g.getGraph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position(g);
    expect(g.getGraph().width).to.equal(50 + 5 * 2);
    expect(g.getGraph().height).to.equal(100 + 10 * 2);
  });

  it("respects ranksep", function() {
    g.getGraph().ranksep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 50, height:  80, rank: 1, order: 0 });
    g.setEdge("a", "b");
    position(g);
    expect(g.getNode("b").y).to.equal(100 + 1000 + 80 / 2);
  });

  it("use the largest height in each rank with ranksep", function() {
    g.getGraph().ranksep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 50, height:  80, rank: 0, order: 1 });
    g.setNode("c", { width: 50, height:  90, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(g.getNode("a").y).to.equal(100 / 2);
    expect(g.getNode("b").y).to.equal(100 / 2); // Note we used 100 and not 80 here
    expect(g.getNode("c").y).to.equal(100 + 1000 + 90 / 2);
  });

  it("respects nodesep", function() {
    g.getGraph().nodesep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 70, height:  80, rank: 0, order: 1 });
    position(g);
    expect(g.getNode("b").x).to.equal(50 + 1000 + 70 / 2);
  });

  it("can position nodes with rankdir=BT", function() {
    g.getGraph().rankdir = "BT";
    g.getGraph().ranksep = 30;
    g.getGraph().nodesep = 20;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 55, height:  75, rank: 0, order: 1 });
    g.setNode("c", { width: 70, height:  60, rank: 1, order: 0 });
    g.setEdge("a", "c");
    position(g);
    expect(_.pick(g.getNode("c"), ["x", "y"]))
      .eqls({ x: 70 / 2,                        y: 60 / 2 });
    expect(_.pick(g.getNode("a"), ["x", "y"]))
      .eqls({ x: 70 / 2,                        y: 60 + 30 + 100 / 2 });
    expect(_.pick(g.getNode("b"), ["x", "y"]))
      .eqls({ x: 70 / 2 + 50 / 2 + 20 + 55 / 2, y: 60  + 30 + 100 / 2 });
  });
});
