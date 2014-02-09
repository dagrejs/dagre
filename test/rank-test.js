var assert = require('./assert'),
    dot = require('graphlib-dot'),
    rank = require('../lib/rank');

describe('rank', function() {
  describe('default', function() {
    rankTests(false);
  });

  describe('network simplex', function() {
    rankTests(true);

    it('shortens two edges rather than one', function() {
      // An example where the network simplex algorithm makes a difference.
      // The node "mover" could be in rank 1 or 2, but rank 2 minimizes the
      // weighted edge length sum because it shrinks 2 out-edges while lengthening
      // 1 in-edge.
      // Note that non-network simplex ranking doesn't have to get this
      // one wrong, but it happens to do so because of the initial feasible
      // tree it builds.  That's true in general.  Network simplex ranking
      // may provide a better answer because it repeatedly builds feasible
      // trees until it finds one without negative cut values.
      var g = parse('digraph { n1 -> n2 -> n3 -> n4;  n1 -> n5 -> n6 -> n7; ' +
                              'n1 -> mover;  mover -> n4;  mover -> n7; }');

      rank.run(g, true);

      assert.equal(g.node('mover').rank, 2);
    });
  });
});

function rankTests(withSimplex) {
  it('assigns rank 0 to a node in a singleton graph', function() {
    var g = parse('digraph { A }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, 0);
  });

  it('assigns successive ranks to succesors', function() {
    var g = parse('digraph { A -> B }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, 0);
    assert.equal(g.node('B').rank, 1);
  });

  it('assigns the minimum rank that satisfies all in-edges', function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var g = parse('digraph { A -> B; B -> C; A -> C }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, 0);
    assert.equal(g.node('B').rank, 1);
    assert.equal(g.node('C').rank, 2);
  });

  it('uses an edge\'s minLen attribute to determine rank', function() {
    var g = parse('digraph { A -> B [minLen=2] }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, 0);
    assert.equal(g.node('B').rank, 2);
  });

  it('does not assign a rank to a subgraph node', function() {
    var g = parse('digraph { subgraph sg1 { A } }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, 0);
    assert.notProperty(g.node('sg1'), 'rank');
  });

  it('ranks the \'min\' node before any adjacent nodes', function() {
    var g = parse('digraph { A; B [prefRank=min]; C; A -> B -> C }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('B').rank < g.node('A').rank, 'rank of B not less than rank of A');
    assert.isTrue(g.node('B').rank < g.node('C').rank, 'rank of B not less than rank of C');
  });

  it('ranks an unconnected \'min\' node at the level of source nodes', function() {
    var g = parse('digraph { A; B [prefRank=min]; C; A -> C }');

    rank.run(g, withSimplex);

    assert.equal(g.node('B').rank, g.node('A').rank);
    assert.isTrue(g.node('B').rank < g.node('C').rank, 'rank of B not less than rank of C');
  });

  it('ensures that minLen is respected for nodes added to the min rank', function() {
    var minLen = 2;
    var g = parse('digraph { B [prefRank=min]; A -> B [minLen=' + minLen + '] }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('A').rank - minLen >= g.node('B').rank);
  });

  it('ranks the \'max\' node before any adjacent nodes', function() {
    var g = parse('digraph { A; B [prefRank=max]; A -> B -> C }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('B').rank > g.node('A').rank, 'rank of B not greater than rank of A');
    assert.isTrue(g.node('B').rank > g.node('C').rank, 'rank of B not greater than rank of C');
  });

  it('ranks an unconnected \'max\' node at the level of sinks nodes', function() {
    var g = parse('digraph { A; B [prefRank=max]; A -> C }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('B').rank > g.node('A').rank, 'rank of B not greater than rank of A');
    assert.equal(g.node('B').rank, g.node('C').rank);
  });

  it('ensures that minLen is respected for nodes added to the max rank', function() {
    var minLen = 2;
    var g = parse('digraph { A [prefRank=max]; A -> B [minLen=' + minLen + '] }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('A').rank - minLen >= g.node('B').rank);
  });

  it('ensures that \'aax\' nodes are on the same rank as source nodes', function() {
    var g = parse('digraph { A [prefRank=max]; B }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, g.node('B').rank);
  });

  it('gives the same rank to nodes with the same preference', function() {
    var g = parse('digraph { A [prefRank=same_1]; B [prefRank=same_1]; C [prefRank=same_2]; D [prefRank=same_2]; A -> B; D -> C; }');

    rank.run(g, withSimplex);

    assert.equal(g.node('A').rank, g.node('B').rank);
    assert.equal(g.node('C').rank, g.node('D').rank);
  });

  it('does not apply rank constraints that are not min, max, same_*', function() {
    var g = parse('digraph { A [prefRank=foo]; B [prefRank=foo]; A -> B }');

    // Disable console.error since we're intentionally triggering it
    var oldError = console.error;
    var errors = [];
    try {
      console.error = function(x) { errors.push(x); };
      rank.run(g, withSimplex);
      assert.equal(g.node('A').rank, 0);
      assert.equal(g.node('B').rank, 1);
      assert.isTrue(errors.length >= 1);
      assert.equal(errors[0], 'Unsupported rank type: foo');
    } finally {
      console.error = oldError;
    }
  });

  it('does not introduce cycles when constraining ranks', function() {
    var g = parse('digraph { A; B [prefRank=same_1]; C [prefRank=same_1]; A -> B; C -> A; }');

    // This will throw an error if a cycle is formed
    rank.run(g, withSimplex);

    assert.equal(g.node('B').rank, g.node('C').rank);
  });

  it('returns a graph with edges all pointing to the same or successive ranks', function() {
    // This should put B above A and without any other action would leave the
    // out edge from B point to an earlier rank.
    var g = parse('digraph { A -> B; B [prefRank=min]; }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('B').rank < g.node('A').rank);
    assert.sameMembers(g.successors('B'), ['A']);
    assert.sameMembers(g.successors('A'), []);
  });

  it('properly maintains the reversed edge state when reorienting edges', function() {
    // Here we construct a cyclic graph and ensure that the edges are oriented
    // correctly after undoing the acyclic phase.
    var g = parse('digraph { A -> B -> C -> A; C [prefRank=min]; }');

    rank.run(g, withSimplex);

    assert.isTrue(g.node('C').rank < g.node('A').rank);
    assert.isTrue(g.node('C').rank < g.node('B').rank);

    rank.restoreEdges(g);

    assert.sameMembers(g.successors('A'), ['B']);
    assert.sameMembers(g.successors('B'), ['C']);
    assert.sameMembers(g.successors('C'), ['A']);
  });

  it('handles edge reversal correctly when collapsing nodes yields a cycle', function() {
    // A and A2 get collapsed into a single node and the same happens for B and
    // B2. This yields a cycle between the A rank and the B rank and one of the
    // edges must be reversed. However, we want to be sure that the edge is
    // correct oriented when it comes out of the rank function.
    var g = parse('digraph { { node [prefRank=same_A] A A2 } { node [prefRank=same_B] B B2 } A -> B B2 -> A2 }');

    rank.run(g, withSimplex);
    rank.restoreEdges(g);

    assert.sameMembers(g.successors('A'), ['B']);
    assert.sameMembers(g.successors('A2'), []);
    assert.sameMembers(g.successors('B'), []);
    assert.sameMembers(g.successors('B2'), ['A2']);
  });

  it('yields same result with network simplex and without', function() {
    // The primary purpose of this test is to exercise more of the network
    // simplex code resulting in better code coverage.
    var g = parse('digraph { n1 -> n3; n1 -> n4; n1 -> n5; n1 -> n6; n1 -> n7; ' +
                  'n2 -> n3; n2 -> n4; n2 -> n5; n2 -> n6; n2 -> n7; }');

    rank.run(g, withSimplex);

    assert.equal(g.node('n1').rank, 0);
    assert.equal(g.node('n2').rank, 0);
    assert.equal(g.node('n3').rank, 1);
    assert.equal(g.node('n4').rank, 1);
    assert.equal(g.node('n5').rank, 1);
    assert.equal(g.node('n6').rank, 1);
    assert.equal(g.node('n7').rank, 1);
  });
}

/*
 * Parses the given DOT string into a graph and performs some intialization
 * required for using the rank algorithm.
 */
function parse(str) {
  var g = dot.parse(str);

  // The rank algorithm requires that edges have a `minLen` attribute
  g.eachEdge(function(e, u, v, value) {
    if (!('minLen' in value)) {
      value.minLen = 1;
    }
  });

  return g;
}
