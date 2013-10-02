var assert = require("../../assert"),
    Digraph = require("graphlib").Digraph,
    crossCount = require("../../../lib/order/crossCount");

describe("crossCount", function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
  });

  it("calculates 0 crossings for an empty graph", function() {
    assert.equal(crossCount(g), 0);
  });

  it("calculates 0 crossings for 2 layers with no crossings", function() {
    g.addNode("A1", { rank: 0, order: 0 });
    g.addNode("A2", { rank: 0, order: 1 });
    g.addNode("A3", { rank: 0, order: 2 });
    g.addNode("B1", { rank: 1, order: 0 });
    g.addNode("B2", { rank: 1, order: 1 });
    g.addNode("B3", { rank: 1, order: 2 });
    g.addEdge(null, "A1", "B1");
    g.addEdge(null, "A2", "B2");
    g.addEdge(null, "A3", "B3");
    assert.equal(crossCount(g), 0);
  });

  it("calculates correctly a simple crossing between two layers", function() {
    g.addNode("A1", { rank: 0, order: 0 });
    g.addNode("A2", { rank: 0, order: 1 });
    g.addNode("A3", { rank: 0, order: 2 });
    g.addNode("B1", { rank: 1, order: 0 });
    g.addNode("B2", { rank: 1, order: 1 });
    g.addEdge(null, "A1", "B1");
    g.addEdge(null, "A2", "B1");
    g.addEdge(null, "A2", "B2");
    g.addEdge(null, "A3", "B1");
    g.addEdge(null, "A3", "B2");

    // Expect 1 since A2 -> B2 crosses A3 -> B1
    assert.equal(crossCount(g), 1);
  });

  it("calculates correctly multiple crossings between two layers", function() {
    g.addNode("A1", { rank: 0, order: 0 });
    g.addNode("A2", { rank: 0, order: 1 });
    g.addNode("A3", { rank: 0, order: 2 });
    g.addNode("B1", { rank: 1, order: 0 });
    g.addNode("B2", { rank: 1, order: 1 });
    g.addEdge(null, "A1", "B2");
    g.addEdge(null, "A2", "B1");
    g.addEdge(null, "A2", "B2");
    g.addEdge(null, "A3", "B1");
    g.addEdge(null, "A3", "B2");

    // Expect 3 since A1 -> B2 crosses both A2 -> B1 and A3 -> B1, and A2 -> B2 crosses A3 -> B1.
    assert.equal(crossCount(g), 3);
  });

  it("calculates correctly crossings between three layers", function() {
    g.addNode("A1", { rank: 0, order: 0 });
    g.addNode("A2", { rank: 0, order: 1 });
    g.addNode("B1", { rank: 1, order: 0 });
    g.addNode("B2", { rank: 1, order: 1 });
    g.addNode("C1", { rank: 2, order: 0 });
    g.addNode("C2", { rank: 2, order: 1 });
    g.addEdge(null, "A1", "B2");
    g.addEdge(null, "A2", "B1");
    g.addEdge(null, "B1", "C2");
    g.addEdge(null, "B2", "C1");

    // Expect 2 since A1 -> B2 crosses A2 -> B1, and B1 -> C2 crosses B2 -> C1.
    assert.equal(crossCount(g), 2);
  });
});
