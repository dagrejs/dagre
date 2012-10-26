require("../common");

describe("dagre.layout.rank", function() {
  it("assigns rank 0 to a node in a singleton graph", function() {
    var nodeMap = { A: {} };
    var edgeMap = {};
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.rank(g, nodeMap, edgeMap);

    assert.equal(nodeMap["A"].rank, 0);
  });

  it("assigns successive ranks to succesors", function() {
    var nodeMap = { A: {}, B: {} };
    var edgeMap = { AB: { source: "A", target: "B" } };
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.rank(g, nodeMap, edgeMap);

    assert.equal(nodeMap["A"].rank, 0);
    assert.equal(nodeMap["B"].rank, 1);
  });

  it("assigns the minimum rank that satisfies all in-edges", function() {
    // Note that C has in-edges from A and B, so it should be placed at a rank
    // below both of them.
    var nodeMap = { A: {}, B: {}, C: {} };
    var edgeMap = { AB: { source: "A", target: "B" },
                    BC: { source: "B", target: "C" },
                    AC: { source: "A", target: "C" } };
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.rank(g, nodeMap, edgeMap);

    assert.equal(nodeMap["A"].rank, 0);
    assert.equal(nodeMap["B"].rank, 1);
    assert.equal(nodeMap["C"].rank, 2);
  });

  it("uses an edge's minLen attribute to determine rank", function() {
    var nodeMap = { A: {}, B: {} };
    var edgeMap = { AB: { source: "A", target: "B", minLen: 2 } };
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.rank(g, nodeMap, edgeMap);

    assert.equal(nodeMap["A"].rank, 0);
    assert.equal(nodeMap["B"].rank, 2);
  });

  it("can rank nodes even for graphs with cycles", function() {
    var nodeMap = { A: {}, B: {}, C: {}, D: {} };
    var edgeMap = { AB: { source: "A", target: "B" },
                    BC: { source: "B", target: "C" },
                    CD: { source: "C", target: "D" },
                    DA: { source: "D", target: "A" } };
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.rank(g, nodeMap, edgeMap);

    var rankDelta = 4 - nodeMap["A"].rank;
    
    assert.equal((nodeMap["A"].rank + rankDelta) % 4, 0);
    assert.equal((nodeMap["B"].rank + rankDelta) % 4, 1);
    assert.equal((nodeMap["C"].rank + rankDelta) % 4, 2);
    assert.equal((nodeMap["D"].rank + rankDelta) % 4, 3);
  });
});

