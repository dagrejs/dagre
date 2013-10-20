var assert = require("./assert"),
    dot = require("graphlib-dot"),
    rank = require("../lib/rank");

/*
 * Test the rank phase using the network simplex algorithm.
 */
describe("layout/rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var g = dot.parse("digraph { A }");

    rank(g, true);

    assert.equal(g.node("A").rank, 0);
  });

  it("assigns successive ranks to succesors", function() {
    var g = dot.parse("digraph { A -> B }");

    rank(g, true);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var g = dot.parse("digraph { A -> B; B -> C; A -> C }");

    rank(g, true);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
    assert.equal(g.node("C").rank, 2);
  });

  it("uses an edge's minLen attribute to determine rank", function() {
    var g = dot.parse("digraph { A -> B [minLen=2] }");

    rank(g, true);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 2);
  });

  it("does not assign a rank to a subgraph node", function() {
    var g = dot.parse("digraph { subgraph sg1 { A } }");

    rank(g, true);

    assert.equal(g.node("A").rank, 0);
    assert.notProperty(g.node("sg1"), "rank");
  });

  it("ranks the 'min' node before any adjacent nodes", function() {
    var g = dot.parse("digraph { A; B [prefRank=min]; C; A -> B -> C }");

    rank(g, true);

    assert.isTrue(g.node("B").rank < g.node("A").rank, "rank of B not less than rank of A");
    assert.isTrue(g.node("B").rank < g.node("C").rank, "rank of B not less than rank of C");
  });

  it("ranks an unconnected 'min' node at the level of source nodes", function() {
    var g = dot.parse("digraph { A; B [prefRank=min]; C; A -> C }");

    rank(g, true);

    assert.equal(g.node("B").rank, g.node("A").rank);
    assert.isTrue(g.node("B").rank < g.node("C").rank, "rank of B not less than rank of C");
  });

  it("ensures that minLen is respected for nodes added to the min rank", function() {
    var minLen = 2;
    var g = dot.parse("digraph { B [prefRank=min]; A -> B [minLen=" + minLen + "] }");

    rank(g, true);

    assert.isTrue(g.node("A").rank - minLen >= g.node("B").rank);
  });

  it("ranks the 'max' node before any adjacent nodes", function() {
    var g = dot.parse("digraph { A; B [prefRank=max]; A -> B -> C }");

    rank(g, true);

    assert.isTrue(g.node("B").rank > g.node("A").rank, "rank of B not greater than rank of A");
    assert.isTrue(g.node("B").rank > g.node("C").rank, "rank of B not greater than rank of C");
  });

  it("ranks an unconnected 'max' node at the level of sinks nodes", function() {
    var g = dot.parse("digraph { A; B [prefRank=max]; A -> C }");

    rank(g, true);

    assert.isTrue(g.node("B").rank > g.node("A").rank, "rank of B not greater than rank of A");
    assert.equal(g.node("B").rank, g.node("C").rank);
  });

  it("ensures that minLen is respected for nodes added to the max rank", function() {
    var minLen = 2;
    var g = dot.parse("digraph { A [prefRank=max]; A -> B [minLen=" + minLen + "] }");

    rank(g, true);

    assert.isTrue(g.node("A").rank - minLen >= g.node("B").rank);
  });

  it("ensures that 'max' nodes are on the same rank as source nodes", function() {
    var g = dot.parse("digraph { A [prefRank=max]; B }");

    rank(g, true);

    assert.equal(g.node("A").rank, g.node("B").rank);
  });

  it("gives the same rank to nodes with the same preference", function() {
    var g = dot.parse("digraph { A [prefRank = 1]; B [prefRank = 1]; C [prefRank = 2]; D [prefRank = 2]; A -> B; D -> C; }");

    rank(g, true);

    assert.equal(g.node("A").rank, g.node("B").rank);
    assert.equal(g.node("C").rank, g.node("D").rank);
  });

  it("does not introduce cycles when constraining ranks", function() {
    var g = dot.parse("digraph { A; B [prefRank = 1]; C [prefRank=1]; A -> B; C -> A; }");

    // This will throw an error if a cycle is formed
    rank(g, true);

    assert.equal(g.node("B").rank, g.node("C").rank);
  });

  it("shortens two edges rather than one", function() {
    // An example where the network simplex algorithm makes a difference.
    // The node "mover" could be in rank 1 or 2, but rank 2 minimizes the
    // weighted edge length sum because it shrinks 2 out-edges while lengthening
    // 1 in-edge.
    // Note that non-network simplex ranking doesn't have to get this
    // one wrong, but it happens to do so because of the initial feasible
    // tree it builds.  That's true in general.  Network simplex ranking
    // may provide a better answer because it repeatedly builds feasible
    // trees until finds one without negative cut values.
    var g = dot.parse("digraph { n1 -> n2 -> n3 -> n4;  n1 -> n5 -> n6 -> n7; " +
                                "n1 -> mover;  mover -> n4;  mover -> n7; }");

    rank(g, true);

    assert.equal(g.node("mover").rank, 2);
  });
});

