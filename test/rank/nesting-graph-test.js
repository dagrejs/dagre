var expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    components = require("graphlib").alg.components,
    nestingGraph = require("../../lib/rank/nesting-graph");

describe("rank/nestingGraph", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true })
          .setGraph({})
          .setDefaultNodeLabel(function() { return {}; });
  });

  describe("run", function() {
    it("connects a disconnected graph", function() {
      g.setNode("a");
      g.setNode("b");
      expect(components(g)).to.have.length(2);
      nestingGraph.run(g);
      expect(components(g)).to.have.length(1);
      expect(g.hasNode("a"));
      expect(g.hasNode("b"));
    });

    it("adds border nodes to the top and bottom of a subgraph", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      var borderTop = g.getNode("sg1").borderTop,
          borderBottom = g.getNode("sg1").borderBottom;
      expect(borderTop).to.exist;
      expect(borderBottom).to.exist;
      expect(g.getParent(borderTop)).to.equal("sg1");
      expect(g.getParent(borderBottom)).to.equal("sg1");
      expect(g.outEdges(borderTop, "a")).to.have.length(1);
      expect(g.getEdge(g.outEdges(borderTop, "a")[0])).eqls({ weight: 0, minlen: 1});
      expect(g.outEdges("a", borderBottom)).to.have.length(1);
      expect(g.getEdge(g.outEdges("a", borderBottom)[0])).eqls({ weight: 0, minlen: 1});
      expect(g.getNode(borderTop)).eqls({ width: 0, height: 0, dummy: true });
      expect(g.getNode(borderBottom)).eqls({ width: 0, height: 0, dummy: true });
    });

    it("adds edges between borders of nested subgraphs", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      nestingGraph.run(g);

      var sg1Top = g.getNode("sg1").borderTop,
          sg1Bottom = g.getNode("sg1").borderBottom,
          sg2Top = g.getNode("sg2").borderTop,
          sg2Bottom = g.getNode("sg2").borderBottom;
      expect(sg1Top).to.exist;
      expect(sg1Bottom).to.exist;
      expect(sg2Top).to.exist;
      expect(sg2Bottom).to.exist;
      expect(g.outEdges(sg1Top, sg2Top)).to.have.length(1);
      expect(g.getEdge(g.outEdges(sg1Top, sg2Top)[0])).eqls({ weight: 0, minlen: 1});
      expect(g.outEdges(sg2Bottom, sg1Bottom)).to.have.length(1);
      expect(g.getEdge(g.outEdges(sg2Bottom, sg1Bottom)[0]))
        .eqls({ weight: 0, minlen: 1});
    });

    it("adds an edge from the root to the tops of top-level subgraphs", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      var root = g.getGraph().nestingRoot,
          borderTop = g.getNode("sg1").borderTop;
      expect(root).to.exist;
      expect(borderTop).to.exist;
      expect(g.outEdges(root, borderTop)).to.have.length(1);
      expect(g.getEdge(g.outEdges(root, borderTop)[0])).eqls({ weight: 0, minlen: 1 });
    });

    it("adds an edge from root to each node with the correct minlen #1", function() {
      g.setNode("a");
      nestingGraph.run(g);

      var root = g.getGraph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, "a")).to.have.length(1);
      expect(g.getEdge(g.outEdges(root, "a")[0])).eqls({ weight: 0, minlen: 1 });
    });

    it("adds an edge from root to each node with the correct minlen #2", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      var root = g.getGraph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, "a")).to.have.length(1);
      expect(g.getEdge(g.outEdges(root, "a")[0])).eqls({ weight: 0, minlen: 3 });
    });

    it("adds an edge from root to each node with the correct minlen #3", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      nestingGraph.run(g);

      var root = g.getGraph().nestingRoot;
      expect(root).to.exist;
      expect(g.outEdges(root, "a")).to.have.length(1);
      expect(g.getEdge(g.outEdges(root, "a")[0])).eqls({ weight: 0, minlen: 5 });
    });

    it("expands inter-node edges to separate SG border and nodes #1", function() {
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.getEdge("a", "b").minlen).equals(1);
    });

    it("expands inter-node edges to separate SG border and nodes #2", function() {
      g.setParent("a", "sg1");
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.getEdge("a", "b").minlen).equals(3);
    });

    it("expands inter-node edges to separate SG border and nodes #3", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.getEdge("a", "b").minlen).equals(5);
    });
  });
});
