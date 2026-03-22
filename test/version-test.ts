import {version as libVersion} from "../lib/version";

describe("version", () => {
    it("should match the version from package.json", async () => {
        const packageVersion = await import ("../package.json").then(pkg => pkg.version);
        expect(libVersion).toBe(packageVersion);
    });
});
