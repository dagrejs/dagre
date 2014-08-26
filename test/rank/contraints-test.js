var assert = require("../assert");

var constraints = require("../../lib/rank/constraints");

var CDigraph = require("graphlib").CDigraph;

describe("constraints", function() {
  var g;

  beforeEach(function() {
    g = new CDigraph();
    g.graph({});
  });

  describe("apply", function() {
    it("does not change unconstrained nodes", function() {
      g.addNode(1, {});
      constraints.apply(g);
      assert.sameMembers(g.nodes(), [1]);
    });

    it("collapses nodes with prefRank=min", function() {
      g.addNode(1, {});
      g.addNode(2, { prefRank: "min" });
      g.addNode(3, { prefRank: "min"});
      g.addNode(4, {});
      g.addEdge("A", 1, 2, { minLen: 2 });
      g.addEdge("B", 3, 4, { minLen: 4 });

      constraints.apply(g);
      assert.lengthOf(g.nodes(), 3);
      assert.includeMembers(g.nodes(), [1, 4]);

      // We should end up with a collapsed min node pointing at 1 and 4 with
      // correct minLen and reversed flags.
      var min = g.nodes().filter(function(u) { return u !== 1 && u !== 4; })[0];
      assert.lengthOf(g.inEdges(min), 0, "there should be no in-edges to the min node");

      assert.lengthOf(g.outEdges(min, 1), 1);
      var eMin1 = g.outEdges(min, 1);
      assert.propertyVal(g.edge(eMin1), "minLen", 2);
      assert.propertyVal(g.edge(eMin1), "reversed", true);

      assert.lengthOf(g.outEdges(min, 4), 1);
      var eMin4 = g.outEdges(min, 4);
      assert.propertyVal(g.edge(eMin4), "minLen", 4);
      assert.notProperty(g.edge(eMin4), "reversed");
    });

    it("collapses nodes with prefRank=max", function() {
      g.addNode(1, {});
      g.addNode(2, { prefRank: "max" });
      g.addNode(3, { prefRank: "max"});
      g.addNode(4, {});
      g.addEdge("A", 1, 2, { minLen: 2 });
      g.addEdge("B", 3, 4, { minLen: 4 });

      constraints.apply(g);
      assert.lengthOf(g.nodes(), 3);
      assert.includeMembers(g.nodes(), [1, 4]);

      // We should end up with a collapsed nax node pointed at by 1 and 4 with
      // correct minLen and reversed flags.
      var max = g.nodes().filter(function(u) { return u !== 1 && u !== 4; })[0];
      assert.lengthOf(g.outEdges(max), 0, "there should be no out-edges from the max node");

      assert.lengthOf(g.outEdges(1, max), 1);
      var eMax1 = g.outEdges(1, max);
      assert.propertyVal(g.edge(eMax1), "minLen", 2);
      assert.notProperty(g.edge(eMax1), "reversed");

      assert.lengthOf(g.outEdges(4, max), 1);
      var eMax4 = g.outEdges(4, max);
      assert.propertyVal(g.edge(eMax4), "minLen", 4);
      assert.propertyVal(g.edge(eMax4), "reversed", true);
    });

    it("collapses nodes with prefRank=same_x", function() {
      g.addNode(1, {});
      g.addNode(2, { prefRank: "same_x" });
      g.addNode(3, { prefRank: "same_x"});
      g.addNode(4, {});
      g.addEdge("A", 1, 2, { minLen: 2 });
      g.addEdge("B", 3, 4, { minLen: 4 });

      constraints.apply(g);
      assert.lengthOf(g.nodes(), 3);
      assert.includeMembers(g.nodes(), [1, 4]);

      var x = g.nodes().filter(function(u) { return u !== 1 && u !== 4; })[0];

      assert.lengthOf(g.outEdges(1, x), 1);
      var eSame1 = g.outEdges(1, x);
      assert.propertyVal(g.edge(eSame1), "minLen", 2);

      assert.lengthOf(g.outEdges(x, 4), 1);
      var eSame4 = g.outEdges(x, 4);
      assert.propertyVal(g.edge(eSame4), "minLen", 4);
    });

    it("does not apply rank constraints that are not min, max, same_*", function() {
      g.addNode(1, {});
      g.addNode(2, { prefRank: "foo" });
      g.addNode(3, { prefRank: "foo"});
      g.addNode(4, {});
      g.addEdge("A", 1, 2, { minLen: 2 });
      g.addEdge("B", 3, 4, { minLen: 4 });

      // Disable console.error since we"re intentionally triggering it
      var oldError = console.error;
      var errors = [];
      try {
        console.error = function(x) { errors.push(x); };
        constraints.apply(g);
        assert.sameMembers(g.nodes(), [1, 2, 3, 4]);
        assert.isTrue(errors.length >= 1);
        assert.equal(errors[0], "Unsupported rank type: foo");
      } finally {
        console.error = oldError;
      }
    });

    it("applies rank constraints to each subgraph separately", function() {
      g.addNode("sg1", {});
      g.addNode("sg2", {});

      g.parent(g.addNode(1, {}), "sg1");
      g.parent(g.addNode(2, { prefRank: "min" }), "sg1");
      g.parent(g.addNode(3, { prefRank: "min"}), "sg1");
      g.addEdge("A", 1, 2, { minLen: 1 });

      g.parent(g.addNode(4, {}), "sg2");
      g.parent(g.addNode(5, { prefRank: "min" }), "sg2");
      g.parent(g.addNode(6, { prefRank: "min" }), "sg2");
      g.addEdge("B", 4, 5, { minLen: 1 });

      constraints.apply(g);
      assert.lengthOf(g.nodes(), 6); // 2 SGs + 2 nodes / SG
      assert.includeMembers(g.nodes(), [1, 4]);

      // Collapsed min node should be different for sg1 and sg2
      assert.lengthOf(g.children("sg1"), 2);
      assert.lengthOf(g.children("sg2"), 2);
    });
  });

  describe("relax", function() {
    it("restores expands collapsed nodes and sets the rank on expanded nodes", function() {
      g.addNode(1, {});
      g.addNode(2, { prefRank: "same_x" });
      g.addNode(3, { prefRank: "same_x"});
      g.addNode(4, {});
      g.addEdge("A", 1, 2, { minLen: 2 });
      g.addEdge("B", 3, 4, { minLen: 4 });

      constraints.apply(g);

      var x = g.nodes().filter(function(u) { return u !== 1 && u !== 4; })[0];
      g.node(1).rank = 0;
      g.node(x).rank = 2;
      g.node(4).rank = 6;

      constraints.relax(g);

      assert.sameMembers(g.nodes(), [1, 2, 3, 4]);
      assert.propertyVal(g.node(1), "rank", 0);
      assert.propertyVal(g.node(2), "rank", 2);
      assert.propertyVal(g.node(3), "rank", 2);
      assert.propertyVal(g.node(4), "rank", 6);
      assert.sameMembers(g.edges(), ["A", "B"]);
      assert.equal(g.target("A"), 2);
      assert.equal(g.source("B"), 3);
    });

    it("correctly restores edge endpoints for edges pointing at two collapsed nodes", function() {
      g.addNode(1, { prefRank: "min" });
      g.addNode(2, { prefRank: "max" });
      g.addEdge("A", 1, 2, { minLen: 1 });
      g.addEdge("B", 2, 1, { minLen: 1 });

      constraints.apply(g);

      assert.lengthOf(g.nodes(), 2);
      g.node(g.nodes()[0]).rank = 0;
      g.node(g.nodes()[1]).rank = 1;

      constraints.relax(g);

      assert.sameMembers(g.edges(), ["A", "B"]);
      assert.equal(g.source("A"), 1);
      assert.equal(g.target("A"), 2);
      assert.equal(g.source("B"), 2);
      assert.equal(g.target("B"), 1);
    });

    it ("restores expanded nodes to their original subgraph", function() {
      g.addNode("sg1", {});
      g.addNode("sg2", {});

      g.parent(g.addNode(1, {}), "sg1");
      g.parent(g.addNode(2, { prefRank: "min" }), "sg1");
      g.parent(g.addNode(3, { prefRank: "min"}), "sg1");
      g.addEdge("A", 1, 2, { minLen: 1 });

      g.parent(g.addNode(4, {}), "sg2");
      g.parent(g.addNode(5, { prefRank: "min" }), "sg2");
      g.parent(g.addNode(6, { prefRank: "min" }), "sg2");
      g.addEdge("B", 4, 5, { minLen: 1 });

      constraints.apply(g);

      g.node(1).rank = 0;
      g.node(g.children("sg1").filter(function(u) { return u !== 1; })[0]).rank = 2;
      g.node(4).rank = 0;
      g.node(g.children("sg2").filter(function(u) { return u !== 4; })[0]).rank = 2;

      constraints.relax(g);

      assert.sameMembers(g.children("sg1"), [1, 2, 3]);
      assert.sameMembers(g.children("sg2"), [4, 5, 6]);
    });
  });
});
