var expect = require("../chai").expect;
var Graph = require("@dagrejs/graphlib").Graph;
var order = require("../../lib/order");
var crossCount = require("../../lib/order/cross-count");
var util = require("../../lib/util");

describe("order", function() {
  var g;

  beforeEach(function() {
    g = new Graph()
      .setDefaultEdgeLabel({ weight: 1 });
  });

  it("does not add crossings to a tree structure", function() {
    g.setNode("a", { rank: 1 });
    ["b", "e"].forEach(function(v) { g.setNode(v, { rank: 2 }); });
    ["c", "d", "f"].forEach(function(v) { g.setNode(v, { rank: 3 }); });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setPath(["a", "e", "f"]);
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can solve a simple graph", function() {
    // This graph resulted in a single crossing for previous versions of dagre.
    ["a", "d"].forEach(function(v) { g.setNode(v, { rank: 1 }); });
    ["b", "f", "e"].forEach(function(v) { g.setNode(v, { rank: 2 }); });
    ["c", "g"].forEach(function(v) { g.setNode(v, { rank: 3 }); });
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.equal(0);
  });

  it("can minimize crossings", function() {
    g.setNode("a", { rank: 1 });
    ["b", "e", "g"].forEach(function(v) { g.setNode(v, { rank: 2 }); });
    ["c", "f", "h"].forEach(function(v) { g.setNode(v, { rank: 3 }); });
    g.setNode("d", { rank: 4 });
    order(g);
    var layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).to.be.lte(1);
  });
});
