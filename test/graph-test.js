require("./common");

describe("graph", function() {
  var g;

  beforeEach(function() {
    g = dagre.graph();
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
      g.addNode(1);

      assert.deepEqual(g.nodes(), [1]);

      assert.lengthOf(g.successors(1), 0);
      assert.lengthOf(g.predecessors(1), 0);
      assert.lengthOf(g.neighbors(1), 0);
    });
  });

  describe("delNode", function() {
    it("removes the node from the graph", function() {
      g.addNode(1);
      g.addNode(2);
      g.delNode(1);
      assert.deepEqual(g.nodes(), [2]);
    });

    it("removes out edges", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("1 -> 2", 1, 2);
      g.delNode(1);
      assert.lengthOf(g.predecessors(2), 0);
    });

    it("removes in edges", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("2 -> 1", 2, 1);
      g.delNode(1);
      assert.lengthOf(g.successors(2), 0);
    });
  });

  describe("node", function() {
    it("throws if the node isn't in the graph", function() {
      assert.throws(function() { g.node(1); });
    });

    it("has an undefined value if no value was assigned to the node", function() {
      g.addNode(1);
      assert.isUndefined(g.node(1));
    });

    it("returns the node's value if one was set", function() {
      var value = { abc: 123 };
      g.addNode(1, value);
      assert.strictEqual(g.node(1), value);
    });
  });

  describe("addEdge", function() {
    it("adds a new edge to the graph", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("a", 1, 2);

      assert.deepEqual(g.edges(), ["a"]);

      assert.deepEqual(g.successors(1), [2]);
      assert.deepEqual(g.predecessors(2), [1]);
      assert.deepEqual(g.neighbors(1), [2]);
      assert.deepEqual(g.neighbors(2), [1]);
    });

    it("assigns an arbitrary edge id if the given id is null", function() {
      g.addNode(1);
      g.addNode(2);
      g.addNode(3);
      g.addEdge(null, 1, 2);
      g.addEdge(null, 2, 3);

      assert.deepEqual(g.successors(1), [2]);
      assert.deepEqual(g.successors(2), [3]);
    });
  });

  describe("delEdge", function() {
    it("removes the specified edge from the graph", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("a", 1, 2);
      g.delEdge("a");

      assert.lengthOf(g.edges(), 0);

      assert.lengthOf(g.successors(1), 0);
      assert.lengthOf(g.predecessors(1), 0);
      assert.lengthOf(g.neighbors(1), 0);
    });
  });

  describe("edge", function() {
    it("throws if the edge isn't in the graph", function() {
      assert.throws(function() { g.edge(3); });
    });

    it("has the nodes that are incident on the edge", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge(3, 1, 2);
      assert.equal(g.source(3), 1);
      assert.equal(g.target(3), 2);
    });

    it("has an undefined value if no value was assigned to the edge", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge(3, 1, 2);
      assert.isUndefined(g.edge(3));
    });

    it("returns the edge's value if one was set", function() {
      var value = { abc: 123 };
      g.addNode(1);
      g.addNode(2);
      g.addEdge(3, 1, 2, value);
      assert.strictEqual(g.edge(3), value);
    });
  });

  describe("edges", function() {
    it("returns all edges with no arguments", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("A", 1, 2);
      g.addEdge("B", 1, 2);
      g.addEdge("C", 2, 1);

      assert.deepEqual(g.edges().sort(), ["A", "B", "C"]);
    });

    it("returns all edges that are incident on a node", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("A", 1, 2);
      g.addEdge("B", 1, 2);
      g.addEdge("C", 1, 1);
      g.addEdge("D", 2, 1);
      g.addEdge("E", 2, 2);

      assert.deepEqual(g.edges(1).sort(), ["A", "B", "C", "D"]);
      assert.deepEqual(g.edges(2).sort(), ["A", "B", "D", "E"]);
    });

    it("returns all edges from a source to a target", function() {
      g.addNode(1);
      g.addNode(2);
      g.addNode(3);
      g.addEdge("A", 1, 2);
      g.addEdge("B", 1, 2);
      g.addEdge("C", 2, 1);
      g.addEdge("D", 2, 3);

      assert.deepEqual(g.edges(1, 2).sort(), ["A", "B"]);
      assert.deepEqual(g.edges(2, 1).sort(), ["C"]);
      assert.deepEqual(g.edges(2, 3).sort(), ["D"]);
      assert.deepEqual(g.edges(3, 1).sort(), []);
    });
  });

  describe("outEdges", function() {
    it("returns all out edges from a source", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("A", 1, 2);
      g.addEdge("B", 1, 2);
      g.addEdge("C", 1, 1);
      g.addEdge("D", 2, 1);
      g.addEdge("E", 2, 2);

      assert.deepEqual(g.outEdges(1).sort(), ["A", "B", "C"]);
      assert.deepEqual(g.outEdges(2).sort(), ["D", "E"]);
    });
  });

  describe("inEdges", function() {
    it("returns all in edges to a target", function() {
      g.addNode(1);
      g.addNode(2);
      g.addEdge("A", 1, 2);
      g.addEdge("B", 1, 2);
      g.addEdge("C", 1, 1);
      g.addEdge("D", 2, 1);
      g.addEdge("E", 2, 2);

      assert.deepEqual(g.inEdges(1).sort(), ["C", "D"]);
      assert.deepEqual(g.inEdges(2).sort(), ["A", "B", "E"]);
    });
  });

  describe("subgraph", function() {
    it("returns a graph containing a subset of nodes", function() {
      var g = dagre.graph();
      [1,2,3].forEach(function(u) { g.addNode(u); });
      g.addEdge("a", 1, 2);
      g.addEdge("b", 2, 3);

      var subgraph = g.subgraph([1, 2]);
      assert.deepEqual(subgraph.nodes().sort(), [1, 2]);
      assert.deepEqual(subgraph.edges(), ["a"]);
    });

    it("includes each node's value in the subgraph", function() {
      var g = dagre.graph();
      [1,2,3].forEach(function(u) { g.addNode(u, "V" + u); });
      g.addEdge("a", 1, 2);
      g.addEdge("b", 2, 3);

      var subgraph = g.subgraph([1, 2]);
      assert.equal(subgraph.node(1), "V1");
      assert.equal(subgraph.node(2), "V2");
    });

    it("includes each edge's value in the subgraph", function() {
      var g = dagre.graph();
      [1,2,3].forEach(function(u) { g.addNode(u); });
      g.addEdge("a", 1, 2, "VA");
      g.addEdge("b", 2, 3);

      var subgraph = g.subgraph([1, 2]);
      assert.equal(subgraph.edge("a"), "VA");
    });
  });
});

