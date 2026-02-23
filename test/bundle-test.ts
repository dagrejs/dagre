import dagre from "@dagrejs/dagre";

const graphlib = dagre.graphlib;

// These are smoke tests to make sure the bundles look like they are working
// correctly.
describe("bundle", () => {

    it("exports dagre", () => {
        expect(dagre).toBeInstanceOf(Object);
        expect(dagre.graphlib).toBeInstanceOf(Object);
        expect(dagre.layout).toBeInstanceOf(Function);
        expect(dagre.util).toBeInstanceOf(Object);
        expect(typeof dagre.version).toBe("string");
    });

    it("can do trivial layout", () => {
        const g = new graphlib.Graph().setGraph({});
        g.setNode("a", {label: "a", width: 50, height: 100});
        g.setNode("b", {label: "b", width: 50, height: 100});
        g.setEdge("a", "b", {label: "ab", width: 50, height: 100});

        dagre.layout(g);
        expect(g.node("a")).toHaveProperty("x");
        expect(g.node("a")).toHaveProperty("y");
        expect(g.node("a").x).toBeGreaterThanOrEqual(0);
        expect(g.node("a").y).toBeGreaterThanOrEqual(0);
        expect(g.edge("a", "b")).toHaveProperty("x");
        expect(g.edge("a", "b")).toHaveProperty("y");
        expect(g.edge("a", "b").x).toBeGreaterThanOrEqual(0);
        expect(g.edge("a", "b").y).toBeGreaterThanOrEqual(0);
    });
});
