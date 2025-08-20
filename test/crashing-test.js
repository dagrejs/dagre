var layout = require("..").layout;
var Graph = require("@dagrejs/graphlib").Graph;

const inputReduced = require("./reduced-crashing.json");

describe("crashing layout", () => {
  it("tries to layout a graph", () => {
    let nodes = inputReduced.nodes;
    let edges = inputReduced.edges;
    let parents = inputReduced.parents;

    const g = new Graph({ directed: true, compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(() => ({}));

    for (const node of nodes) {
      g.setNode(node, {});
    }
    for (const edge of edges) {
      g.setEdge(edge.v, edge.w);
    }
    for (const [child, parent] of parents) {
      g.setParent(child, parent);
    }

    layout(g, {
      rankdir: "LR",
      ranker: "network-simplex",
    });
  });
});
