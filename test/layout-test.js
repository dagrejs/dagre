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

      if (g.node("A").outEdges("B").length > 0) {
        assert.lengthOf(g.node("A").outEdges("B"), 2, "Should have two edges A -> B");
        assert.lengthOf(g.node("A").outEdges(),    2, "Should have no out edges but A -> B");
        assert.lengthOf(g.node("B").outEdges("A"), 0, "If A -> B then not B -> A");
      } else if (g.node("B").outEdges("A").length > 0) {
        assert.lengthOf(g.node("B").outEdges("A"), 2, "Should have two edges B -> A");
        assert.lengthOf(g.node("B").outEdges(),    2, "Should have no out edges but B -> A");
        assert.lengthOf(g.node("A").outEdges("B"), 0, "If B -> A then not A -> B");
      } else {
        assert(false, "Graph does not have A -> B or B -> A:\n" + dagre.graph.write(g));
      }
    });

    it("assigns the weight of the original edge to the reversed edge", function() {
      var g = dagre.graph.read("digraph { A -> B [weight=2]; B -> A [weight=3] }");
      dagre.layout.acyclic(g);

      function weightSort(x, y) { return parseInt(x.attrs.weight) - parseInt(y.attrs.weight); }

      var edges;
      if (g.node("A").outEdges().length > 0) {
        edges = g.node("A").outEdges().sort(weightSort);
      } else if (g.node("B").outEdges().length > 0) {
        edges = g.node("B").outEdges().sort(weightSort);
      } else {
        assert(false, "Graph does not have A -> B or B -> A:\n" + dagre.graph.write(g));
      }

      assert.equal(edges[0].attrs.weight, 2);
      assert.equal(edges[1].attrs.weight, 3);
      assert.isTrue(edges[0].attrs.reverse || edges[1].attrs.reverse, "One of the edges should have the 'reverse' attribute");
      assert.isUndefined(edges[0].attrs.reverse && edges[1].attrs.reverse, "Only one of the edges should have the 'reverse' attribute");
    });
  });
});
