require("./common");

describe("dagre.layout", function() {
  it("preserves edge ids for graphs with edges spanning multiple ranks", function() {
    var g = dagre.graph.create();
    g.addNode(1);
    g.addNode(2);
    g.addNode(3);
    g.addEdge("1->2", 1, 2);
    g.addEdge("2->3", 2, 3);
    g.addEdge("1->3", 1, 3);
    dagre.layout(g);
    assert.include(ids(g.edges()), "1->3");
  });
});
