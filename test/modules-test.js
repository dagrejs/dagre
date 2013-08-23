var assert = require("chai").assert;

// Tests that the various exported modules load without error
describe("modules", function() {
  describe("index", function() {
    ["dot", "Graph", "layout", "util", "version"].forEach(function(e) {
      it("exports " + e, function() {
        assert.isDefined(require("../index")[e]);
      });
    });
  });

  describe("Graph", function() {
    it("exports Graph as a module", function() {
      assert.isDefined(require("../Graph"));
    });
  });
});
