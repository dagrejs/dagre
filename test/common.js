var chai = require("chai");
chai.Assertion.includeStack = true;

// If we're running in a browserified environment, such as testling, we don't
// have access to the fs module. We just get an empty object from
// `require("fs")`, so we stub it out here.
var fs = require("fs");
if (!("readdirSync" in fs)) {
  fs = {
    readdirSync: function() {
      console.log("WARNING: Faking a call to readdirSync. This should only happen in testling");
      return [];
    },
  };
}
exports.fs = fs;
