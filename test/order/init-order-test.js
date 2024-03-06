let expect = require("../chai").expect;
let Graph = require("@dagrejs/graphlib").Graph;
let initOrder = require("../../lib/order/init-order");

describe("order/initOrder", () => {
  let g;

  beforeEach(() => {
    g = new Graph({ compound: true })
      .setDefaultEdgeLabel(() => ({ weight: 1 }));
  });

  it("assigns non-overlapping orders for each rank in a tree", () => {
    Object.entries({ a: 0, b: 1, c: 2, d: 2, e: 1 }).forEach(([v, rank]) => {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setEdge("a", "e");

    let layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(layering[1].sort()).to.eql(["b", "e"]);
    expect(layering[2].sort()).to.eql(["c", "d"]);
  });

  it("assigns non-overlapping orders for each rank in a DAG", () => {
    Object.entries({ a: 0, b: 1, c: 1, d: 2}).forEach(([v, rank]) => {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    let layering = initOrder(g);
    expect(layering[0]).to.eql(["a"]);
    expect(layering[1].sort()).to.eql(["b", "c"]);
    expect(layering[2].sort()).to.eql(["d"]);
  });

  it("does not assign an order to subgraph nodes", () => {
    g.setNode("a", { rank: 0 });
    g.setNode("sg1", {});
    g.setParent("a", "sg1");

    let layering = initOrder(g);
    expect(layering).to.eql([["a"]]);
  });
});
