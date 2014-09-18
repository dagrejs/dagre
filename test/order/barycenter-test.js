var expect = require("../chai").expect,
    barycenter = require("../../lib/order/barycenter");

describe("order/barycenter", function() {
  it("does not assign a value to nodes with no adjacencies", function() {
    var fixed = [],
        movable = ["a"],
        neighbors = {};

    var results = barycenter(fixed, movable, neighbors);
    expect(results).to.not.have.property("a");
  });

  it("assigns the position of the sole adjacency", function() {
    var fixed = ["a", "b", "c"],
        movable = ["x"],
        neighbors = { x: { c: 1 } };

    var results = barycenter(fixed, movable, neighbors);
    expect(results.x).to.eql({ barycenter: 2, weight: 1 });
  });

  it("assigns the average of multiple adjacencies", function() {
    var fixed = ["a", "b", "c", "d", "e"],
        movable = ["x"],
        neighbors = { x: { c: 1, e: 1 } };

    var results = barycenter(fixed, movable, neighbors);
    expect(results.x).to.eql({ barycenter: 3, weight: 2 });
  });

  it("takes into account the weight of edges", function() {
    var fixed = ["a", "b", "c", "d", "e"],
        movable = ["x"],
        neighbors = { x: { c: 3, e: 1 } };

    var results = barycenter(fixed, movable, neighbors);
    expect(results.x).to.eql({ barycenter: 2.5, weight: 4 });
  });

  it("calculates barycenters for all nodes in the movable layer", function() {
    var fixed = ["a", "b", "c", "d", "e"],
        movable = ["x", "y", "z"],
        neighbors = { x: { b: 1, c: 1 }, z: { b: 2, e: 1 } };

    var results = barycenter(fixed, movable, neighbors);
    expect(results.x).to.eql({ barycenter: 1.5, weight: 2 });
    expect(results.y).to.be.undefined;
    expect(results.z).to.eql({ barycenter: 2, weight: 3 });
  });
});
