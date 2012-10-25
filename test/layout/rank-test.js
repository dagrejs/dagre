require("../common");

describe("dagre.layout.rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var nodeMap = { A: {} };
    var g = makeTestGraph(nodeMap);

    dagre.layout.rank(g, nodeMap);

    assert.equal(0, nodeMap["A"].rank);
  });

  it("assigns successive ranks to succesors", function() {
    var nodeMap = { A: {}, B: {} };
    var g = makeTestGraph(nodeMap);
    g.addEdge("A->B", "A", "B");

    dagre.layout.rank(g, nodeMap);

    assert.equal(0, nodeMap["A"].rank);
    assert.equal(1, nodeMap["B"].rank);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var nodeMap = { A: {}, B: {}, C: {} };
    var g = makeTestGraph(nodeMap);
    g.addEdge("A->B", "A", "B");
    g.addEdge("B->C", "B", "C");
    g.addEdge("A->C", "A", "C");

    dagre.layout.rank(g, nodeMap);

    assert.equal(0, nodeMap["A"].rank);
    assert.equal(1, nodeMap["B"].rank);
    assert.equal(2, nodeMap["C"].rank);
  });
});

