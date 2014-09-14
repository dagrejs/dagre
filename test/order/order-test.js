var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    order = require("../../lib/order"),
    crossCount = require("../../lib/order/cross-count"),
    util = require("../../lib/util");

describe("order", function() {
  var g;

  beforeEach(function() {
    g = new Graph()
      .setDefaultEdgeLabel({ weight: 1 });
  });

  it("does not add crossings to a tree structure", function() {
    g.setNode("a", { rank: 1 });
    _.each(["b", "e"], function(v) { g.setNode(v, { rank: 2 }); });
    _.each(["c", "d", "f"], function(v) { g.setNode(v, { rank: 3 }); });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setPath(["a", "e", "f"]);
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can solve a simple graph", function() {
    // This graph resulted in a single crossing for previous versions of dagre.
    _.each(["a", "d"], function(v) { g.setNode(v, { rank: 1 }); });
    _.each(["b", "f", "e"], function(v) { g.setNode(v, { rank: 2 }); });
    _.each(["c", "g"], function(v) { g.setNode(v, { rank: 3 }); });
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can minimize crossings", function() {
    g.setNode("a", { rank: 1 });
    _.each(["b", "e", "g"], function(v) { g.setNode(v, { rank: 2 }); });
    _.each(["c", "f", "h"], function(v) { g.setNode(v, { rank: 3 }); });
    g.setNode("d", { rank: 4 });
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.be.lte(1);
  });
});
