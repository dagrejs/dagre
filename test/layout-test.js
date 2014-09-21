var _ = require("lodash"),
    expect = require("./chai").expect,
    layout = require("..").layout,
    Graph = require("graphlib").Graph;

describe("layout", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ multigraph: true, compound: true })
          .setGraph({})
          .setDefaultEdgeLabel(function() { return {}; });
  });

  it("can layout a single node", function() {
    g.setNode("a", { width: 50, height: 100 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2, y: 100 / 2 }
    });
    expect(g.getNode("a").x).to.equal(50 / 2);
    expect(g.getNode("a").y).to.equal(100 / 2);
  });

  it("can layout two nodes on the same rank", function() {
    g.getGraph().nodesep = 200;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2,            y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 }
    });
  });

  it("can layout two nodes connected by an edge", function() {
    g.getGraph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 }
    });
  });

  it("can layout an edge with a label", function() {
    g.getGraph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 }
    });
    expect(_.pick(g.getEdge("a", "b"), ["x", "y"]))
      .eqls({ x: 75 / 2, y: 100  + 150 + 70 / 2 });
  });

  it("can layout a long edge with a label", function() {
    g.getGraph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, minlen: 2 });
    layout(g);
    expect(g.getEdge("a", "b").x).to.equal(75 / 2);
    expect(g.getEdge("a", "b").y)
      .to.be.gt(g.getNode("a").y)
      .to.be.lt(g.getNode("b").y);
  });

  it("can layout out a short cycle", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("b", "a");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2}
    });
    // One arrow should point down, one up
    expect(g.getEdge("a", "b").points[1].y).gt(g.getEdge("a", "b").points[0].y);
    expect(g.getEdge("b", "a").points[0].y).gt(g.getEdge("b", "a").points[1].y);
  });

  it("adds rectangle intersects for edges", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b");
    layout(g);
    var points = g.getEdge("a", "b").points;
    expect(points).to.have.length(3);
    expect(points).eqls([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }      // intersect with top of b
    ]);
  });

  it("adds rectangle intersects for edges spanning multiple ranks", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { minlen: 2 });
    layout(g);
    var points = g.getEdge("a", "b").points;
    expect(points).to.have.length(5);
    expect(points).eqls([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }  // intersect with top of b
    ]);
  });

  it("can layout a graph with subgraphs", function() {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.setNode("a", { width: 50, height: 50 });
    g.setParent("a", "sg1");
    layout(g);
  });

  it("minimizes the height of subgraphs", function() {
    _.each(["a", "b", "c", "d", "x", "y"], function(v) {
      g.setNode(v, { width: 50, height: 50 });
    });
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "x", { weight: 100 });
    g.setEdge("y", "d", { weight: 100 });
    g.setParent("x", "sg");
    g.setParent("y", "sg");

    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    layout(g);
    expect(g.getNode("x").y).to.equal(g.getNode("y").y);
  });

  it("can layout subgraphs with different rankdirs", function() {
    g.setNode("a", { width: 50, height: 50 });
    g.setNode("sg", {});
    g.setParent("a", "sg");

    function check(rankdir) {
      expect(g.getNode("sg").width, "width " + rankdir).gt(50);
      expect(g.getNode("sg").height, "height " + rankdir).gt(50);
      expect(g.getNode("sg").x, "x " + rankdir).gt(50 / 2);
      expect(g.getNode("sg").y, "y " + rankdir).gt(50 / 2);
    }

    _.each(["tb", "bt", "lr", "rl"], function(rankdir) {
      g.getGraph().rankdir = rankdir;
      layout(g);
      check(rankdir);
    });
  });
});

function extractCoordinates(g) {
  var nodes = g.nodes();
  return _.zipObject(nodes, _.map(nodes, function(v) {
    return _.pick(g.getNode(v), ["x", "y"]);
  }));
}
