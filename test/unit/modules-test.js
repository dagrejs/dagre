var assert = require("./assert");

// Tests that the various exported modules load without error
describe("modules", function() {
  describe("index", function() {
    ["layout", "version"].forEach(function(e) {
      it("exports " + e, function() {
        assert.isDefined(require("../../index")[e]);
      });
    });
  });
});
