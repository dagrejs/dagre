import {Graph} from "@dagrejs/graphlib";
import {adjust, undo} from "../lib/coordinate-system";

describe("coordinateSystem", () => {
    let g: Graph;

    beforeEach(() => g = new Graph());

    describe("adjust", () => {
        beforeEach(() => {
            g.setNode("a", {width: 100, height: 200});
        });

        it("does nothing to node dimensions with rankdir = TB", () => {
            g.setGraph({rankdir: "TB"});
            adjust(g);
            expect(g.node("a")).toEqual({width: 100, height: 200});
        });

        it("does nothing to node dimensions with rankdir = BT", () => {
            g.setGraph({rankdir: "BT"});
            adjust(g);
            expect(g.node("a")).toEqual({width: 100, height: 200});
        });

        it("swaps width and height for nodes with rankdir = LR", () => {
            g.setGraph({rankdir: "LR"});
            adjust(g);
            expect(g.node("a")).toEqual({width: 200, height: 100});
        });

        it("swaps width and height for nodes with rankdir = RL", () => {
            g.setGraph({rankdir: "RL"});
            adjust(g);
            expect(g.node("a")).toEqual({width: 200, height: 100});
        });
    });

    describe("undo", () => {
        beforeEach(() => g.setNode("a", {width: 100, height: 200, x: 20, y: 40}));

        it("does nothing to points with rankdir = TB", () => {
            g.setGraph({rankdir: "TB"});
            undo(g);
            expect(g.node("a")).toEqual({x: 20, y: 40, width: 100, height: 200});
        });

        it("flips the y coordinate for points with rankdir = BT", () => {
            g.setGraph({rankdir: "BT"});
            undo(g);
            expect(g.node("a")).toEqual({x: 20, y: -40, width: 100, height: 200});
        });

        it("swaps dimensions and coordinates for points with rankdir = LR", () => {
            g.setGraph({rankdir: "LR"});
            undo(g);
            expect(g.node("a")).toEqual({x: 40, y: 20, width: 200, height: 100});
        });

        it("swaps dims and coords and flips x for points with rankdir = RL", () => {
            g.setGraph({rankdir: "RL"});
            undo(g);
            expect(g.node("a")).toEqual({x: -40, y: 20, width: 200, height: 100});
        });
    });
});
