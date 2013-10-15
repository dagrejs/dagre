var assert = require("./assert"),
    dot = require("graphlib-dot"),
    rank = require("../lib/rank");

describe("layout/rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var g = dot.parse("digraph { A }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
  });

  it("assigns successive ranks to succesors", function() {
    var g = dot.parse("digraph { A -> B }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var g = dot.parse("digraph { A -> B; B -> C; A -> C }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
    assert.equal(g.node("C").rank, 2);
  });

  it("uses an edge's minLen attribute to determine rank", function() {
    var g = dot.parse("digraph { A -> B [minLen=2] }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 2);
  });

  it("does not assign a rank to a subgraph node", function() {
    var g = dot.parse("digraph { subgraph sg1 { A } }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.notProperty(g.node("sg1"), "rank");
  });

  it("ranks the 'min' node before any others", function() {
    var g = dot.parse("digraph { A; B [prefRank = \"min\"]; C; }");

    rank(g);

    assert(g.node("B").rank < g.node("A").rank, "rank of B not less than rank of A");
    assert(g.node("B").rank < g.node("C").rank, "rank of B not less than rank of C");
  });

  it("ranks the 'max' node after any others", function() {
    var g = dot.parse("digraph { A; B [prefRank = \"max\"]; C; }");

    rank(g);

    assert(g.node("B").rank > g.node("A").rank, "rank of B not greater than rank of A");
    assert(g.node("B").rank > g.node("C").rank, "rank of B not greater than rank of C");
  });

  it("gives the same rank to nodes with the same preference", function() {
    var g = dot.parse("digraph { A [prefRank = 1]; B [prefRank = 1]; C [prefRank = 2]; D [prefRank = 2]; A -> B; D -> C; }");

    rank(g);

    assert.equal(g.node("A").rank, g.node("B").rank);
    assert.equal(g.node("C").rank, g.node("D").rank);
  });
});

