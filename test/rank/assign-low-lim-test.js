var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    assignLowLim = require("../../lib/rank/assign-low-lim");

describe("rank/assignLowLim", function() {
  it("assigns low, lim, and parent for each node in a tree", function() {
    var g = new Graph()
      .updateNodes(["a", "b", "c", "d", "e"], function() { return {}; })
      .setPath(["a", "b", "a", "c", "d", "c", "e"]);

    assignLowLim(g, "a");

    var a = g.getNode("a"),
        b = g.getNode("b"),
        c = g.getNode("c"),
        d = g.getNode("d"),
        e = g.getNode("e");

    expect(_.sortBy(_.map(g.nodes(), function(node) { return node.label.lim; })))
      .to.eql(_.range(1, 6));

    expect(a).to.eql({ low: 1, lim: 5 });

    expect(b.parent).to.equal("a");
    expect(b.lim).to.be.lt(a.lim);

    expect(c.parent).to.equal("a");
    expect(c.lim).to.be.lt(a.lim);
    expect(c.lim).to.not.equal(b.lim);

    expect(d.parent).to.equal("c");
    expect(d.lim).to.be.lt(c.lim);

    expect(e.parent).to.equal("c");
    expect(e.lim).to.be.lt(c.lim);
    expect(e.lim).to.not.equal(d.lim);
  });
});
