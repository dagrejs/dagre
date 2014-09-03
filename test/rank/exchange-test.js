var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    Digraph = require("graphlib").Digraph,
    assignLowLim = require("../../lib/rank/low-lim").assign,
    exchange = require("../../lib/rank/exchange");

describe("rank/exchange", function() {
  it("exchanges edges and updates cut values and low/lim numbers", function() {
    var g = new Digraph()
            .setDefaultNodeLabel(function() { return {}; })
            .setDefaultEdgeLabel(function() { return { weight: 1 }; })
            .setPath(["a", "b", "c", "d", "h"])
            .setPath(["a", "e", "g", "h"])
            .setPath(["a", "f", "g"]),
        t = new Graph()
            .setDefaultNodeLabel(function() { return {}; })
            .setEdge("a", "b", { cutvalue: 3 })
            .setEdge("b", "c", { cutvalue: 3 })
            .setEdge("c", "d", { cutvalue: 3 })
            .setEdge("d", "h", { cutvalue: 3 })
            .setEdge("g", "h", { cutvalue: -1 })
            .setEdge("e", "g", { cutvalue: 0 })
            .setEdge("f", "g", { cutvalue: 0 });
    assignLowLim(t, "h");

    exchange(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });

    // check new cut values
    expect(t.getEdge("a", "b").cutvalue).to.equal(2);
    expect(t.getEdge("b", "c").cutvalue).to.equal(2);
    expect(t.getEdge("c", "d").cutvalue).to.equal(2);
    expect(t.getEdge("d", "h").cutvalue).to.equal(2);
    expect(t.getEdge("a", "e").cutvalue).to.equal(1);
    expect(t.getEdge("e", "g").cutvalue).to.equal(1);
    expect(t.getEdge("g", "f").cutvalue).to.equal(0);

    // ensure lim numbers look right
    var lims = _.sortBy(_.map(t.nodes(), function(node) { return node.label.lim; }));
    expect(lims).to.eql(_.range(1, 9));
  });
});
