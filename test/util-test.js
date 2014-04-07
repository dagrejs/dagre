var assert = require('./assert'),
    util = require('../lib/util'),
    CDigraph = require('graphlib').CDigraph;

describe('util.sum', function() {
  it('returns the sum of all elements in the array', function() {
    assert.equal(util.sum([1,2,3,4]), 10);
  });

  it('returns 0 if there are no elements in the array', function() {
    assert.equal(util.sum([]), 0);
  });
});

describe('util.all', function() {
  it('returns true if f(x) holds for all x in xs', function() {
    assert.isTrue(util.all([1,2,3,4], function(x) {
      return x > 0;
    }));
  });

  it('returns false if f(x) does not hold for all x in xs', function() {
    assert.isFalse(util.all([1,2,3,-1], function(x) {
      return x > 0;
    }));
  });

  it('fails fast if f(x) does not hold for all x in xs', function() {
    var lastSeen;
    assert.isFalse(util.all([1,2,-1,3,4], function(x) {
      lastSeen = x;
      return x > 0;
    }));
    assert.equal(lastSeen, -1);
  });
});

describe('util.findLCA', function() {
  it('returns null if there is no common ancestor', function() {
    var g = new CDigraph();
    g.addNode('a');
    g.addNode('b');
    g.addNode('sg1');
    g.addNode('sg2');
    g.parent('a', 'sg1');
    g.parent('b', 'sg2');

    assert.equal(util.findLCA(g, 'a', 'b'), null);
  });

  it('returns a parents node if both node arguments are the same', function() {
    var g = new CDigraph();
    g.addNode('a');
    g.addNode('sg1');
    g.parent('a', 'sg1');

    assert.equal(util.findLCA(g, 'a', 'a'), 'sg1');
  });

  it('returns a common ancestor', function() {
    var g = new CDigraph();
    g.addNode('a');
    g.addNode('b');
    g.addNode('sg1');
    g.parent('a', 'sg1');
    g.parent('b', 'sg1');

    assert.equal(util.findLCA(g, 'a', 'b'), 'sg1');
  });

  it('returns a common ancestor at different depths', function() {
    // This test ensures that the LCA search only stops when the root is
    // reached from BOTH paths. If the nodes are at different depths this
    // becomes important.
    var g = new CDigraph();
    g.addNode('a');
    g.addNode('b');
    g.addNode('sg1');
    g.addNode('sg2');
    g.parent('a', 'sg1');
    g.parent('b', 'sg2');
    g.parent('sg2', 'sg1');

    assert.equal(util.findLCA(g, 'a', 'b'), 'sg1');
  });
});
