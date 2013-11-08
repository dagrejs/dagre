var assert = require('./assert'),
    CDigraph = require('graphlib').CDigraph,
    order = require('../lib/order'),
    crossCount = require('../lib/order/crossCount');

describe('order', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('sets order = 0 for a single node', function() {
    g.addNode(1, { rank: 0 });
    order(g);
    assert.equal(g.node(1).order, 0);
  });

  it('sets order = 0 for 2 connected nodes on different ranks', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 1 });
    g.addEdge(null, 1, 2);

    order(g);

    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 0);
  });

  it('sets order = 0 for 2 unconnected nodes on different ranks', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 1 });

    order(g);

    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 0);
  });

  it('sets order = 0, 1 for 2 nodes on the same rank', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });

    order(g);

    assert.sameMembers(g.nodes().map(function(u) { return g.node(u).order; }), [0, 1]);
  });

  it('does not assign an order to a subgraph itself', function() {
    g.addNode(1, {rank: 0});
    g.addNode(2, {rank: 1});
    g.addNode('sg1', {});
    g.parent(2, 'sg1');

    order(g);

    assert.notProperty(g.node('sg1'), 'order');
  });

  /*
  it('keeps nodes in a subgraph adjacent in a single layer', function() {
    // To test, we set up a total order for the top rank which will cause us to
    // yield suboptimal crossing reduction if we keep the subgraph together in
    // the bottom rank.
    g.addNode(1, {rank: 0});
    g.addNode(2, {rank: 0});
    g.addNode(3, {rank: 0});
    g.addNode(4, {rank: 1});
    g.addNode(5, {rank: 1});
    g.addNode(6, {rank: 1});
    g.addNode('sg1', {minRank: 1, maxRank: 1});
    g.parent(4, 'sg1');
    g.parent(5, 'sg1');
    g.addEdge(null, 1, 4);
    g.addEdge(null, 1, 6);
    g.addEdge(null, 2, 6);
    g.addEdge(null, 3, 5);
    g.addEdge(null, 3, 6);

    // Now set up the total order
    var cg = new Digraph();
    cg.addNode(1);
    cg.addNode(2);
    cg.addNode(3);
    cg.addEdge(null, 1, 2);
    cg.addEdge(null, 2, 3);

    order().run(g);

    // Node 4 and 5 should be adjacent since they are both in sg1
    assert.closeTo(g.node(4).order, g.node(5).order, 1.0,
      'Node 4 and 5 should have been adjacent. order(4): ' + g.node(4).order +
      ' order(5): ' + g.node(5).order);

    // Now check that we found an optimal solution
    assert.equal(crossCount(g), 2);
  });
  */

  describe('finds minimial crossings', function() {
    it('graph1', function() {
      g.addNode(1, { rank: 0 });
      g.addNode(2, { rank: 0 });
      g.addNode(3, { rank: 1 });
      g.addNode(4, { rank: 1 });
      g.addEdge(null, 1, 4);
      g.addEdge(null, 2, 3);

      order(g);

      assert.equal(crossCount(g), 0);
    });

    it('graph2', function() {
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

      order(g);

      assert.equal(crossCount(g), 1);
    });

    it('graph3', function() {
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

      order(g);

      assert.equal(crossCount(g), 0);
    });
  });
});
