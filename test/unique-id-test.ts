import * as util from "../lib/util.js";

describe("Given a function to generate unique identifiers", function () {
    it("uniqueId(name) generates a valid identifier", function () {
        // This test guards against a bug #477, where the call to toString(prefix) inside
        // uniqueId() produced [object undefined].
        const id = util.uniqueId("_root");
        expect(id).not.toContain('[object undefined]');
        expect(id).toMatch(/_root\d+/);
    });

    it("Calling uniqueId(name) multiple times generate distinct values", function () {
        const first = util.uniqueId("name");
        const second = util.uniqueId("name");
        const third = util.uniqueId("name");
        expect(first).not.toBe(second);
        expect(second).not.toBe(third);
    });

    it("Calling uniqueId(number) with a number creates a valid identifier string", function () {
        const id = util.uniqueId('99');
        expect(typeof id).toBe('string');
        expect(id).not.toBeInstanceOf(Number);

        expect(id).toMatch(/99\d+/);
    });
});
