var assert = require('../assert'),
    Digraph = require('graphlib').Digraph,
    initRank = require('../../lib/rank/initRank'),
    feasibleTree = require('../../lib/rank/feasibleTree2');

describe('feasibleTree', function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
  });

  it('works from specified root node (1)', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2 });
    initRank(g);

    var result = feasibleTree(g, 1);
    assert.equal(result.parent(1), null);
    assert.equal(result.parent(2), 1);
    assert.equal(result.node(1).rank, result.node(2).rank - 2);
  });

  it('works from specified root node (2)', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2 });
    initRank(g);

    var result = feasibleTree(g, 2);
    assert.equal(result.parent(1), 2);
    assert.equal(result.parent(2), null);
    assert.equal(result.node(1).rank, result.node(2).rank - 2);
  });

  it('works from an arbitrary root node', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2 });
    initRank(g);

    var result = feasibleTree(g);

    // Either 1 should be the parent of 2 or vice-versa.
    if (result.parent(1) === null) {
      assert.equal(result.parent(2), 1);
    } else if (result.parent(2) === null) {
      assert.equal(result.parent(1), 2);
    } else {
      assert(false, 'Neither node 1 or 2 are a root node');
    }
  });

  it('can handle a reversed edge', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2, reversed: true });
    initRank(g);

    var result = feasibleTree(g, 1);
    assert.equal(result.parent(1), null);
    assert.equal(result.parent(2), 1);
    assert.equal(result.node(1).rank, result.node(2).rank + 2);
  });

  it('can handle a "double" reversed edge', function() {
    // In this test we have an edge that was reversed in the input graph *and*
    // the edge is points from the child to the parent w.r.t. the tree.
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2, reversed: true });
    initRank(g);

    var result = feasibleTree(g, 2); // This is important - we start from node 2
    assert.equal(result.parent(1), 2);
    assert.equal(result.parent(2), null);
    assert.equal(result.node(1).rank, result.node(2).rank + 2);
  });

  it('uses the max minLen for collapsed multi-edges', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2 });
    g.addEdge(null, 1, 2, { minLen: 3 });
    g.addEdge(null, 1, 2, { minLen: 6 });
    initRank(g);

    var result = feasibleTree(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).minLen, 6);
    assert.equal(result.node(1).rank, result.node(2).rank - 6);
  });

  it('sums the edge count as a weight for multi-edges', function() {
    g.addNode(1, {});
    g.addNode(2, {});
    g.addEdge(null, 1, 2, { minLen: 2 });
    g.addEdge(null, 1, 2, { minLen: 3 });
    g.addEdge(null, 1, 2, { minLen: 6 });
    initRank(g);

    var result = feasibleTree(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).weight, 3);
  });
});
