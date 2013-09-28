var assert = require('../../assert'),
    util = require('../../../../lib/util'),
    sortLayer = require('../../../../lib/layout/order/sortLayer'),
    CDigraph = require('graphlib').CDigraph;

describe('sortLayer', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('sorts based on barycenters', function() {
    // We set the initial order of the movable layer [4, 5, 6] in reverse order
    // and expect the ordering algorithm to put them in the correct order
    // using the barycenter algorithm.

    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.addNode(3, { rank: 0, order: 2 });
    g.addNode(4, { rank: 1, order: 2 });
    g.addNode(5, { rank: 1, order: 1 });
    g.addNode(6, { rank: 1, order: 0 });
    
    var movable = util.ordering(g)[1],
        adjacent = { 4: [1], 5: [2], 6: [3] };
   
    sortLayer(g, movable, adjacent);
    
    assert.equal(g.node(4).order, 0);
    assert.equal(g.node(5).order, 1);
    assert.equal(g.node(6).order, 2);
  });

  it('handles multiple adjacencies from the fixed layer', function() {
    // We expect that multiple edges from the fixed layer to influence the
    // barycenters for the movable nodes. In this test we add multiple edges
    // to node 6 so that it should come before node 5.

    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.addNode(3, { rank: 0, order: 2 });
    g.addNode(4, { rank: 1, order: 2 });
    g.addNode(5, { rank: 1, order: 1 });
    g.addNode(6, { rank: 1, order: 0 });
    
    var movable = util.ordering(g)[1],
        adjacent = { 4: [1], 5: [3], 6: [1, 2, 3] };

    sortLayer(g, movable, adjacent);

    assert.equal(g.node(4).order, 0);
    assert.equal(g.node(5).order, 2);
    assert.equal(g.node(6).order, 1);
  });

  it('handles multi-edge adjacent nodes', function() {
    // We expect that multi-edges from a node in the fixed layer to a node in
    // the movable layer influence the movable node's barycenter. Here if we
    // did not properly handle multi-edges node 5 would come after node 6.

    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.addNode(3, { rank: 0, order: 2 });
    g.addNode(4, { rank: 1, order: 2 });
    g.addNode(5, { rank: 1, order: 1 });
    g.addNode(6, { rank: 1, order: 0 });
    
    var movable = util.ordering(g)[1],
        adjacent = { 4: [1], 5: [1, 1, 1, 1, 2, 3], 6: [1, 3] };

    sortLayer(g, movable, adjacent);

    assert.equal(g.node(4).order, 0);
    assert.equal(g.node(5).order, 1);
    assert.equal(g.node(6).order, 2);
  });
});
