var assert = require("chai").assert,
    dagre = require("../index");

describe("graph", function() {
  describe("empty graph", function() {
    it("has no nodes", function() {
      assert.lengthOf(dagre.graph.create().nodes(), 0);
    });

    it("has no edges", function() {
      assert.lengthOf(dagre.graph.create().edges(), 0);
    });
  });
});

