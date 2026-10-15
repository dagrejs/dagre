import {Graph, layout} from "../index";

describe("layout with zero-sized node dimensions", () => {
    ["TB", "BT", "LR", "RL"].forEach(rankdir => {
        const sizes: [number, number][] = [[0, 40], [100, 0], [0, 0]];
        sizes.forEach(([width, height]) => {
            it(rankdir + " " + width + "x" + height, () => {
                const g = new Graph().setGraph({rankdir}).setDefaultEdgeLabel(() => ({}));
                g.setNode("a", {width, height});
                g.setNode("b", {width, height});
                g.setEdge("a", "b");
                layout(g);

                const a = g.node("a");
                const b = g.node("b");
                const points = g.edge("a", "b").points;
                const first = points[0];
                const last = points[points.length - 1];
                if (rankdir === "TB" || rankdir === "BT") {
                    const sign = rankdir === "TB" ? 1 : -1;
                    expect(first).toEqual({x: a.x, y: a.y + sign * height / 2});
                    expect(last).toEqual({x: b.x, y: b.y - sign * height / 2});
                } else {
                    const sign = rankdir === "LR" ? 1 : -1;
                    expect(first).toEqual({x: a.x + sign * width / 2, y: a.y});
                    expect(last).toEqual({x: b.x - sign * width / 2, y: b.y});
                }
            });
        });
    });
});
