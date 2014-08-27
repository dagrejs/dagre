var expect = require("./chai").expect;

describe("version", function() {
  it("should match the version from package.json", function() {
    var packageVersion = require("../package").version;
    expect(require("../lib/version")).to.equal(packageVersion);
  });
});
