describe("dagre.dot.toGraph", function() {
  it("allows an empty label", function() {
    var g = dagre.dot.toGraph("digraph { a [label=\"\"]; }");
    assert.equal(g.node("a").label, "");
  });
});
