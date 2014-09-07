var _ = require("lodash"),
    expect = require("./chai").expect,
    position = require("../lib/position"),
    Digraph = require("graphlib").Digraph;
 
describe("position", function() {
  var g;

  beforeEach(function() {
    g = new Digraph().setGraph({});
  });

  it("aligns a single node to the upper left corner when there are no margins", function() {
    g.setNode("a", { width: 50, height: 100 });
    position(g);
    expect(g.getNode("a").x).to.equal(50 / 2);
    expect(g.getNode("a").y).to.equal(100 / 2);
  });

  it("shifts a single node if margins are used", function() {
    g.getGraph().marginX = 5;
    g.getGraph().marginY = 10;
    g.setNode("a", { width: 50, height: 100 });
    position(g);
    expect(g.getNode("a").x).to.equal(50 / 2 + 5);
    expect(g.getNode("a").y).to.equal(100 / 2 + 10);
  });

  it("sets dimension info", function() {
    g.getGraph().marginX = 5;
    g.getGraph().marginY = 10;
    g.setNode("a", { width: 50, height: 100 });
    position(g);
    expect(g.getGraph().width).to.equal(50 + 5 * 2);
    expect(g.getGraph().height).to.equal(100 + 10 * 2);
  });
});
