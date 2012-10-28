require("../common");

describe("dagre.layout", function() {
  it("sets order = 0 for a single node", function() {
    var nodeMap = { A: { rank: 0 } };
    var g = makeTestGraph(nodeMap);

    dagre.layout.order().run(g, nodeMap);

    assert.equal(nodeMap["A"].order, 0);
  });

  it("sets order = 0 for 2 connected nodes on different ranks", function() {
    var nodeMap = { A: { rank: 0 },
                    B: { rank: 1 } };
    var edgeMap = { AB: { source: "A", target: "B" } };
    var g = makeTestGraph(nodeMap, edgeMap);

    dagre.layout.order().run(g, nodeMap);

    assert.equal(nodeMap["A"].order, 0);
    assert.equal(nodeMap["B"].order, 0);
  });

  it("sets order = 0 for 2 unconnected nodes on different ranks", function() {
    var nodeMap = { A: { rank: 0 },
                    B: { rank: 1 } };
    var g = makeTestGraph(nodeMap);

    dagre.layout.order().run(g, nodeMap);

    assert.equal(nodeMap["A"].order, 0);
    assert.equal(nodeMap["B"].order, 0);
  });

  it("sets order = 0, 1 for 2 nodes on the same rank", function() {
    var nodeMap = { A: { rank: 0 },
                    B: { rank: 0 } };
    var g = makeTestGraph(nodeMap);

    dagre.layout.order().run(g, nodeMap);

    if (nodeMap["A"].order === 0) {
      assert.equal(nodeMap["B"].order, 1);
    } else {
      assert.equal(nodeMap["A"].order, 1);
      assert.equal(nodeMap["B"].order, 0);
    }
  });

  it("finds minimal crossings", function() {
    var nodeMap = { A: { rank: 0 },
                    B: { rank: 0 },
                    C: { rank: 0 },
                    D: { rank: 1 },
                    E: { rank: 1 } };
    var edgeMap = { AD: { source: "A", target: "D" },
                    BD: { source: "B", target: "D" },
                    BE: { source: "B", target: "E" },
                    CD: { source: "C", target: "D" },
                    CE: { source: "C", target: "E" } };
    var g = makeTestGraph(nodeMap, edgeMap);

    var layering = dagre.layout.order().run(g, nodeMap);

    assert.equal(dagre.layout.order.crossCount(g, layering), 1);
  });
});
