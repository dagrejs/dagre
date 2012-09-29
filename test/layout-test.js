require("./common");

describe("layout", function() {
  describe("acyclic", function() {
    it("doesn't change an acyclic graph", function() {
      var g = dagre.graph.read("digraph { A -> B -> D; A -> C -> D }");
      var copy = g.copy();
      dagre.layout.acyclic(g);
      assert.equal(g.toString(), copy.toString());
    });

    it("removes self loops", function() {
      var g = dagre.graph.read("digraph { A -> A }");
      dagre.layout.acyclic(g);
      assert.lengthOf(g.node("A").neighbors, 0);
    });

    it("reverses edges that cause cycles", function() {
      var g = dagre.graph.read("digraph { A -> B; B -> A }");
      dagre.layout.acyclic(g);
      if (g.edge("A", "B")) {
        assert.lengthOf(g.node("B").successors, 0, "If A -> B then not B -> A");
      } else if (g.edge("B", "A")) {
        assert.lengthOf(g.node("A").successors, 0, "If B -> A then not A -> B");
      } else {
        assert(false, "Graph does not have A -> B or B -> A:\n" + graph.graph.write(g));
      }
    });

    it("assigns the weight of the original edge to the reversed edge", function() {
      var g = dagre.graph.read("digraph { A -> B [weight=2]; B -> C [weight=3]; C -> A [weight=4] }");
      dagre.layout.acyclic(g);

      if (g.edge("B", "A")) {
        assert.strictEqual(g.edge("B", "A").attrs.weight, 2);
      } else if (g.edge("C", "B")) {
        assert.strictEqual(g.edge("C", "B").attrs.weight, 3);
      } else if (g.edge("A", "C")) {
        assert.strictEqual(g.edge("A", "C").attrs.weight, 4);
      } else {
        assert(false, "Graph does not have B -> A, C -> B, or A -> C:\n" + dagre.graph.write(g));
      }
    });

    it("sums weights of reversed edges", function() {
      // Note that weights will be strings in `g` - this also ensures that
      // `acyclic` is doing proper int coercion.
      var g = dagre.graph.read("digraph { A -> B [weight=2]; B -> A [weight=3] }");
      dagre.layout.acyclic(g);
      if (g.edge("A", "B")) {
        assert.equal(g.edge("A", "B").attrs.weight, 5);
      } else if (g.edge("B", "A")) {
        assert.equal(g.edge("B", "A").attrs.weight, 5);
      } else {
        assert(false, "Graph does not have A -> B or B -> A:\n" + dagre.graph.write(g));
      }
    });
  });
});
