var assert = require('../assert'),
    testUtil = require('../util'),
    initLayerGraphs = require('../../lib/order/initLayerGraphs'),
    sortLayer = require('../../lib/order/sortLayer'),
    CDigraph = require('graphlib').CDigraph,
    Digraph = require('graphlib').Digraph;

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

    testUtil.addSimpleNode(g, 'a', 0, 2);
    testUtil.addSimpleNode(g, 'b', 0, 1);
    testUtil.addSimpleNode(g, 'c', 0, 0);

    var layerGraphs = initLayerGraphs(g);
    
    sortLayer(layerGraphs[0],
              null,
              { a: [0], b: [1], c: [2] });
    
    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
    assert.equal(g.node('c').order, 2);
  });

  it('handles multiple weights', function() {
    // We expect that multiple edges from the fixed layer to influence the
    // barycenters for the movable nodes. In this test we add multiple weights
    // to node 3 so that it should come before node 2.

    testUtil.addSimpleNode(g, 'a', 0, 2);
    testUtil.addSimpleNode(g, 'b', 0, 1);
    testUtil.addSimpleNode(g, 'c', 0, 0);

    var layerGraphs = initLayerGraphs(g);

    sortLayer(layerGraphs[0],
              null,
              { a: [0], b: [2], c: [0, 1, 2] });

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 2);
    assert.equal(g.node('c').order, 1);
  });

  it('handles a single subgraph', function() {
    // We expect that nodes 1 and 2 will be adjacent since they are in the
    // same subgraph, even though they'd otherwise be at opposite ends of the
    // layer. The subgraph gets a weight of 1, which means it should come
    // before node 3.

    testUtil.addSimpleNode(g, 'a', 0, 0);
    testUtil.addSimpleNode(g, 'b', 0, 1);
    testUtil.addSimpleNode(g, 'c', 0, 2);
    testUtil.addCompoundNode(g, 'sg1', ['a', 'b']);

    var layerGraphs = initLayerGraphs(g);

    sortLayer(layerGraphs[0],
              null,
              { a: [0, 0], b: [2, 2], c: [1, 2] });

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
    assert.equal(g.node('c').order, 2);
    assert.notProperty(g.node('sg1'), 'order');
  });

  it('handles nested subgraphs', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addSimpleNode(g, 'd', 0);
    testUtil.addSimpleNode(g, 'e', 0);
    testUtil.addCompoundNode(g, 'sg2', ['b', 'c']);
    testUtil.addCompoundNode(g, 'sg1', ['a', 'sg2', 'd']);

    var layerGraphs = initLayerGraphs(g);

    sortLayer(layerGraphs[0],
              null,
              { a: [4], b: [3], c: [7], d: [6], e: [6] });

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
    assert.equal(g.node('c').order, 2);
    assert.equal(g.node('d').order, 3);
    assert.equal(g.node('e').order, 4);
    assert.notProperty(g.node('sg1'), 'order');
    assert.notProperty(g.node('sg2'), 'order');
  });

  it('returns a constraint graph for the next layer', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addSimpleNode(g, 'd', 0);
    testUtil.addCompoundNode(g, 'sg1', ['a']);
    testUtil.addCompoundNode(g, 'sg2', ['b']);
    testUtil.addCompoundNode(g, 'sg3', ['c', 'd']);

    var cg = sortLayer(initLayerGraphs(g)[0],
                       null,
                       { a: [1], b: [2], c: [3], d: [4] });

    // Ordering should have sg1 < sg2 < sg3. The constraint graph should thus
    // have sg1 -> sg2 -> sg3;
    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
    assert.equal(g.node('c').order, 2);
    assert.equal(g.node('d').order, 3);
    assert.sameMembers(cg.nodes(), ['sg1', 'sg2', 'sg3']);
    assert.sameMembers(cg.successors('sg1'), ['sg2']);
    assert.sameMembers(cg.successors('sg2'), ['sg3']);
    assert.sameMembers(cg.successors('sg3'), []);
  });

  it('returns a constraint graph a layer with nested subgraphs', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addSimpleNode(g, 'c', 0);
    testUtil.addCompoundNode(g, 'sg4', ['b']);
    testUtil.addCompoundNode(g, 'sg3', ['a']);
    testUtil.addCompoundNode(g, 'sg2', ['c']);
    testUtil.addCompoundNode(g, 'sg1', ['sg3', 'sg4']);

    var cg = sortLayer(initLayerGraphs(g)[0],
                       null,
                       { a: [1], b: [2], c: [3] });

    // Ordering will have sg3 < sg4 and sg1 < sg2. The constraint graph should
    // thus have sg3 -> sg4 and sg1 -> sg2.
    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
    assert.equal(g.node('c').order, 2);
    assert.sameMembers(cg.nodes(), ['sg1', 'sg2', 'sg3', 'sg4']);
    assert.sameMembers(cg.successors('sg1'), ['sg2']);
    assert.sameMembers(cg.successors('sg2'), []);
    assert.sameMembers(cg.successors('sg3'), ['sg4']);
    assert.sameMembers(cg.successors('sg4'), []);
  });

  it('respects the constraint graph', function() {
    testUtil.addSimpleNode(g, 'a', 0);
    testUtil.addSimpleNode(g, 'b', 0);
    testUtil.addCompoundNode(g, 'sg1', ['a']);
    testUtil.addCompoundNode(g, 'sg2', ['b']);

    var layerGraphs = initLayerGraphs(g);

    var cg = new Digraph();
    cg.addNode('sg1');
    cg.addNode('sg2');
    cg.addEdge(null, 'sg1', 'sg2');

    sortLayer(layerGraphs[0],
              cg,
              { a: [2], b: [1] });

    assert.equal(g.node('a').order, 0);
    assert.equal(g.node('b').order, 1);
  });
});
