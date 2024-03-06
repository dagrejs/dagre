var expect = require("./chai").expect;

describe("version", () => {
  it("should match the version from package.json", () => {
    var packageVersion = require("../package").version;
    expect(require("../").version).to.equal(packageVersion);
  });
});
