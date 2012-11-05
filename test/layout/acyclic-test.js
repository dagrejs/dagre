require("../common");

describe("dagre.layout.acyclic", function() {
  it("does not change acyclic graphs", function() {
    var g = dagre.dot.toGraph("digraph { A -> B; C }");
    dagre.layout.acyclic().run(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B", "C"]);
    assert.deepEqual(g.successors("A"), ["B"]);
  });

  it("reverses edges to make the graph acyclic", function() {
    var g = dagre.dot.toGraph("digraph { A -> B [id=\"AB\"]; B -> A [id=\"BA\"] }");
    assert.isFalse(isAcyclic(g));
    dagre.layout.acyclic().run(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B"]);
    assert.notEqual(g.source("AB"), g.target("AB"));
    assert.equal(g.target("AB"), g.target("BA"));
    assert.equal(g.source("AB"), g.source("BA"));
    assert.isTrue(isAcyclic(g));
  });

  it("is a reversible process", function() {
    var g = dagre.dot.toGraph("digraph { A -> B [id=\"AB\"]; B -> A [id=\"BA\"] }");
    dagre.layout.acyclic().run(g);
    dagre.layout.acyclic().undo(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B"]);
    assert.equal(g.source("AB"), "A");
    assert.equal(g.target("AB"), "B");
    assert.equal(g.source("BA"), "B");
    assert.equal(g.target("BA"), "A");
  });

  it("works for multiple cycles", function() {
    var g = dagre.dot.toGraph("digraph { A -> B -> A; B -> C; C -> D -> E -> C; E -> F; F -> A; G -> C; G -> H -> G; E -> H }");
    assert.isFalse(isAcyclic(g));
    dagre.layout.acyclic().run(g);
    assert.isTrue(isAcyclic(g));
  });

  function isAcyclic(g) {
    // This algorithm is suboptimal, but fine for test purposes
    var copy = g.subgraph(g.nodes());
    var removedOne;
    while (g.nodes().length) {
      removedOne = false;
      g.nodes().forEach(function(u) {
        if (!g.predecessors(u).length) {
          g.delNode(u);
          removedOne = true;
        }
      });
      if (!removedOne) {
        return false;
      }
    }
    return true;
  }
});
