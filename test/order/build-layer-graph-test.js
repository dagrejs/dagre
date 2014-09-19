var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    buildLayerGraph = require("../../lib/order/build-layer-graph");

describe("order/buildLayerGraph", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true, multigraph: true });
  });

  it("places movable nodes with no parents under the root node", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });

    var lg;
    lg = buildLayerGraph(g, 1, "inEdges");
    expect(lg.hasNode(lg.getGraph().root));
    expect(lg.getChildren()).eqls([lg.getGraph().root]);
    expect(lg.getChildren(lg.getGraph().root)).eqls(["a", "b"]);
  });

  it("copies flat nodes from the layer to the graph", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });

    expect(buildLayerGraph(g, 1, "inEdges").nodes()).to.include("a");
    expect(buildLayerGraph(g, 1, "inEdges").nodes()).to.include("b");
    expect(buildLayerGraph(g, 2, "inEdges").nodes()).to.include("c");
    expect(buildLayerGraph(g, 3, "inEdges").nodes()).to.include("d");
  });

  it("uses the original node label for copied nodes", function() {
    // This allows us to make updates to the original graph and have them
    // be available automatically in the layer graph.
    g.setNode("a", { foo: 1, rank: 1 });
    g.setNode("b", { foo: 2, rank: 2 });
    g.setEdge("a", "b", { weight: 1 });

    var lg = buildLayerGraph(g, 2, "inEdges");

    expect(lg.getNode("a").foo).equals(1);
    g.getNode("a").foo = "updated";
    expect(lg.getNode("a").foo).equals("updated");

    expect(lg.getNode("b").foo).equals(2);
    g.getNode("b").foo = "updated";
    expect(lg.getNode("b").foo).equals("updated");
  });

  it("copies edges incident on rank nodes to the graph (inEdges)", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });
    g.setEdge("a", "c", { weight: 2 });
    g.setEdge("b", "c", { weight: 3 });
    g.setEdge("c", "d", { weight: 4 });

    expect(buildLayerGraph(g, 1, "inEdges").edgeCount()).to.equal(0);
    expect(buildLayerGraph(g, 2, "inEdges").edgeCount()).to.equal(2);
    expect(buildLayerGraph(g, 2, "inEdges").getEdge("a", "c")).eqls({ weight: 2 });
    expect(buildLayerGraph(g, 2, "inEdges").getEdge("b", "c")).eqls({ weight: 3 });
    expect(buildLayerGraph(g, 3, "inEdges").edgeCount()).to.equal(1);
    expect(buildLayerGraph(g, 3, "inEdges").getEdge("c", "d")).eqls({ weight: 4 });
  });

  it("copies edges incident on rank nodes to the graph (outEdges)", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });
    g.setEdge("a", "c", { weight: 2 });
    g.setEdge("b", "c", { weight: 3 });
    g.setEdge("c", "d", { weight: 4 });

    expect(buildLayerGraph(g, 1, "outEdges").edgeCount()).to.equal(2);
    expect(buildLayerGraph(g, 1, "outEdges").getEdge("c", "a")).eqls({ weight: 2 });
    expect(buildLayerGraph(g, 1, "outEdges").getEdge("c", "b")).eqls({ weight: 3 });
    expect(buildLayerGraph(g, 2, "outEdges").edgeCount()).to.equal(1);
    expect(buildLayerGraph(g, 2, "outEdges").getEdge("d", "c")).eqls({ weight: 4 });
    expect(buildLayerGraph(g, 3, "outEdges").edgeCount()).to.equal(0);
  });

  it("collapses multi-edges", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 2 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("a", "b", { weight: 3 }, "multi");

    expect(buildLayerGraph(g, 2, "inEdges").getEdge("a", "b")).eqls({ weight: 5 });
  });

  it("preserves hierarchy for the movable layer", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 1 });
    g.setNode("sg", { minRank: 1, maxRank: 1 });
    _.each(["a", "b"], function(v) { g.setParent(v, "sg"); });

    var lg = buildLayerGraph(g, 1, "inEdges"),
        root = lg.getGraph().root;
    expect(_.sortBy(lg.getChildren(root))).eqls(["c", "sg"]);
    expect(lg.getParent("a")).equals("sg");
    expect(lg.getParent("b")).equals("sg");
  });
});
