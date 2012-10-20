require("./common");

describe("graph", function() {
  var g;

  beforeEach(function() {
    g = dagre.graph.create();
  });

  describe("empty graph", function() {
    it("has no nodes", function() {
      assert.lengthOf(g.nodes(), 0);
    });

    it("has no edges", function() {
      assert.lengthOf(g.edges(), 0);
    });
  });

  describe("addNode", function() {
    it("adds a new node to the graph", function() {
      var u = g.addNode(1);

      assert.deepEqual(ids(g.nodes()), [1]);

      assert.equal(g.node(1).id(), 1);

      assert.equal(u.id(), 1);
      assert.deepEqual(u.attrs, {});
      assert.lengthOf(u.successors(), 0);
      assert.lengthOf(u.predecessors(), 0);
      assert.lengthOf(u.neighbors(), 0);
      assert.lengthOf(u.outEdges(), 0);
      assert.lengthOf(u.inEdges(), 0);
      assert.lengthOf(u.edges(), 0);
    });

    it("can add an initial set of attributes", function() {
      var u = g.addNode(1, {a: 1, b: 2});
      assert.deepEqual(u.attrs, {a: 1, b: 2});
    });

    it("merges properties if the node already exists", function() {
      g.addNode(1, {a: 1, b: 2});
      var u = g.addNode(1, {b: 3, c: 4});
      assert.equal(u.id(), 1);
      assert.deepEqual(u.attrs, {a: 1, b: 3, c: 4});
    });
  });

  describe("removeNode", function() {
    it("removes the node from the graph", function() {
      var u = g.addNode(1);
      g.addNode(2);
      g.removeNode(1);
      assert.deepEqual(ids(g.nodes()), [2]);
    });

    it("removes out edges", function() {
      var u = g.addNode(1);
      var v = g.addNode(2);
      g.addEdge(null, u, v);
      g.removeNode(u);
      assert.deepEqual(v.predecessors(), []);
    });

    it("removes in edges", function() {
      var u = g.addNode(1);
      var v = g.addNode(2);
      g.addEdge(null, v, u);
      g.removeNode(u);
      assert.deepEqual(v.successors(), []);
    });
  });

  describe("node", function() {
    var g, u, v;

    beforeEach(function() {
      g = dagre.graph.create();
      u = g.addNode(1);
      v = g.addNode(2);
    });

    describe("neighbors", function() {
      it("only includes neighbor nodes once", function() {
        g.addEdge(null, u, v);
        g.addEdge(null, v, u);

        assert.deepEqual(ids(u.neighbors()), [v.id()]);
      });
    });

    describe("edges", function() {
      it("only includes each edge once", function() {
        var e = g.addEdge(null, u, u);
        assert.deepEqual(ids(u.edges()), [e.id()]);
      });
    });

    describe("outDegree", function() {
      it("returns the number of edges that point out from the node", function() {
        var w = g.addNode(3);
        g.addEdge(null, v, u);

        // Two edges incident on the same nodes to test multi-edges.
        g.addEdge(null, w, u);
        g.addEdge(null, w, u);

        assert.equal(u.outDegree(), 0);
        assert.equal(v.outDegree(), 1);
        assert.equal(w.outDegree(), 2);
      });
    });

    describe("inDegree", function() {
      it("returns the number of edges that point to the node", function() {
        var w = g.addNode(3);
        g.addEdge(null, u, v);

        // Two edges incident on the same nodes to test multi-edges.
        g.addEdge(null, u, w);
        g.addEdge(null, u, w);

        assert.equal(u.inDegree(), 0);
        assert.equal(v.inDegree(), 1);
        assert.equal(w.inDegree(), 2);
      });
    });

    it("removeEdge removes the appropriate edge", function() {
      var e = g.addEdge(null, u, v);
      g.removeEdge(e);

      assert.deepEqual(ids(u.successors()), []);
      assert.deepEqual(ids(u.neighbors()), []);

      assert.deepEqual(ids(v.predecessors()), []);
      assert.deepEqual(ids(u.neighbors()), []);
    });

    describe("subgraph", function() {
      it("returns a graph containing a subset of nodes", function() {
        var g = dagre.graph.read("digraph { A -> B -> C }");
        var subgraph = g.subgraph(["A", "B"]);
        assert.deepEqual(ids(subgraph.nodes()).sort(), ["A", "B"]);
        assert.deepEqual(ids(tails(subgraph.edges())).sort(), ["A"]);
        assert.deepEqual(ids(heads(subgraph.edges())).sort(), ["B"]);
      });

      it("copies attributes from the old graph to the new graph", function() {
        var g = dagre.graph.read("digraph { graph [graphAttr=1]; A -> B -> C [edgeAttr=2]; A [nodeAttr=3] }");
        var subgraph = g.subgraph(["A", "B"]);
        assert.deepEqual(subgraph.attrs, {graphAttr: '1'});
        assert.deepEqual(subgraph.edges("A", "B")[0].attrs, {edgeAttr: '2'});
        assert.deepEqual(subgraph.node("A").attrs, {nodeAttr: '3'});
      });
    });
  });
});

