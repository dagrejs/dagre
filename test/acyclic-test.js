var assert = require("./assert"),
    dot = require("graphlib-dot"),
    acyclic = require("../lib/acyclic"),
    isAcyclic = require("graphlib").alg.isAcyclic,
    findCycles = require("graphlib").alg.findCycles;

describe("acyclic", function() {
  it("does not change acyclic graphs", function() {
    var g = dot.parse("digraph { A -> B; C }");
    acyclic(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B", "C"]);
    assert.deepEqual(g.successors("A"), ["B"]);
    assertAcyclic(g);
  });

  it("reverses edges to make the graph acyclic", function() {
    var g = dot.parse("digraph { A -> B [id=\"AB\"]; B -> A [id=\"BA\"] }");
    assert.isFalse(isAcyclic(g));
    acyclic(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B"]);
    assert.notEqual(g.source("AB"), g.target("AB"));
    assert.equal(g.target("AB"), g.target("BA"));
    assert.equal(g.source("AB"), g.source("BA"));
    assertAcyclic(g);
  });

  it("removes self loops", function() {
    var g = dot.parse("digraph { A -> A [id=\"AA\"]; }");
    acyclic(g);
    acyclic(g);
    assertAcyclic(g);
  });

  it("restores self loops with undo", function() {
    var g = dot.parse("digraph { A -> A [id=\"AA\", foo=original]; }");
    acyclic(g);
    acyclic.undo(g);
    assert.propertyVal(g.edge("AA"), "foo", "original");
  });

  it("avoids collision when restoring self loop", function() {
    // This test concerns avoiding collisions with edges added using the
    // auto-id generator. Here we explicitly force this situation by adding
    // an edge with the same id. We expect that the added edge is renamed and
    // the self loop is restored.
    var g = dot.parse("digraph { A -> A [id=\"AA\", foo=original]; }");
    acyclic(g);
    g.addEdge("AA", "A", "A", { foo: "other" });
    acyclic.undo(g);
    assert.propertyVal(g.edge("AA"), "foo", "original");
    var otherIds = g.edges().filter(function(e) { return e !== "AA"; });
    assert.lengthOf(otherIds, 1);
    assert.propertyVal(g.edge(otherIds[0]), "foo", "other");
  });

  it("is a reversible process", function() {
    var g = dot.parse("digraph { A -> B [id=\"AB\"]; B -> A [id=\"BA\"] }");
    g.graph({});
    acyclic(g);
    acyclic.undo(g);
    assert.deepEqual(g.nodes().sort(), ["A", "B"]);
    assert.equal(g.source("AB"), "A");
    assert.equal(g.target("AB"), "B");
    assert.equal(g.source("BA"), "B");
    assert.equal(g.target("BA"), "A");
  });

  it("works for multiple cycles", function() {
    var g = dot.parse("digraph { A -> B -> A; B -> C -> D -> E -> C; G -> C; G -> H -> G; H -> I -> J }");
    assert.isFalse(isAcyclic(g));
    acyclic(g);
    assertAcyclic(g);
  });
});

function assertAcyclic(g) {
  assert.deepEqual(findCycles(g), [], "Found one or more cycles in the actual graph");
}
