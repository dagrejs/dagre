var assert = require('../assert');

var nestingGraph = require('../../lib/rank/nestingGraph');

var CDigraph = require('graphlib').CDigraph;

describe('nestingGraph.augment', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  it('adds a border node u^(-) at the top of each subgraph', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode(1, {}), 'sg1');

    nestingGraph.augment(g);
    assert.property(g.node('sg1'), 'borderNodeTop');
    assert.include(g.nodes(), g.node('sg1').borderNodeTop);
    assert.equal(g.parent(g.node('sg1').borderNodeTop), 'sg1');
  });

  it('adds a border node u^(+) at the bottom of each subgraph', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode(1, {}), 'sg1');

    nestingGraph.augment(g);
    assert.property(g.node('sg1'), 'borderNodeBottom');
    assert.include(g.nodes(), g.node('sg1').borderNodeBottom);
    assert.equal(g.parent(g.node('sg1').borderNodeBottom), 'sg1');
  });

  it('adds an edge (u^(-), v) for each (u, v) in E_T with u in S and v in B', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode(1, {}), 'sg1');

    nestingGraph.augment(g);
    var sg1Top = g.node('sg1').borderNodeTop;
    assert.lengthOf(g.outEdges(sg1Top, 1), 1);
  });

  it('adds an edge (u1^(-), u2^(-)) for each (u1, u2) in E_T with u1, u2 in S', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg2');

    nestingGraph.augment(g);
    var sg1Top = g.node('sg1').borderNodeTop;
    var sg2Top = g.node('sg2').borderNodeTop;
    assert.lengthOf(g.outEdges(sg1Top, sg2Top), 1);
  });

  it('adds an edge (v, u^(+)) for each (u, v) in E_T with u in S and v in B', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode(1, {}), 'sg1');

    nestingGraph.augment(g);
    var sg1Bottom = g.node('sg1').borderNodeBottom;
    assert.lengthOf(g.outEdges(1, sg1Bottom), 1);
  });

  it('adds an edge (u2^(+), u1^(+)) for each (u1, u2) in E_T with u1, u2 in S', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg2');

    nestingGraph.augment(g);
    var sg1Bottom = g.node('sg1').borderNodeBottom;
    var sg2Bottom = g.node('sg2').borderNodeBottom;
    assert.lengthOf(g.outEdges(sg2Bottom, sg1Bottom), 1);
  });

  it('does not change edge minLen for a flat graph', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge('A', 1, 2, { minLen: 2 });

    nestingGraph.augment(g);
    assert.propertyVal(g.edge('A'), 'minLen', 2);
  });

  it('sets minLen to (2k + 1)*minLen for edges in a nested graph', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode(1, {}), 'sg1');
    g.parent(g.addNode(2, {}), 'sg1');
    g.addEdge('A', 1, 2, { minLen: 2 });

    nestingGraph.augment(g);
    assert.propertyVal(g.edge('A'), 'minLen', (2 * 1 + 1) * 2);
  });

  it('sets minLen appropriately for subgraph to node edges', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg1');
    g.parent(g.addNode(2, {}), 'sg2');

    nestingGraph.augment(g);
    assert.lengthOf(g.inEdges(1), 1);
    assert.propertyVal(g.edge(g.inEdges(1)[0]), 'minLen', 2);
  });

  it('sets minLen appropriately for node to subgraph edges', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg1');
    g.parent(g.addNode(2, {}), 'sg2');

    nestingGraph.augment(g);
    assert.lengthOf(g.outEdges(1), 1);
    assert.propertyVal(g.edge(g.outEdges(1)[0]), 'minLen', 2);
  });

  it('sets minLen appropriately for subgraph to subgraph (-) edges', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg2');

    nestingGraph.augment(g);
    var sg1Top = g.node('sg1').borderNodeTop;
    assert.lengthOf(g.outEdges(sg1Top), 1);
    assert.propertyVal(g.edge(g.outEdges(sg1Top)[0]), 'minLen', 1);
  });

  it('sets minLen appropriately for subgraph to subgraph (+) edges', function() {
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg2');

    nestingGraph.augment(g);
    var sg1Bottom = g.node('sg1').borderNodeBottom;
    assert.lengthOf(g.inEdges(sg1Bottom), 1);
    assert.propertyVal(g.edge(g.inEdges(sg1Bottom)[0]), 'minLen', 1);
  });
});

describe('nestingGraph.removeEdges', function() {
  it('removes edges added by nestingGraph.augment', function() {
    // We augment a graph similarly to the above tests and then we use remove.
    // After this process no nesting edges should remain in the graph.
    var g = new CDigraph();
    g.graph({});
    g.addNode('sg1', {});
    g.parent(g.addNode('sg2', {}), 'sg1');
    g.parent(g.addNode(1, {}), 'sg2');
    g.parent(g.addNode(2, {}), 'sg2');
    g.addEdge('A', 1, 2, { minLen: 1 });

    nestingGraph.augment(g);
    nestingGraph.removeEdges(g);
    assert.sameMembers(g.edges(), ['A']);
  });
});
