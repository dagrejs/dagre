var expect = require("./chai").expect,
    addBorderSegments = require("../lib/add-border-segments"),
    Graph = require("graphlib").Graph;

describe("addBorderSegments", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true });
  });

  it("does not add border nodes for a non-compound graph", function() {
    var g = new Graph();
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).to.equal(1);
    expect(g.getNode("a")).to.eql({ rank: 0 });
  });

  it("does not add border nodes for a graph with no clusters", function() {
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).to.equal(1);
    expect(g.getNode("a")).to.eql({ rank: 0 });
  });

  it("adds a border for a single-rank subgraph", function() {
    g.setNode("sg", { minRank: 1, maxRank: 1 });
    addBorderSegments(g);

    var bl = g.getNode("sg").borderLeft[1],
        br = g.getNode("sg").borderRight[1];
    expect(g.getNode(bl)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(bl)).equals("sg");
    expect(g.getNode(br)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(br)).equals("sg");
  });

  it("adds a border for a multi-rank subgraph", function() {
    g.setNode("sg", { minRank: 1, maxRank: 2 });
    addBorderSegments(g);

    var sgNode = g.getNode("sg");
    var bl2 = sgNode.borderLeft[1],
        br2 = sgNode.borderRight[1];
    expect(g.getNode(bl2)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(bl2)).equals("sg");
    expect(g.getNode(br2)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(br2)).equals("sg");

    var bl1 = sgNode.borderLeft[2],
        br1 = sgNode.borderRight[2];
    expect(g.getNode(bl1)).eqls({ dummy: "border", rank: 2, width: 0, height: 0 });
    expect(g.getParent(bl1)).equals("sg");
    expect(g.getNode(br1)).eqls({ dummy: "border", rank: 2, width: 0, height: 0 });
    expect(g.getParent(br1)).equals("sg");

    expect(g.hasEdge(sgNode.borderLeft[1], sgNode.borderLeft[2])).to.be.true;
    expect(g.hasEdge(sgNode.borderRight[1], sgNode.borderRight[2])).to.be.true;
  });

  it("adds borders for nested subgraphs", function() {
    g.setNode("sg1", { minRank: 1, maxRank: 1 });
    g.setNode("sg2", { minRank: 1, maxRank: 1 });
    g.setParent("sg2", "sg1");
    addBorderSegments(g);

    var bl1 = g.getNode("sg1").borderLeft[1],
        br1 = g.getNode("sg1").borderRight[1];
    expect(g.getNode(bl1)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(bl1)).equals("sg1");
    expect(g.getNode(br1)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(br1)).equals("sg1");

    var bl2 = g.getNode("sg2").borderLeft[1],
        br2 = g.getNode("sg2").borderRight[1];
    expect(g.getNode(bl2)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(bl2)).equals("sg2");
    expect(g.getNode(br2)).eqls({ dummy: "border", rank: 1, width: 0, height: 0 });
    expect(g.getParent(br2)).equals("sg2");
  });
});
