require("../common");

describe("dagre.layout", function() {
  it("preserves edge ids for graphs with edges spanning multiple ranks", function() {
    var g = dagre.graph();
    g.addNode(1);
    g.addNode(2);
    g.addNode(3);
    g.addEdge("1->2", 1, 2);
    g.addEdge("2->3", 2, 3);
    g.addEdge("1->3", 1, 3);
    dagre.layout.apply(g);
    assert.include(g.edges(), "1->3");
  });

  it("preforms simple layout without error", function() {
    var nodes = [{width: 10, height: 10}, {width: 10, height: 10}];
    var edges = [{source: nodes[0], target: nodes[1]}];

    dagre.layout()
      .nodes(nodes)
      .edges(edges)
      .run();
    
    // Simple check. nodes[0] should be above nodes[1].
    var n0y = nodes[0].dagre.y;
    var n1y = nodes[1].dagre.y;
    assert.isTrue(n0y < n1y, "nodes[0] (" + n0y + ") should be above nodes[1] (" + n1y + ")");
  });
});
