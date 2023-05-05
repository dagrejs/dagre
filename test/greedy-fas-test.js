var expect = require("./chai").expect;
var Graph = require("@dagrejs/graphlib").Graph;
var findCycles = require("@dagrejs/graphlib").alg.findCycles;
var greedyFAS = require("../lib/greedy-fas");

describe("greedyFAS", function() {
  var g;

  beforeEach(function() {
    g = new Graph();
  });

  it("returns the empty set for empty graphs", function() {
    expect(greedyFAS(g)).to.eql([]);
  });

  it("returns the empty set for single-node graphs", function() {
    g.setNode("a");
    expect(greedyFAS(g)).to.eql([]);
  });

  it("returns an empty set if the input graph is acyclic", function() {
    var g = new Graph();
    g.setEdge("a", "b");
    g.setEdge("b", "c");
    g.setEdge("b", "d");
    g.setEdge("a", "e");
    expect(greedyFAS(g)).to.eql([]);
  });

  it("returns a single edge with a simple cycle", function() {
    var g = new Graph();
    g.setEdge("a", "b");
    g.setEdge("b", "a");
    checkFAS(g, greedyFAS(g));
  });

  it("returns a single edge in a 4-node cycle", function() {
    var g = new Graph();
    g.setEdge("n1", "n2");
    g.setPath(["n2", "n3", "n4", "n5", "n2"]);
    g.setEdge("n3", "n5");
    g.setEdge("n4", "n2");
    g.setEdge("n4", "n6");
    checkFAS(g, greedyFAS(g));
  });

  it("returns two edges for two 4-node cycles", function() {
    var g = new Graph();
    g.setEdge("n1", "n2");
    g.setPath(["n2", "n3", "n4", "n5", "n2"]);
    g.setEdge("n3", "n5");
    g.setEdge("n4", "n2");
    g.setEdge("n4", "n6");
    g.setPath(["n6", "n7", "n8", "n9", "n6"]);
    g.setEdge("n7", "n9");
    g.setEdge("n8", "n6");
    g.setEdge("n8", "n10");
    checkFAS(g, greedyFAS(g));
  });

  it("works with arbitrarily weighted edges", function() {
    // Our algorithm should also work for graphs with multi-edges, a graph
    // where more than one edge can be pointing in the same direction between
    // the same pair of incident nodes. We try this by assigning weights to
    // our edges representing the number of edges from one node to the other.

    var g1 = new Graph();
    g1.setEdge("n1", "n2", 2);
    g1.setEdge("n2", "n1", 1);
    expect(greedyFAS(g1, weightFn(g1))).to.eql([{v: "n2", w: "n1"}]);

    var g2 = new Graph();
    g2.setEdge("n1", "n2", 1);
    g2.setEdge("n2", "n1", 2);
    expect(greedyFAS(g2, weightFn(g2))).to.eql([{v: "n1", w: "n2"}]);
  });

  it("works for multigraphs", function() {
    var g = new Graph({ multigraph: true });
    g.setEdge("a", "b", 5, "foo");
    g.setEdge("b", "a", 2, "bar");
    g.setEdge("b", "a", 2, "baz");
    expect(greedyFAS(g, weightFn(g)).sort((a, b) => a.name.localeCompare(b.name))).to.eql([
      { v: "b", w: "a", name: "bar" },
      { v: "b", w: "a", name: "baz" }
    ]);
  });
});

function checkFAS(g, fas) {
  var n = g.nodeCount();
  var m = g.edgeCount();
  fas.forEach(function(edge) {
    g.removeEdge(edge.v, edge.w);
  });
  expect(findCycles(g)).to.eql([]);
  // The more direct m/2 - n/6 fails for the simple cycle A <-> B, where one
  // edge must be reversed, but the performance bound implies that only 2/3rds
  // of an edge can be reversed. I'm using floors to acount for this.
  expect(fas.length).to.be.lte(Math.floor(m/2) - Math.floor(n/6));
}

function weightFn(g) {
  return function(e) {
    return g.edge(e);
  };
}
