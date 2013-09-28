var assert = require('../../assert'),
    initLayerGraphs = require('../../../../lib/layout/order/initLayerGraphs'),
    sortLayer = require('../../../../lib/layout/order/sortLayer'),
    CDigraph = require('graphlib').CDigraph;

describe('sortLayer', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('sorts based on barycenters', function() {
    // We set the initial order of the movable layer [1, 2, 3] in reverse order
    // and expect the ordering algorithm to put them in the correct order
    // using the barycenter algorithm.

    g.addNode(1, { rank: 1, order: 2 });
    g.addNode(2, { rank: 1, order: 1 });
    g.addNode(3, { rank: 1, order: 0 });

    var layerGraphs = initLayerGraphs(g);
    
    sortLayer(layerGraphs[1],
              { 1: [0], 2: [1], 3: [2] });
    
    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 1);
    assert.equal(g.node(3).order, 2);
  });

  it('handles multiple weights', function() {
    // We expect that multiple edges from the fixed layer to influence the
    // barycenters for the movable nodes. In this test we add multiple weights
    // to node 3 so that it should come before node 2.

    g.addNode(1, { rank: 1, order: 2 });
    g.addNode(2, { rank: 1, order: 1 });
    g.addNode(3, { rank: 1, order: 0 });

    var layerGraphs = initLayerGraphs(g);

    sortLayer(layerGraphs[1],
              { 1: [0], 2: [2], 3: [0, 1, 2] });

    assert.equal(g.node(1).order, 0);
    assert.equal(g.node(2).order, 2);
    assert.equal(g.node(3).order, 1);
  });
});
