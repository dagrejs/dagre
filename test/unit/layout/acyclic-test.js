var assert = require("../assert"),
    dot = require("graphlib-dot"),
    acyclic = require("../../../lib/layout/acyclic"),
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

  it("is a reversible process", function() {
    var g = dot.parse("digraph { A -> B [id=\"AB\"]; B -> A [id=\"BA\"] }");
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
