var assert = require("../assert"),
    Digraph = require("graphlib").Digraph,
    order = require("../../../lib/layout/order"),
    crossCount = require("../../../lib/layout/order/crossCount");

describe("order", function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
    g.graph({});
  });

  it("sets order = 0 for a single node", function() {
    g.addNode(1, { rank: 0 });
    order().run(g);
    assert.equal(g.node(1).order, 0);
  });

  it("sets order = 0 for 2 connected nodes on different ranks", function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 1 });
    g.addEdge(null, 1, 2);

    order().run(g);

    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 0);
  });

  it("sets order = 0 for 2 unconnected nodes on different ranks", function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 1 });

    order().run(g);

    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 0);
  });

  it("sets order = 0, 1 for 2 nodes on the same rank", function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });

    order().run(g);

    assert.sameMembers(g.nodes().map(function(u) { return g.node(u).order; }), [0, 1]);
  });

  describe("finds minimial crossings", function() {
    it("graph1", function() {
      g.addNode(1, { rank: 0 });
      g.addNode(2, { rank: 0 });
      g.addNode(3, { rank: 1 });
      g.addNode(4, { rank: 1 });
      g.addEdge(null, 1, 4);
      g.addEdge(null, 2, 3);

      order().run(g);

      assert.equal(crossCount(g), 0);
    });

    it("graph2", function() {
      g.addNode(1, { rank: 0 });
      g.addNode(2, { rank: 0 });
      g.addNode(3, { rank: 0 });
      g.addNode(4, { rank: 1 });
      g.addNode(5, { rank: 1 });
      g.addEdge(null, 1, 4);
      g.addEdge(null, 2, 4);
      g.addEdge(null, 2, 5);
      g.addEdge(null, 3, 4);
      g.addEdge(null, 3, 5);

      order().run(g);

      assert.equal(crossCount(g), 1);
    });

    it("graph3", function() {
      g.addNode(1, { rank: 0 });
      g.addNode(2, { rank: 0 });
      g.addNode(3, { rank: 0 });
      g.addNode(4, { rank: 1 });
      g.addNode(5, { rank: 1 });
      g.addNode(6, { rank: 1 });
      g.addNode(7, { rank: 2 });
      g.addNode(8, { rank: 2 });
      g.addNode(9, { rank: 2 });
      g.addEdge(null, 1, 5);
      g.addEdge(null, 2, 4);
      g.addEdge(null, 3, 6);
      g.addEdge(null, 4, 9);
      g.addEdge(null, 5, 8);
      g.addEdge(null, 6, 7);

      order().run(g);

      assert.equal(crossCount(g), 0);
    });
  });
});
