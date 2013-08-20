var common = require("./common"),
    assert = require("chai").assert,
    util = common.requireSrc("./lib/util"),
    graph = common.requireSrc("./lib/graph");

describe("util.sum", function() {
  it("returns the sum of all elements in the array", function() {
    assert.equal(util.sum([1,2,3,4]), 10);
  });

  it("returns 0 if there are no elements in the array", function() {
    assert.equal(util.sum([]), 0);
  });
});
