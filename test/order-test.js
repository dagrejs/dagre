var assert = require('./assert'),
    testUtil = require('./util'),
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
    testUtil.addSimpleNode(g, 'a', 0);
    order(g);
    assert.equal(g.node('a').order, 0);
  });

  it('sets order = 0 for 2 connected nodes on different ranks', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 1);
    g.addEdge(null, 'a', 'b');

    order(g);

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 0);
  });

  it('sets order = 0 for 2 unconnected nodes on different ranks', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 1);

    order(g);

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 0);
  });

  it('sets order = 0, 1 for 2 nodes on the same rank', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);

    order(g);

    assert.sameMembers(g.nodes().map(function(u) { return g.node(u).order; }), [0, 1]);
  });

  it('does not assign an order to a subgraph itself', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 1);
    testUtil.addCompoundNode(g, 'sg1', ['b']);

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
      testUtil.addSimpleNode(g, 'a', 0);
      testUtil.addSimpleNode(g, 'b', 0);
      testUtil.addSimpleNode(g, 'c', 1);
      testUtil.addSimpleNode(g, 'd', 1);
      g.addEdge(null, 'a', 'd');
      g.addEdge(null, 'b', 'c');

      order(g);

      assert.equal(crossCount(g), 0);
    });

    it('graph2', function() {
      testUtil.addSimpleNode(g, 'a', 0);
      testUtil.addSimpleNode(g, 'b', 0);
      testUtil.addSimpleNode(g, 'c', 0);
      testUtil.addSimpleNode(g, 'd', 1);
      testUtil.addSimpleNode(g, 'e', 1);

      g.addEdge(null, 'a', 'd');
      g.addEdge(null, 'b', 'd');
      g.addEdge(null, 'b', 'e');
      g.addEdge(null, 'c', 'd');
      g.addEdge(null, 'c', 'e');

      order(g);

      assert.equal(crossCount(g), 1);
    });

    it('graph3', function() {
      testUtil.addSimpleNode(g, 'a', 0);
      testUtil.addSimpleNode(g, 'b', 0);
      testUtil.addSimpleNode(g, 'c', 0);
      testUtil.addSimpleNode(g, 'd', 1);
      testUtil.addSimpleNode(g, 'e', 1);
      testUtil.addSimpleNode(g, 'f', 1);
      testUtil.addSimpleNode(g, 'g', 2);
      testUtil.addSimpleNode(g, 'h', 2);
      testUtil.addSimpleNode(g, 'i', 2);

      g.addEdge(null, 'a', 'e');
      g.addEdge(null, 'b', 'd');
      g.addEdge(null, 'c', 'f');
      g.addEdge(null, 'd', 'i');
      g.addEdge(null, 'e', 'h');
      g.addEdge(null, 'f', 'g');

      order(g);

      assert.equal(crossCount(g), 0);
    });
  });
});
