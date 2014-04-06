var testUtil = require('../util'),
    assert = require('../assert'),
    CDigraph = require('graphlib').CDigraph,
    initLayerGraphs = require('../../lib/order/initLayerGraphs');

describe('initLayerGraphs', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('constructs a 1-level graph for a flat graph', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);

    var layerGraphs = initLayerGraphs(g);

    assert.isDefined(layerGraphs);
    assert.lengthOf(layerGraphs, 1);
    assert.sameMembers(layerGraphs[0].nodes(), ['a', 'b', 'c']);
    assert.sameMembers(layerGraphs[0].children(null), ['a', 'b', 'c']);
  });

  it('constructs a 2-level graph for a single layer', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addCompoundNode(g, 'sg1', [ 'b' ]);

    var layerGraphs = initLayerGraphs(g);

    assert.isDefined(layerGraphs);
    assert.lengthOf(layerGraphs, 1);
    assert.sameMembers(layerGraphs[0].nodes(), ['a', 'b', 'c', 'sg1']);
    assert.sameMembers(layerGraphs[0].children(null), ['a', 'c', 'sg1']);
    assert.sameMembers(layerGraphs[0].children('sg1'), ['b']);
  });

  it('constructs 2 layers for a 2-layer graph', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addSimpleNode(g, 'd', 1);
    testUtil.addSimpleNode(g, 'e', 1);
    testUtil.addCompoundNode(g, 'sg1', [ 'b', 'e' ]);

    var layerGraphs = initLayerGraphs(g);

    assert.isDefined(layerGraphs);
    assert.lengthOf(layerGraphs, 2);

    assert.sameMembers(layerGraphs[0].nodes(), ['a', 'b', 'c', 'sg1']);
    assert.sameMembers(layerGraphs[0].children(null), ['a', 'c', 'sg1']);
    assert.sameMembers(layerGraphs[0].children('sg1'), ['b']);

    assert.sameMembers(layerGraphs[1].nodes(), ['d', 'e', 'sg1']);
    assert.sameMembers(layerGraphs[1].children(null), ['d', 'sg1']);
    assert.sameMembers(layerGraphs[1].children('sg1'), ['e']);
  });

  it('handles multiple nestings', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addSimpleNode(g, 'd', 1);
    testUtil.addSimpleNode(g, 'e', 1);
    testUtil.addSimpleNode(g, 'f', 1);
    testUtil.addCompoundNode(g, 'sg2', ['a', 'd']);
    testUtil.addCompoundNode(g, 'sg1', ['b', 'e', 'sg2']);

    var layerGraphs = initLayerGraphs(g);

    assert.isDefined(layerGraphs);
    assert.lengthOf(layerGraphs, 2);

    assert.sameMembers(layerGraphs[0].nodes(), ['a', 'b', 'c', 'sg1', 'sg2']);
    assert.sameMembers(layerGraphs[0].children(null), ['c', 'sg1']);
    assert.sameMembers(layerGraphs[0].children('sg1'), ['b', 'sg2']);
    assert.sameMembers(layerGraphs[0].children('sg2'), ['a']);

    assert.sameMembers(layerGraphs[1].nodes(), ['d', 'e', 'f', 'sg1', 'sg2']);
    assert.sameMembers(layerGraphs[1].children(null), ['f', 'sg1']);
    assert.sameMembers(layerGraphs[1].children('sg1'), ['e', 'sg2']);
    assert.sameMembers(layerGraphs[1].children('sg2'), ['d']);
  });

  it('does not include subgraphs in layers where it has no nodes', function() {
    // In this example sg1 is the parent of nodes 2 and 5, which are on ranks
    // 0 and 2 respectively. sg1 should not be included in rank 1 where it has
    // no nodes.
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 1);
    testUtil.addSimpleNode(g, 'd', 2);
    testUtil.addSimpleNode(g, 'e', 2);
    testUtil.addCompoundNode(g, 'sg1', ['b', 'e']);

    var layerGraphs = initLayerGraphs(g);

    assert.isDefined(layerGraphs);
    assert.lengthOf(layerGraphs, 3);

    assert.sameMembers(layerGraphs[0].nodes(), ['sg1', 'a', 'b']);
    assert.sameMembers(layerGraphs[1].nodes(), ['c']);
    assert.sameMembers(layerGraphs[2].nodes(), ['sg1', 'd', 'e']);
  });
});
