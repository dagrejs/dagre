describe("version", () => {
  it("should match the version from package.json", () => {
    var packageVersion = require("../package").version;
    expect(require("../").version).toBe(packageVersion);
  });
});
