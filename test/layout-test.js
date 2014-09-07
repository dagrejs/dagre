var expect = require("./chai").expect,
    layout = require("..").layout,
    Digraph = require("graphlib").Digraph;

describe("layout", function() {
  var g;

  beforeEach(function() {
    g = new Digraph().setGraph({});
  });

  it("can layout a single node", function() {
    g.setNode("a", { width: 50, height: 100 });
    layout(g);
    expect(g.getNode("a").x).to.equal(50 / 2);
    expect(g.getNode("a").y).to.equal(100 / 2);
  });
});
