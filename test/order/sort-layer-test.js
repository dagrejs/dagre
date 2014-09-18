var expect = require("../chai").expect,
    sortLayer = require("../../lib/order/sort-layer");

describe("order/sortLayer", function() {
  it("sorts based on barycenter", function() {
    var fixed = ["b1", "b2", "b3"],
        movable = ["a3", "a2", "a1"],
        neighbors = { a1: { b1: 1 }, a2: { b2: 1 }, a3: { b3: 1 } };
    sortLayer(fixed, movable, neighbors);
    expect(movable).eqls(["a1", "a2", "a3"]);
  });

  it("sorts around nodes with no neighbors", function() {
    var fixed = ["b1", "b2", "b3"],
        movable = ["a4", "a3", "a2", "a1"],
        neighbors = { a1: { b1: 1 }, a2: { b2: 1 }, a4: { b3: 1 } };
    sortLayer(fixed, movable, neighbors);
    expect(movable).eqls(["a1", "a3", "a2", "a4"]);
  });

  it("handles multiple edges", function() {
    var fixed = ["b1", "b2"],
        movable = ["a3", "a2", "a1"],
        neighbors = { a1: { b1: 1, b2: 1 }, a2: { b1: 1 }, a3: { b2: 1 } };
    sortLayer(fixed, movable, neighbors);
    expect(movable).eqls(["a2", "a1", "a3"]);
  });

  it("accounts for weights", function() {
    var fixed = ["b1", "b2"],
        movable = ["a2", "a3", "a1"],
        neighbors = { a1: { b1: 2, b2: 1 }, a2: { b1: 1, b2: 1 }, a3: { b1: 1, b2: 2 } };
    sortLayer(fixed, movable, neighbors);
    expect(movable).eqls(["a1", "a2", "a3"]);
  });

  it("biases to the left without reverse bias", function() {
    var fixed = ["b1"],
        movable = ["a2", "a1"],
        neighbors = { a1: { b1: 1 }, a2: { b1: 1 } };
    sortLayer(fixed, movable, neighbors, false);
    expect(movable).eqls(["a2", "a1"]);
  });

  it("biases to the right with reverse bias", function() {
    var fixed = ["b1"],
        movable = ["a2", "a1"],
        neighbors = { a1: { b1: 1 }, a2: { b1: 1 } };
    sortLayer(fixed, movable, neighbors, true);
    expect(movable).eqls(["a1", "a2"]);
  });
});
