describe("dagre.dot.toGraph", function() {
  it("allows an empty label", function() {
    var g = dagre.dot.toGraph("digraph { a [label=\"\"]; }");
    assert.equal(g.node("a").label, "");
  });
  it("adds default attributes to nodes", function() {
    var dot = "digraph { node [color=black shape=box]; n1 [label=\"n1\"]; }";
    var g = dagre.dot.toGraph(dot);
    assert.equal(g.node("n1").color, "black");
    assert.equal(g.node("n1").shape, "box");
  });
  it("combines multiple default attribute statements", function() {
    var dot = "digraph { node [color=black]; node [shape=box]; n1 [label=\"n1\"]; }";
    var g = dagre.dot.toGraph(dot);
    assert.equal(g.node("n1").color, "black");
    assert.equal(g.node("n1").shape, "box");
  });
  it("takes statement order into account when applying default attributes", function() {
    var dot = "digraph { node [color=black]; n1 [label=\"n1\"]; node [shape=box]; n2 [label=\"n2\"]; }";
    var g = dagre.dot.toGraph(dot);
    assert.equal(g.node("n1").color, "black");
    assert.equal(g.node("n1").shape, undefined);

    assert.equal(g.node("n2").color, "black");
    assert.equal(g.node("n2").shape, "box");
  });
  it("overrides redefined default attributes", function() {
    var dot = "digraph { node [color=black]; n1 [label=\"n1\"]; node [color=green]; n2 [label=\"n2\"]; }";
    var g = dagre.dot.toGraph(dot);
    assert.equal(g.node("n1").color, "black");
    assert.equal(g.node("n2").color, "green");
  });
});
