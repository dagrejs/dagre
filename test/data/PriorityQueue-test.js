var common = require("../common");

var PriorityQueue = common.requireSrc("./lib/data/PriorityQueue");

describe("PriorityQueue", function() {
  var pq;
  beforeEach(function() {
    pq = new PriorityQueue();
    pq.add("a", 5);
    pq.add("b", 3);
    pq.add("c", 8);
  });

  describe("size", function() {
    it("returns the size of the queue", function() {
      assert.equal(pq.size(), 3);
    });
  });

  describe("keys", function() {
    it("returns the keys in the queue", function() {
      assert.deepEqual(pq.keys().sort(), ["a", "b", "c"].sort());
    });
  });

  describe("has", function() {
    it("returns true if the key is present", function() {
      assert.isTrue(pq.has("a"));
      assert.isTrue(pq.has("b"));
      assert.isTrue(pq.has("c"));
    });

    it("returns false if the key is not present", function() {
      assert.isFalse(pq.has("d"));
    });
  });

  describe("priority", function() {
    it("returns the priority of entries in the queue", function() {
      assert.equal(pq.priority("a"), 5);
      assert.equal(pq.priority("b"), 3);
      assert.equal(pq.priority("c"), 8);
    });

    it("returns undefined if the key is not present", function() {
      assert.isUndefined(pq.priority("d"));
    });
  });

  describe("add", function() {
    it("adds a new entry to the queue and returns true", function() {
      assert.isFalse(pq.has("d"));
      assert.isTrue(pq.add("d", 10));
      assert.isTrue(pq.has("d"));
    });

    it("returns false if the key is already in the queue", function() {
      assert.isTrue(pq.has("c"));
      assert.isFalse(pq.add("c"), 8);
    });
  });

  describe("min", function() {
    it("returns undefined for an empty queue", function() {
      assert.isUndefined(new PriorityQueue().min());
    });

    it("returns the minimum key in the queue", function() {
      assert.equal(pq.min(), "b");
    });
  });

  describe("removeMin", function() {
    it("removes and returns the minimum element in the queue", function() {
      var min = pq.min();
      assert.equal(pq.removeMin(), min);
      assert.isFalse(pq.has(min));
    });

    it("throws an error if the queue is empty", function() {
      assert.throws(function() { new PriorityQueue().removeMin(); });
    });
  });

  describe("decrease", function() {
    it("decrease the priority of a key", function() {
      pq.decrease("c", 1);
      assert.equal(pq.priority("c"), 1);
    });

    it("throws an error if the new priority is higher", function() {
      assert.throws(function() { pq.decrease("c", 100); });
    });
  });
});

