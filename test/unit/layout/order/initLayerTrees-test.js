var assert = require("../../assert"),
    CDigraph = require("graphlib").CDigraph,
    initLayerTrees = require("../../../../lib/layout/order/initLayerTrees");

describe("layout.order.initLayerTrees", function() {
  it("constructs a 1-level tree for a flat graph", function() {
    var g = new CDigraph();
    g.graph({});
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode(3, { rank: 0 });

    initLayerTrees(g);

    var root = g.graph().layerTreeRoot;
    assert.isDefined(root);

    var layerTrees = g.graph().layerTrees;
    assert.isDefined(layerTrees);
    assert.lengthOf(layerTrees, 1);
    assert.sameMembers(layerTrees[0].nodes(), [root, 1, 2, 3]);
    assert.sameMembers(layerTrees[0].neighbors(root), [1, 2, 3]);
  });
});
