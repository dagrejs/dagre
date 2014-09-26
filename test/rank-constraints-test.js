var _ = require("lodash"),
    expect = require("./chai").expect,
    Graph = require("graphlib").Graph,
    rankConstraints = require("../lib/rank-constraints");

describe("rankConstraints", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true, multigraph: true })
          .setDefaultNodeLabel(function() { return {}; });
  });

  describe("collapse", function() {
    it("does nothing for nodes without rank constraints", function() {
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });

      rankConstraints.collapse(g);

      expect(_.sortBy(g.nodes())).to.eql(["a", "b", "c", "d"]);
      expect(g.edge("a", "b")).to.eql({ minlen: 2, weight: 2 });
      expect(g.edge("c", "d")).to.eql({ minlen: 3, weight: 3 });
      expect(g.edgeCount()).to.equal(2);
    });

    it("collapses nodes with rankconstraint=$min", function() {
      g.setNode("b", { rankconstraint: "$min" });
      g.setNode("c", { rankconstraint: "$min" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });

      rankConstraints.collapse(g);

      var nodes = g.nodes();
      expect(nodes).to.include.members(["a", "d"]);
      expect(nodes).to.have.length(3);
      var collapsed = _.find(nodes, function(v) { return v !== "a" && v !== "d"; });
      expect(_.pick(g.edge(collapsed, "a"), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 2, minlen: 2, reversed: true });
      expect(_.pick(g.edge(collapsed, "d"), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 3, minlen: 3 });
      expect(g.edgeCount()).to.equal(2);
    });

    it("collapses nodes with rankconstraint=$max", function() {
      g.setNode("b", { rankconstraint: "$max" });
      g.setNode("c", { rankconstraint: "$max" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });

      rankConstraints.collapse(g);

      var nodes = g.nodes();
      expect(nodes).to.include.members(["a", "d"]);
      expect(nodes).to.have.length(3);
      var collapsed = _.find(nodes, function(v) { return v !== "a" && v !== "d"; });
      expect(_.pick(g.edge("a", collapsed), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 2, minlen: 2 });
      expect(_.pick(g.edge("d", collapsed), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 3, minlen: 3, reversed: true });
      expect(g.edgeCount()).to.equal(2);
    });

    it("collapses nodes with rankconstraint=x", function() {
      g.setNode("b", { rankconstraint: "myrank" });
      g.setNode("c", { rankconstraint: "myrank" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });

      rankConstraints.collapse(g);

      var nodes = g.nodes();
      expect(nodes).to.include.members(["a", "d"]);
      expect(nodes).to.have.length(3);
      var collapsed = _.find(nodes, function(v) { return v !== "a" && v !== "d"; });
      expect(_.pick(g.edge("a", collapsed), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 2, minlen: 2 });
      expect(_.pick(g.edge(collapsed, "d"), ["weight", "minlen", "reversed"]))
        .to.eql({ weight: 3, minlen: 3 });
      expect(g.edgeCount()).to.equal(2);
    });

    it("does not apply rank constraints for unknown $ tokens", function() {
      g.setNode("b", { rankconstraint: "$foo" });
      g.setNode("c", { rankconstraint: "$foo" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });

      rankConstraints.collapse(g);

      expect(_.sortBy(g.nodes())).to.eql(["a", "b", "c", "d"]);
      expect(g.edge("a", "b")).to.eql({ minlen: 2, weight: 2 });
      expect(g.edge("c", "d")).to.eql({ minlen: 3, weight: 3 });
      expect(g.edgeCount()).to.equal(2);
    });

    it("applies to subgraphs separately", function() {
      g.setNode("b", { rankconstraint: "$min" });
      g.setNode("c", { rankconstraint: "$min" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("c", "d", { minlen: 3, weight: 3 });
      _.each(["a", "b"], function(v) { g.setParent(v, "sg1"); });
      _.each(["c", "d"], function(v) { g.setParent(v, "sg2"); });

      rankConstraints.collapse(g);

      // "a" and collapsed node for sg1
      expect(g.children("sg1")).to.have.length(2);

      // "d" and collapsed node for sg2
      expect(g.children("sg2")).to.have.length(2);
    });

    it("collapses multiple in-edges and out-edges", function() {
      g.setNode("b", { rankconstraint: "myrank" });
      g.setNode("c", { rankconstraint: "myrank" });
      g.setEdge("a", "b", { minlen: 2, weight: 2 });
      g.setEdge("a", "c", { minlen: 3, weight: 3 });
      g.setEdge("b", "d", { minlen: 4, weight: 4 });
      g.setEdge("c", "d", { minlen: 5, weight: 5 });

      rankConstraints.collapse(g);

      var nodes = g.nodes();
      expect(nodes).to.include.members(["a", "d"]);
      expect(nodes).to.have.length(3);
      var collapsed = _.find(nodes, function(v) { return v !== "a" && v !== "d"; });
      expect(_.pick(g.edge("a", collapsed), ["weight", "minlen", "reversed"]))
        .to.eql({ minlen: 3, weight: 5 });
      expect(_.pick(g.edge(collapsed, "d"), ["weight", "minlen", "reversed"]))
        .to.eql({ minlen: 5, weight: 9 });
      expect(g.edgeCount()).to.equal(2);
    });
  });
});

