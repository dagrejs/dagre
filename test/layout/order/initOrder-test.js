var assert = require('../../assert'),
    initOrder = require('../../../lib/order/initOrder'),
    CDigraph = require('graphlib').CDigraph;

describe('initOrder', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('sets order to 0 for the node in a singleton graph', function() {
    g.addNode(1, { rank: 0 });
    initOrder(g);
    assert.equal(g.node(1).order, 0);
  });

  it('sets order to 0 to nodes on multiple single-node layers', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 1 });
    g.addNode(3, { rank: 2 });
    initOrder(g);
    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 0);
    assert.equal(g.node(3).order, 0);
  });

  it('incrementally sets the order position for nodes on the same rank', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode(3, { rank: 0 });
    initOrder(g);

    // There is no guarantee about what order gets assigned to what node, but
    // we can assert that the order values 0, 1, 2 were assigned.
    assert.sameMembers(g.nodes().map(function(u) { return g.node(u).order; }),
                       [0, 1, 2]);
  });

  it('does not assign order to subgraphs', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addNode('sg1', {});
    g.parent(1, 'sg1');
    g.parent(2, 'sg1');
    initOrder(g);
    assert.notProperty(g.node('sg1'), 'order');
  });
});
