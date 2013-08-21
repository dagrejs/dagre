var common = require("../common"),
    assert = require("chai").assert,
    Set = require("../../lib/data/Set");

describe("data/Set", function() {
  var set;
  beforeEach(function() {
    set = new Set();
    set.add("a");
    set.add("b");
    set.add("c");
  });

  describe("size", function() {
    it("returns the size of the set", function() {
      assert.equal(set.size(), 3);
    });
  });

  describe("keys", function() {
    it("returns the keys in the set as an array", function() {
      assert.deepEqual(set.keys().sort(), ["a", "b", "c"]);
    });
  });

  describe("has", function() {
    it("returns true if the key is in the set", function() {
      assert.isTrue(set.has("a"));
      assert.isTrue(set.has("b"));
      assert.isTrue(set.has("c"));
    });

    it("returns false if the key is not in the set", function() {
      assert.isFalse(set.has("foo"));
    });
  });

  describe("add", function() {
    it("adds the key to the set if it was not present", function() {
      assert.isFalse(set.has("foo"));
      assert.isTrue(set.add("foo"));
      assert.isTrue(set.has("foo"));
    });

    it("does nothing if the key was already in the set", function() {
      assert.isTrue(set.has("a"));
      assert.isFalse(set.add("a"));
      assert.isTrue(set.has("a"));
    });
  });

  describe("remove", function() {
    it("removes the key if it was in the set", function() {
      assert.isTrue(set.has("a"));
      assert.isTrue(set.remove("a"));
      assert.isFalse(set.has("a"));
    });

    it("does nothing if the key was not in the set", function() {
      assert.isFalse(set.has("foo"));
      assert.isFalse(set.remove("foo"));
      assert.isFalse(set.has("foo"));
    });
  });
});
