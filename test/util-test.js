var common = require("./common"),
    assert = require("chai").assert,
    util = require("../lib/util"),
    graph = require("../lib/Graph");

describe("util.sum", function() {
  it("returns the sum of all elements in the array", function() {
    assert.equal(util.sum([1,2,3,4]), 10);
  });

  it("returns 0 if there are no elements in the array", function() {
    assert.equal(util.sum([]), 0);
  });
});

describe("util.all", function() {
  it("returns true if f(x) holds for all x in xs", function() {
    assert.isTrue(util.all([1,2,3,4], function(x) {
      return x > 0;
    }));
  });

  it("returns false if f(x) does not hold for all x in xs", function() {
    assert.isFalse(util.all([1,2,3,-1], function(x) {
      return x > 0;
    }));
  });

  it("fails fast if f(x) does not hold for all x in xs", function() {
    var lastSeen;
    assert.isFalse(util.all([1,2,-1,3,4], function(x) {
      lastSeen = x;
      return x > 0;
    }));
    assert.equal(lastSeen, -1);
  });
});
