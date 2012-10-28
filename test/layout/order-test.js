require("../common");

describe("dagre.layout", function() {
  it("sets order = 0 for a single node", function() {
    var g = dagre.dot.toGraph("digraph { A [rank=0] }");

    dagre.layout.order().run(g);

    assert.equal(g.node("A").order, 0);
  });

  it("sets order = 0 for 2 connected nodes on different ranks", function() {
    var g = dagre.dot.toGraph("digraph { A [rank=0]; B [rank=1]; A -> B }");

    dagre.layout.order().run(g);

    assert.equal(g.node("A").order, 0);
    assert.equal(g.node("B").order, 0);
  });

  it("sets order = 0 for 2 unconnected nodes on different ranks", function() {
    var g = dagre.dot.toGraph("digraph { A [rank=0]; B [rank=1]; }");

    dagre.layout.order().run(g);

    assert.equal(g.node("A").order, 0);
    assert.equal(g.node("B").order, 0);
  });

  it("sets order = 0, 1 for 2 nodes on the same rank", function() {
    var g = dagre.dot.toGraph("digraph { A [rank=0]; B [rank=0]; }");

    dagre.layout.order().run(g);

    if (g.node("A").order === 0) {
      assert.equal(g.node("B").order, 1);
    } else {
      assert.equal(g.node("A").order, 1);
      assert.equal(g.node("B").order, 0);
    }
  });

  it("finds minimal crossings", function() {
    var str = "digraph { A [rank=0]; B [rank=0]; C [rank=0]; D [rank=1]; E [rank=1]; " +
                "A -> D; B -> D; B -> E; C -> D; C -> E }";
    var g = dagre.dot.toGraph(str);

    var layering = dagre.layout.order().run(g);

    assert.equal(dagre.layout.order.crossCount(g, layering), 1);
  });
});
