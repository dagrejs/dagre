var common = require("../common"),
    assert = require("chai").assert,
    dot = require("../../lib/dot"),
    rank = require("../../lib/layout/rank");

describe("layout/rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var g = dot.toGraph("digraph { A }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
  });

  it("assigns successive ranks to succesors", function() {
    var g = dot.toGraph("digraph { A -> B }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var g = dot.toGraph("digraph { A -> B; B -> C; A -> C }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
    assert.equal(g.node("C").rank, 2);
  });

  it("uses an edge's minLen attribute to determine rank", function() {
    var g = dot.toGraph("digraph { A -> B [minLen=2] }");

    rank(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 2);
  });
});

