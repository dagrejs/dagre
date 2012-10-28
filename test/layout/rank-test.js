require("../common");

describe("dagre.layout.rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var g = dagre.dot.toGraph("digraph { A }");

    dagre.layout.rank().run(g);

    assert.equal(g.node("A").rank, 0);
  });

  it("assigns successive ranks to succesors", function() {
    var g = dagre.dot.toGraph("digraph { A -> B }");

    dagre.layout.rank().run(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var g = dagre.dot.toGraph("digraph { A -> B; B -> C; A -> C }");

    dagre.layout.rank().run(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 1);
    assert.equal(g.node("C").rank, 2);
  });

  it("uses an edge's minLen attribute to determine rank", function() {
    var g = dagre.dot.toGraph("digraph { A -> B [minLen=2] }");

    dagre.layout.rank().run(g);

    assert.equal(g.node("A").rank, 0);
    assert.equal(g.node("B").rank, 2);
  });
});

