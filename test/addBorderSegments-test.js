var assert = require('./assert'),
    addBorderSegments = require('../lib/addBorderSegments'),
    CDigraph = require('graphlib').CDigraph;

describe('addBorderSegments', function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
  });

  it('does not change a graph that has no subgraphs', function() {
    g.addNode(1, { rank: 0 });
    g.addNode(2, { rank: 0 });
    g.addEdge(null, 1, 2);
    var g2 = g.copy();
    addBorderSegments(g2);
    assert.deepEqual(g, g2);
  });

  it('adds border nodes for one single layer subgraph', function() {
    g.addNode('sg1', {});
    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.parent(2, 'sg1');
    g.addNode(3, { rank: 0, order: 2 });
    g.parent(3, 'sg1');
    g.addNode(4, { rank: 0, order: 3 });

    addBorderSegments(g);
    var us = nodesInOrder(g, 0);
    assert.equal(us[0], 1);
    assertLeftBorderSegment(g, us[1], 'sg1', 0);
    assert.equal(us[2], 2);
    assert.equal(us[3], 3);
    assertRightBorderSegment(g, us[4], 'sg1', 0);
    assert.equal(us[5], 4);
  });

  it('closes subgraphs that end at the last node in the layer', function() {
    g.addNode('sg1', {});
    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.parent(2, 'sg1');

    addBorderSegments(g);
    var us = nodesInOrder(g, 0);
    assert.equal(us[0], 1);
    assertLeftBorderSegment(g, us[1], 'sg1', 0);
    assert.equal(us[2], 2);
    assertRightBorderSegment(g, us[3], 'sg1', 0);
  });

  it('handles nested subgraphs in one layer', function() {
    g.addNode('sg1', {});
    g.addNode('sg2', {});
    g.parent('sg2', 'sg1');
    g.addNode(1, { rank: 0, order: 0 });
    g.addNode(2, { rank: 0, order: 1 });
    g.parent(2, 'sg2');
    g.addNode(3, { rank: 0, order: 2 });
    g.parent(3, 'sg2');
    g.addNode(4, { rank: 0, order: 3 });
    g.parent(4, 'sg1');
    g.addNode(5, { rank: 0, order: 4 });

    addBorderSegments(g);
    var us = nodesInOrder(g, 0);
    assert.equal(us[0], 1);
    assertLeftBorderSegment(g, us[1], 'sg1', 0);
    assertLeftBorderSegment(g, us[2], 'sg2', 0);
    assert.equal(us[3], 2);
    assert.equal(us[4], 3);
    assertRightBorderSegment(g, us[5], 'sg2', 0);
    assert.equal(us[6], 4);
    assertRightBorderSegment(g, us[7], 'sg1', 0);
    assert.equal(us[8], 5);
  });

  it('handles subgraphs across layers', function() {
    g.addNode('sg1', {});
    g.addNode(1, { rank: 0, order: 0 });
    g.parent(1, 'sg1');
    g.addNode(2, { rank: 1, order: 0 });
    g.parent(2, 'sg1');

    addBorderSegments(g);

    var rank0 = nodesInOrder(g, 0);
    assertLeftBorderSegment(g, rank0[0], 'sg1', 0);
    assertRightBorderSegment(g, rank0[2], 'sg1', 0);

    var rank1 = nodesInOrder(g, 1);
    assertLeftBorderSegment(g, rank1[0], 'sg1', 1);
    assertRightBorderSegment(g, rank1[2], 'sg1', 1);

    assert.sameMembers(g.successors(rank0[0]), [ rank1[0] ]);
    assert.sameMembers(g.successors(rank0[2]), [ rank1[2] ]);
  });
});

function assertLeftBorderSegment(g, u, sg, rank) {
  assertBorderSegment(g, u, sg, rank);
  assert.equal(g.node(sg).leftBorderSegments[rank], u);
}

function assertRightBorderSegment(g, u, sg, rank) {
  assertBorderSegment(g, u, sg, rank);
  assert.equal(g.node(sg).rightBorderSegments[rank], u);
}

function assertBorderSegment(g, u, sg, rank) {
  assert.equal(g.parent(u), sg);
  assert.equal(g.node(u).rank, rank);
}

function nodesInOrder(g, rank) {
  return g.nodes()
          .filter(function(x) { return !g.children(x).length; })
          .filter(function(x) { return g.node(x).rank === rank; })
          .sort(function(x, y) {
            return g.node(x).order - g.node(y).order;
          });
}
