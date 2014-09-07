var expect = require("./chai").expect,
    position = require("../lib/position"),
    Digraph = require("graphlib").Digraph;

describe("position", function() {
  var g;

  beforeEach(function() {
    g = new Digraph().setGraph({});
  });

  it("aligns a single node to the upper left corner when there are no margins", function() {
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position.run(g);
    expect(g.getNode("a").x).to.equal(50 / 2);
    expect(g.getNode("a").y).to.equal(100 / 2);
  });

  it("shifts a single node if margins are used", function() {
    g.getGraph().marginx = 5;
    g.getGraph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position.run(g);
    expect(g.getNode("a").x).to.equal(50 / 2 + 5);
    expect(g.getNode("a").y).to.equal(100 / 2 + 10);
  });

  it("sets dimension info", function() {
    g.getGraph().marginx = 5;
    g.getGraph().marginy = 10;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    position.run(g);
    expect(g.getGraph().width).to.equal(50 + 5 * 2);
    expect(g.getGraph().height).to.equal(100 + 10 * 2);
  });

  it("respects ranksep", function() {
    g.getGraph().ranksep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 50, height:  80, rank: 1, order: 0 });
    g.setEdge("a", "b");
    position.run(g);
    expect(g.getNode("b").y).to.equal(100 + 1000 + 80 / 2);
  });

  it("respects nodesep", function() {
    g.getGraph().nodesep = 1000;
    g.setNode("a", { width: 50, height: 100, rank: 0, order: 0 });
    g.setNode("b", { width: 70, height:  80, rank: 0, order: 1 });
    position.run(g);
    expect(g.getNode("b").x).to.equal(50 + 1000 + 70 / 2);
  });
});
