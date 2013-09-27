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

  it("constructs a 2-level tree for a single layer", function() {
    var g = new CDigraph();
    g.graph({});
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode(3, { rank: 0 });
    g.addNode("sg1", {});
    g.parent(2, "sg1");

    initLayerTrees(g);

    var root = g.graph().layerTreeRoot;
    assert.isDefined(root);

    var layerTrees = g.graph().layerTrees;
    assert.isDefined(layerTrees);
    assert.lengthOf(layerTrees, 1);
    assert.sameMembers(layerTrees[0].nodes(), [root, 1, 2, 3, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors(root), [1, 3, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors("sg1"), [root, 2]);
    assert.sameMembers(layerTrees[0].neighbors(2), ["sg1"]);
  });

  it("constructs 2 layers for a 2-layer graph", function() {
    var g = new CDigraph();
    g.graph({});
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode(3, { rank: 0 });
    g.addNode(4, { rank: 1 });
    g.addNode(5, { rank: 1 });
    g.addNode("sg1", {});
    g.parent(2, "sg1");
    g.parent(5, "sg1");

    initLayerTrees(g);

    var root = g.graph().layerTreeRoot;
    assert.isDefined(root);

    var layerTrees = g.graph().layerTrees;
    assert.isDefined(layerTrees);
    assert.lengthOf(layerTrees, 2);

    assert.sameMembers(layerTrees[0].nodes(), [root, 1, 2, 3, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors(root), [1, 3, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors("sg1"), [root, 2]);
    assert.sameMembers(layerTrees[0].neighbors(2), ["sg1"]);

    assert.sameMembers(layerTrees[1].nodes(), [root, 4, 5, "sg1"]);
    assert.sameMembers(layerTrees[1].neighbors(root), [4, "sg1"]);
    assert.sameMembers(layerTrees[1].neighbors("sg1"), [root, 5]);
    assert.sameMembers(layerTrees[1].neighbors(5), ["sg1"]);
  });

  it("handles multiple nestings", function() {
    var g = new CDigraph();
    g.graph({});
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode(3, { rank: 0 });
    g.addNode(4, { rank: 1 });
    g.addNode(5, { rank: 1 });
    g.addNode(6, { rank: 1 });
    g.addNode("sg1", {});
    g.addNode("sg2", {});
    g.parent(1, "sg2");
    g.parent(4, "sg2");
    g.parent(2, "sg1");
    g.parent(5, "sg1");
    g.parent("sg2", "sg1");

    initLayerTrees(g);

    var root = g.graph().layerTreeRoot;
    assert.isDefined(root);

    var layerTrees = g.graph().layerTrees;
    assert.isDefined(layerTrees);
    assert.lengthOf(layerTrees, 2);

    assert.sameMembers(layerTrees[0].nodes(), [root, 1, 2, 3, "sg1", "sg2"]);
    assert.sameMembers(layerTrees[0].neighbors(root), [3, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors("sg1"), [root, 2, "sg2"]);
    assert.sameMembers(layerTrees[0].neighbors(2), ["sg1"]);
    assert.sameMembers(layerTrees[0].neighbors("sg2"), [1, "sg1"]);
    assert.sameMembers(layerTrees[0].neighbors(1), ["sg2"]);

    assert.sameMembers(layerTrees[1].nodes(), [root, 4, 5, 6, "sg1", "sg2"]);
    assert.sameMembers(layerTrees[1].neighbors(root), [6, "sg1"]);
    assert.sameMembers(layerTrees[1].neighbors("sg1"), [root, 5, "sg2"]);
    assert.sameMembers(layerTrees[1].neighbors(5), ["sg1"]);
    assert.sameMembers(layerTrees[1].neighbors("sg2"), [4, "sg1"]);
    assert.sameMembers(layerTrees[1].neighbors(4), ["sg2"]);
  });
});
