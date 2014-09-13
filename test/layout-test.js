var _ = require("lodash"),
    expect = require("./chai").expect,
    layout = require("..").layout,
    Graph = require("graphlib").Graph;

describe("layout", function() {
  var g;

  beforeEach(function() {
    g = new Graph().setGraph({});
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
    g.setEdge("a", "b", {});
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 }
    });
  });

  it("can layout out a short cycle", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("b", "a", {});
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2}
    });
  });

  it("adds rectangle intersects for edges", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", {});
    layout(g);
    var points = g.getEdge("a", "b").points;
    expect(points).to.have.length(2);
    expect(points[1].x).equals(points[0].x);
    expect(points[1].y).equals(points[0].y + 200);
  });

  it("adds rectangle intersects for edges spanning multiple ranks", function() {
    g.getGraph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { minlen: 2 });
    layout(g);
    var points = g.getEdge("a", "b").points;
    expect(points).to.have.length(3);
    expect(points[1].x).equals(points[0].x);
    expect(points[1].y).equals(points[0].y + 200);
    expect(points[2].x).equals(points[1].x);
    expect(points[2].y).equals(points[1].y + 200);
  });
});

function extractCoordinates(g) {
  var nodes = g.nodes();
  return _.zipObject(nodes, _.map(nodes, function(v) {
    return _.pick(g.getNode(v), ["x", "y"]);
  }));
}
