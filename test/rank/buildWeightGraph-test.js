var assert = require("../chai").assert,
    Digraph = require("graphlib").Digraph,
    buildWeightGraph = require("../../lib/rank/buildWeightGraph");

describe("buildWeightGraph", function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
  });

  it("returns an directed graph", function() {
    g.addNode(1);

    var result = buildWeightGraph(g);
    assert.isTrue(result.isDirected());
  });

  it("returns a singleton graph for a singleton input graph", function() {
    g.addNode(1);

    var result = buildWeightGraph(g);
    assert.sameMembers(result.nodes(), g.nodes());
  });

  it("returns a weight of 1 for a single forward edge", function() {
    g.addNode(1);
    g.addNode(2);
    g.addEdge(null, 1, 2, {});

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).weight, 1);
  });

  it("returns a weight of -1 for a single back edge", function() {
    g.addNode(1);
    g.addNode(2);
    g.addEdge(null, 1, 2, { reversed: true });

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).weight, -1);
  });

  it("returns a weight of n for an n count forward multi-edge", function() {
    g.addNode(1);
    g.addNode(2);

    var n = 3;
    for (var i = 0; i < 3; ++i) {
      g.addEdge(null, 1, 2, {});
    }

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).weight, n);
  });

  it("returns a weight of -n for an n count back multi-edge", function() {
    g.addNode(1);
    g.addNode(2);

    var n = 3;
    for (var i = 0; i < 3; ++i) {
      g.addEdge(null, 1, 2, { reversed: true });
    }

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).weight, -n);
  });

  it("sets the minLen to the max minLen of edges in the original graph", function() {
    g.addNode(1);
    g.addNode(2);
    g.addEdge(null, 1, 2, { minLen: 1 });
    g.addEdge(null, 1, 2, { minLen: 2 });
    g.addEdge(null, 1, 2, { minLen: 5 });

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).minLen, 5);
  });

  it("sets the minLen to a negative value if the edge is reversed", function() {
    g.addNode(1);
    g.addNode(2);
    g.addEdge(null, 1, 2, { minLen: 1, reversed: true });
    g.addEdge(null, 1, 2, { minLen: 3, reversed: true });

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 1);
    assert.equal(result.edge(result.edges()[0]).minLen, -3);
  });

  it("handles multiple edges across nodes", function() {
    g.addNode(1);
    g.addNode(2);
    g.addNode(3);

    g.addEdge(null, 1, 2, { minLen: 2, reversed: true });
    g.addEdge(null, 1, 3, { minLen: 4 });
    g.addEdge(null, 1, 3, { minLen: 6 });

    var result = buildWeightGraph(g);
    assert.lengthOf(result.edges(), 2);

    var e12, e13;
    var firstTarget = result.incidentNodes(result.edges()[0])[1];
    if (firstTarget === 2) {
      e12 = result.edges()[0];
      e13 = result.edges()[1];
    } else {
      e12 = result.edges()[1];
      e13 = result.edges()[0];
    }

    assert.equal(result.edge(e12).weight, -1);
    assert.equal(result.edge(e13).weight, 2);
    assert.equal(result.edge(e12).minLen, -2);
    assert.equal(result.edge(e13).minLen, 6);
  });
});
