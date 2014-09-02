var expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    edgeIter = require("../../lib/rank/edge-iter"),
    leaveEdge = require("../../lib/rank/leave-edge");

describe("rank/leaveEdge", function() {
  it("returns undefined if there is no edge with a negative cutvalue", function() {
    var tree = new Graph();
    tree.setEdge("a", "b", { cutvalue: 1 });
    tree.setEdge("b", "c", { cutvalue: 1 });
    expect(leaveEdge(edgeIter(tree))).to.be.undefined;
  });

  it("returns an edge if one is found with a negative cutvalue", function() {
    var tree = new Graph();
    tree.setEdge("a", "b", { cutvalue: 1 });
    tree.setEdge("b", "c", { cutvalue: -1 });
    expect(leaveEdge(edgeIter(tree))).to.eql({ v: "b", w: "c", label: { cutvalue: -1 }});
  });
});
