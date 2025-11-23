let Graph = require("@dagrejs/graphlib").Graph;
let order = require("../../lib/order");
let crossCount = require("../../lib/order/cross-count");
let util = require("../../lib/util");

describe("order", () => {
  let g;

  beforeEach(() => {
    g = new Graph()
      .setDefaultEdgeLabel({ weight: 1 });
  });

  it("does not add crossings to a tree structure", () => {
    g.setNode("a", { rank: 1 });
    ["b", "e"].forEach(v => g.setNode(v, { rank: 2 }));
    ["c", "d", "f"].forEach(v => g.setNode(v, { rank: 3 }));
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setPath(["a", "e", "f"]);
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBe(0);
  });

  it("can solve a simple graph", () => {
    // This graph resulted in a single crossing for previous versions of dagre.
    ["a", "d"].forEach(v => g.setNode(v, { rank: 1 }));
    ["b", "f", "e"].forEach(v => g.setNode(v, { rank: 2 }));
    ["c", "g"].forEach(v => g.setNode(v, { rank: 3 }));
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBe(0);
  });

  it("can minimize crossings", () => {
    g.setNode("a", { rank: 1 });
    ["b", "e", "g"].forEach(v => g.setNode(v, { rank: 2 }));
    ["c", "f", "h"].forEach(v => g.setNode(v, { rank: 3 }));
    g.setNode("d", { rank: 4 });
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBeLessThanOrEqual(1);
  });

  it('can skip the optimal ordering', () => {
    g.setNode("a", { rank: 1 });
    ["b", "d"].forEach(v => g.setNode(v, { rank: 2 }));
    ["c", "e"].forEach(v => g.setNode(v, { rank: 3 }));
    g.setPath(["a", "b", "c"]);
    g.setPath(["a", "d"]);
    g.setEdge("b", "e");
    g.setEdge("d", "c");

    const opts = { disableOptimalOrderHeuristic: true };

    order(g, opts);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBe(1);
  });
});
