var expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    crossCount = require("../../lib/order/cross-count");

describe("crossCount", function() {
  var g;

  beforeEach(function() {
    g = new Graph()
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  it("returns 0 for an empty layering", function() {
    expect(crossCount(g, [])).equals(0);
  });

  it("returns 0 for a layering with no crossings", function() {
    g.setEdge("a1", "b1");
    g.setEdge("a2", "b2");
    expect(crossCount(g, [["a1", "a2"], ["b1", "b2"]])).equals(0);
  });

  it("returns 1 for a layering with 1 crossing", function() {
    g.setEdge("a1", "b1");
    g.setEdge("a2", "b2");
    expect(crossCount(g, [["a1", "a2"], ["b2", "b1"]])).equals(1);
  });

  it("returns a weighted crossing count for a layering with 1 crossing", function() {
    g.setEdge("a1", "b1", { weight: 2 });
    g.setEdge("a2", "b2", { weight: 3 });
    expect(crossCount(g, [["a1", "a2"], ["b2", "b1"]])).equals(6);
  });

  it("calculates crossings across layers", function() {
    g.setPath(["a1", "b1", "c1"]);
    g.setPath(["a2", "b2", "c2"]);
    expect(crossCount(g, [["a1", "a2"], ["b2", "b1"], ["c1", "c2"]])).equals(2);
  });
});
