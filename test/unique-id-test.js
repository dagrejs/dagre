var expect = require("./chai").expect;
var util = require("../lib/util.js");

describe("Given a function to generate unique identifiers", function () {
  it("uniqueId(name) generates a valid identifier", function () {
    // This test guards against a bug #477, where the call to toString(prefix) inside
    // uniqueId() produced [object undefined].
    var id = util.uniqueId("_root");
    expect(id).not.to.include('[object undefined]');
    expect(id).match(/_root\d+/);
  });

  it("Calling uniqueId(name) multiple times generate distinct values", function () {
    var first = util.uniqueId("name");
    var second = util.uniqueId("name");
    var third = util.uniqueId("name");
    expect(first).not.equals(second);
    expect(second).not.equals(third);
  });

  it("Calling uniqueId(number) with a number creates a valid identifier string", function() {
    var id = util.uniqueId(99);
    expect(id).to.be.a('string');
    expect(id).not.to.be.a('number');

    expect(id).to.match(/99\d+/);
  });
});
