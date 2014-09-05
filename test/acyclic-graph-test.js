var _ = require("lodash"),
    expect = require("./chai").expect,
    acyclicGraph = require("../lib/acyclic-graph"),
    Digraph = require("graphlib").Digraph,
    findCycles = require("graphlib").alg.findCycles;

describe("acyclicGraph", function() {
  var g;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  describe("makeAcyclic", function() {
    it("does not change an already acyclic graph", function() {
      g.setPath(["a", "b", "d"]);
      g.setPath(["a", "c", "d"]);
      acyclicGraph.makeAcyclic(g);
      var results = _.map(g.edges(), stripLabel);
      expect(_.sortBy(results, ["v", "w"])).to.eql([
        { v: "a", w: "b" },
        { v: "a", w: "c" },
        { v: "b", w: "d" },
        { v: "c", w: "d" }
      ]);
    });

    it("breaks cycles in the input graph", function() {
      g.setPath(["a", "b", "c", "d", "a"]);
      acyclicGraph.makeAcyclic(g);
      expect(findCycles(g)).to.eql([]);
    });

    it("prefers to break cycles at low-weight edges", function() {
      g.setDefaultEdgeLabel(function() { return { weight: 2 }; });
      g.setPath(["a", "b", "c", "d", "a"]);
      g.setEdge("c", "d", { weight: 1 });
      acyclicGraph.makeAcyclic(g);
      expect(findCycles(g)).to.eql([]);
      expect(g.hasEdge("c", "d")).to.be.false;
    });
  });
});

function stripLabel(edge) {
  var c = _.clone(edge);
  delete c.label;
  return c;
}
