require("./common.js");

describe("graph", function() {
  var g;

  beforeEach(function() {
    g = dagre.graph.create();
  });

  function ids(objs) {
    return objs.map(function(obj) { return obj.id(); });
  }

  function tails(es) {
    return es.map(function(e) { return e.tail(); });
  }

  function heads(es) {
    return es.map(function(e) { return e.head(); });
  }

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
      u.addSuccessor(v);
      g.removeNode(u);
      assert.deepEqual(v.predecessors(), []);
    });

    it("removes in edges", function() {
      var u = g.addNode(1);
      var v = g.addNode(2);
      u.addPredecessor(v);
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

    describe("addSuccessor", function() {
      it("adds a successor for the node", function() {
        u.addSuccessor(v);

        assert.deepEqual(ids(u.successors()), [2]);
        assert.deepEqual(ids(u.predecessors()), []);
        assert.deepEqual(ids(u.neighbors()), [2]);
        assert.deepEqual(ids(tails(u.outEdges())), [1]);
        assert.deepEqual(ids(heads(u.outEdges())), [2]);
        assert.deepEqual(ids(tails(u.inEdges())), []);
        assert.deepEqual(ids(heads(u.inEdges())), []);
        assert.deepEqual(ids(tails(u.edges())).sort(), [1]);
        assert.deepEqual(ids(heads(u.edges())).sort(), [2]);

        assert.deepEqual(ids(v.successors()), []);
        assert.deepEqual(ids(v.predecessors()), [1]);
        assert.deepEqual(ids(v.neighbors()), [1]);
        assert.deepEqual(ids(tails(v.outEdges())), []);
        assert.deepEqual(ids(heads(v.outEdges())), []);
        assert.deepEqual(ids(tails(v.inEdges())), [1]);
        assert.deepEqual(ids(heads(v.inEdges())), [2]);
        assert.deepEqual(ids(tails(v.edges())).sort(), [1]);
        assert.deepEqual(ids(heads(v.edges())).sort(), [2]);
      });

      it("can add an initial set of attributes", function() {
        var e = u.addSuccessor(v, {a: 1, b: 2});
        assert.deepEqual(e.attrs, {a: 1, b: 2});
      });

      it("creates multiple edges when called with the same successor", function() {
        var e1 = u.addSuccessor(v, {a: 1, b: 2});
        var e2 = u.addSuccessor(v, {b: 3, c: 4});
        assert.deepEqual(ids(u.outEdges()).sort(), [e1.id(), e2.id()].sort());
      });
    });

    describe("addPredecessor", function() {
      it("adds a predecessor for the node", function() {
        u.addPredecessor(v);

        assert.deepEqual(ids(u.successors()), []);
        assert.deepEqual(ids(u.predecessors()), [2]);
        assert.deepEqual(ids(u.neighbors()), [2]);
        assert.deepEqual(ids(tails(u.outEdges())), []);
        assert.deepEqual(ids(heads(u.outEdges())), []);
        assert.deepEqual(ids(tails(u.inEdges())), [2]);
        assert.deepEqual(ids(heads(u.inEdges())), [1]);
        assert.deepEqual(ids(tails(u.edges())).sort(), [2]);
        assert.deepEqual(ids(heads(u.edges())).sort(), [1]);

        assert.deepEqual(ids(v.successors()), [1]);
        assert.deepEqual(ids(v.predecessors()), []);
        assert.deepEqual(ids(v.neighbors()), [1]);
        assert.deepEqual(ids(tails(v.outEdges())), [2]);
        assert.deepEqual(ids(heads(v.outEdges())), [1]);
        assert.deepEqual(ids(tails(v.inEdges())), []);
        assert.deepEqual(ids(heads(v.inEdges())), []);
        assert.deepEqual(ids(tails(v.edges())).sort(), [2]);
        assert.deepEqual(ids(heads(v.edges())).sort(), [1]);
      });

      it("can add an initial set of attributes", function() {
        var e = u.addPredecessor(v, {a: 1, b: 2});
        assert.deepEqual(e.attrs, {a: 1, b: 2});
      });

      it("creates multiple edges when called with the same successor", function() {
        var e1 = u.addPredecessor(v, {a: 1, b: 2});
        var e2 = u.addPredecessor(v, {b: 3, c: 4});
        assert.deepEqual(ids(u.inEdges()).sort(), [e1.id(), e2.id()].sort());
      });
    });

    describe("neighbors", function() {
      it("only includes neighbor nodes once", function() {
        u.addSuccessor(v);
        u.addPredecessor(v);

        assert.deepEqual(ids(u.neighbors()), [v.id()]);
      });
    });

    describe("edges", function() {
      it("only includes each edge once", function() {
        var e = u.addSuccessor(u);
        assert.deepEqual(ids(u.edges()), [e.id()]);
      });
    });

    describe("outDegree", function() {
      it("returns the number of edges that point out from the node", function() {
        var w = g.addNode(3);
        v.addSuccessor(u);

        // Two edges incident on the same nodes to test multi-edges.
        w.addSuccessor(u);
        w.addSuccessor(u);

        assert.equal(u.outDegree(), 0);
        assert.equal(v.outDegree(), 1);
        assert.equal(w.outDegree(), 2);
      });
    });

    describe("inDegree", function() {
      it("returns the number of edges that point to the node", function() {
        var w = g.addNode(3);
        v.addPredecessor(u);

        // Two edges incident on the same nodes to test multi-edges.
        w.addPredecessor(u);
        w.addPredecessor(u);

        assert.equal(u.inDegree(), 0);
        assert.equal(v.inDegree(), 1);
        assert.equal(w.inDegree(), 2);
      });
    });

    it("removeEdge removes the appropriate edge", function() {
      var e = u.addSuccessor(v);
      g.removeEdge(e);

      assert.deepEqual(ids(u.successors()), []);
      assert.deepEqual(ids(u.neighbors()), []);

      assert.deepEqual(ids(v.predecessors()), []);
      assert.deepEqual(ids(u.neighbors()), []);
    });

    it("copy creates a copy of the graph", function() {
      var src = dagre.graph.read("digraph { A -> B [weight = 5]; A [label=abc]; B [label=xyz] }");
      src.attrs.graphAttr = 123;
      var copy = src.copy();
      assert.equal(dagre.graph.write(src), dagre.graph.write(copy));

      // Changes in `src` should not be reflected in `copy`
      src.node("A").attrs.label = "bcd";
      assert.notEqual("bcd", copy.node("A").attrs.label, "changes to `src` should not reflected in `copy`");

      // Changes in `copy` should not be reflected in `src`
      copy.node("B").attrs.label = "wxy";
      assert.notEqual("wxy", src.node("B").attrs.label, "changes to `copy` should not be reflected in `src`");
    });
  });
});

