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

    var g2 = g.copy();
    addBorderSegments(g2);
    var us = nodesInOrder(g2);
    assert.equal(us[0], 1);
    assertLeftBorderSegment(g2, us[1], 'sg1', 0);
    assert.equal(us[2], 2);
    assert.equal(us[3], 3);
    assertRightBorderSegment(g2, us[4], 'sg1', 0);
    assert.equal(us[5], 4);
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
  assert.equal(g.parent(u), 'sg1');
  assert.equal(g.node(u).rank, rank);
}

function nodesInOrder(g) {
  return g.nodes()
          .filter(function(x) { return !g.children(x).length; })
          .sort(function(x, y) {
            return g.node(x).order - g.node(y).order;
          });
}
