var _ = require("lodash"),
    expect = require("./chai").expect,
    addBorderSegments = require("../lib/add-border-segments"),
    getPostorderNumbers = addBorderSegments.getPostorderNumbers,
    findLCA = addBorderSegments.findLCA,
    Graph = require("graphlib").Graph;

describe("addBorderSegments", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true });
  });

  it("does not add border nodes for a non-compound graph", function() {
    var g = new Graph();
    g.setNode("a", { rank: 0, order: 0 });
    addBorderSegments.run(g);
    expect(g.nodeCount()).to.equal(1);
    expect(g.getNode("a")).to.eql({ rank: 0, order: 0 });
  });

  it("does not add border nodes for a graph with no clusters", function() {
    g.setNode("a", { rank: 0, order: 0 });
    addBorderSegments.run(g);
    expect(g.nodeCount()).to.equal(1);
    expect(g.getNode("a")).to.eql({ rank: 0, order: 0 });
  });

  it("adds a border around a single node cluster", function() {
    g.setNode("a", { rank: 0, order: 0 });
    g.setNode("sg", {});
    g.setParent("a", "sg");
    addBorderSegments.run(g);

    var borderLeft = g.getNode("sg").borderLeft,
        borderRight = g.getNode("sg").borderRight;
    expect(borderLeft).to.exist;
    expect(borderRight).to.exist;

    expect(g.getNode(borderLeft).dummy).equals("border");
    expect(g.getNode(borderRight).dummy).equals("border");
    expect(_.pick(g.getNode(borderLeft), ["width", "height"]))
      .eqls({ width: 0, height: 0 });
    expect(_.pick(g.getNode(borderRight), ["width", "height"]))
      .eqls({ width: 0, height: 0 });

    expect(_.pick(g.getNode(borderLeft), ["rank", "order"]))
      .eqls({ rank: 0, order: 0 });
    expect(g.getNode("a").order).equals(1);
    expect(_.pick(g.getNode(borderRight), ["rank", "order"]))
      .eqls({ rank: 0, order: 2 });
  });

  it("adds a border around a two node cluster", function() {
    g.setNode("a", { rank: 0, order: 0 });
    g.setNode("b", { rank: 0, order: 1 });
    g.setNode("sg", {});
    g.setParent("a", "sg");
    g.setParent("b", "sg");
    addBorderSegments.run(g);

    var borderLeft = g.getNode("sg").borderLeft,
        borderRight = g.getNode("sg").borderRight;
    expect(_.pick(g.getNode(borderLeft), ["rank", "order"]))
      .eqls({ rank: 0, order: 0 });
    expect(g.getNode("a").order).equals(1);
    expect(g.getNode("b").order).equals(2);
    expect(_.pick(g.getNode(borderRight), ["rank", "order"]))
      .eqls({ rank: 0, order: 3 });
  });

  it("adds a border around a one node cluster with surrounding nodes", function() {
    g.setNode("a", { rank: 0, order: 0 });
    g.setNode("b", { rank: 0, order: 1 });
    g.setNode("c", { rank: 0, order: 2 });
    g.setNode("sg", {});
    g.setParent("b", "sg");
    addBorderSegments.run(g);

    var borderLeft = g.getNode("sg").borderLeft,
        borderRight = g.getNode("sg").borderRight;

    expect(g.getNode("a").order).equals(0);
    expect(_.pick(g.getNode(borderLeft), ["rank", "order"]))
      .eqls({ rank: 0, order: 1 });
    expect(g.getNode("b").order).equals(2);
    expect(_.pick(g.getNode(borderRight), ["rank", "order"]))
      .eqls({ rank: 0, order: 3 });
    expect(g.getNode("c").order).equals(4);
  });

  it("adds a border around two adjacent clusters", function() {
    g.setNode("sga-top", { rank: 0, order: 0 });
    g.setNode("sgb-top", { rank: 0, order: 1 });
    g.setNode("a", { rank: 1, order: 0 });
    g.setNode("b", { rank: 1, order: 1 });
    g.setNode("sga-bottom", { rank: 2, order: 0 });
    g.setNode("sgb-bottom", { rank: 2, order: 1 });
    g.setNode("sga", { borderTop: "sga-top", borderBottom: "sga-bottom" });
    g.setNode("sgb", { borderTop: "sgb-top", borderBottom: "sgb-bottom" });
    g.setParent("a", "sga");
    g.setParent("b", "sgb");
    addBorderSegments.run(g);

    var borderLeftA = g.getNode("sga").borderLeft,
        borderRightA = g.getNode("sga").borderRight,
        borderLeftB = g.getNode("sgb").borderLeft,
        borderRightB = g.getNode("sgb").borderRight;

    expect(_.pick(g.getNode(borderLeftA), ["rank", "order"]))
      .eqls({ rank: 1, order: 0 });
    expect(g.getNode("a").order).equals(1);
    expect(_.pick(g.getNode(borderRightA), ["rank", "order"]))
      .eqls({ rank: 1, order: 2 });
    expect(_.pick(g.getNode(borderLeftB), ["rank", "order"]))
      .eqls({ rank: 1, order: 3 });
    expect(g.getNode("b").order).equals(4);
    expect(_.pick(g.getNode(borderRightB), ["rank", "order"]))
      .eqls({ rank: 1, order: 5 });
  });

  it("adds a border around a nested cluster", function() {
    g.setNode("sg1-top", { rank: 0, order: 0 });
    g.setNode("sg2-top", { rank: 1, order: 0 });
    g.setNode("a", { rank: 2, order: 0 });
    g.setNode("b", { rank: 2, order: 1 });
    g.setNode("sg2-bottom", { rank: 3, order: 0 });
    g.setNode("sg1-bottom", { rank: 4, order: 0 });
    g.setNode("sg1", { borderTop: "sg1-top", borderBottom: "sg1-bottom" });
    g.setNode("sg2", { borderTop: "sg2-top", borderBottom: "sg2-bottom" });
    g.setParent("b", "sg1");
    g.setParent("sg2", "sg1");
    g.setParent("a", "sg2");
    addBorderSegments.run(g);

    var borderLeft1 = g.getNode("sg1").borderLeft,
        borderRight1 = g.getNode("sg1").borderRight,
        borderLeft2 = g.getNode("sg2").borderLeft,
        borderRight2 = g.getNode("sg2").borderRight;

    expect(_.pick(g.getNode(borderLeft1), ["rank", "order"]))
      .eqls({ rank: 2, order: 0 });
    expect(_.pick(g.getNode(borderLeft2), ["rank", "order"]))
      .eqls({ rank: 2, order: 1 });
    expect(g.getNode("a").order).equals(2);
    expect(_.pick(g.getNode(borderRight2), ["rank", "order"]))
      .eqls({ rank: 2, order: 3 });
    expect(g.getNode("b").order).equals(4);
    expect(_.pick(g.getNode(borderRight1), ["rank", "order"]))
      .eqls({ rank: 2, order: 5 });
  });

  it("adds a border around a multi-rank cluster", function() {
    g.setNode("sg-top", { rank: 0, order: 0 });
    g.setNode("a", { rank: 1, order: 0 });
    g.setNode("b", { rank: 2, order: 0 });
    g.setNode("sg-bottom", { rank: 3, order: 0 });
    g.setNode("sg", { borderTop: "sg-top", borderBottom: "sg-bottom" });
    g.setParent("a", "sg");
    g.setParent("b", "sg");
    addBorderSegments.run(g);

    // Start from the second rank
    var borderLeft = g.getNode("sg").borderLeft,
        borderRight = g.getNode("sg").borderRight;
    expect(_.pick(g.getNode(borderLeft), ["rank", "order"]))
      .eqls({ rank: 2, order: 0 });
    expect(g.getNode("b").order).equals(1);
    expect(_.pick(g.getNode(borderRight), ["rank", "order"]))
      .eqls({ rank: 2, order: 2 });

    // Move to first rank
    expect(g.predecessors(borderLeft)).to.have.length(1);
    expect(g.predecessors(borderRight)).to.have.length(1);

    expect(_.pick(g.getNode(g.predecessors(borderLeft)[0]), ["rank", "order"]))
      .eqls({ rank: 1, order: 0 });
    expect(g.getNode("a").order).equals(1);
    expect(_.pick(g.getNode(g.predecessors(borderRight)[0]), ["rank", "order"]))
      .eqls({ rank: 1, order: 2 });
  });
});

describe("addBorderSegments.findLCA", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true });
  });

  it("finds the lowest common ancestor of two nodes", function() {
    g.setParent(1, "a");
    g.setParent(2, "a");
    g.setParent("a", "b");
    g.setParent(3, "b");
    g.setParent(4, "c");
    g.setParent("c", "b");
    g.setParent(5, "d");
    g.setParent(6, "e");
    g.setParent(7, "e");
    g.setParent("e", "d");

    var postorder = getPostorderNumbers(g);

    expect(findLCA(g, 1, 1, postorder)).equals(1);
    expect(findLCA(g, 1, 7, postorder)).to.be.undefined;
    expect(findLCA(g, 1, 2, postorder)).equals("a");
    expect(findLCA(g, 1, 3, postorder)).equals("b");
    expect(findLCA(g, 2, 4, postorder)).equals("b");
    expect(findLCA(g, 5, 7, postorder)).equals("d");
    expect(findLCA(g, 1, undefined, postorder)).to.be.undefined;
    expect(findLCA(g, undefined, 1, postorder)).to.be.undefined;
  });
});

describe("addBorderSegments.getPostorderNumbers", function() {
  var g;

  beforeEach(function() {
    g = new Graph({ compound: true });
  });

  it("assigns 0 to a single node", function() {
    g.setNode("a");
    var postorder = getPostorderNumbers(g);
    expect(postorder.a).eqls({ low: 0, lim: 0 });
  });

  it("assigns the same low and lim value to leaf nodes", function() {
    g.setNode("a");
    g.setNode("b");
    g.setNode("c");

    var postorder = getPostorderNumbers(g);
    expect(postorder.a.low).equals(postorder.a.lim);
    expect(postorder.b.low).equals(postorder.b.lim);
    expect(postorder.c.low).equals(postorder.c.lim);
    expect(_.sortBy(_.pluck(postorder, "low"))).eqls([0, 1, 2]);
    expect(_.sortBy(_.pluck(postorder, "lim"))).eqls([0, 1, 2]);
  });

  it("ensures low === parent's low and lim < parent's lim", function() {
    g.setNode("a");
    g.setNode("b");
    g.setNode("c");
    g.setNode("d");
    g.setParent("b", "a");
    g.setParent("c", "b");
    g.setParent("d", "b");

    var postorder = getPostorderNumbers(g);
    expect(postorder.a).eqls({ low: 0, lim: 3 });
    expect(postorder.b).eqls({ low: 0, lim: 2 });
    expect(postorder.c.lim).gte(0).lt(2);
    expect(postorder.d.lim).gte(0).lt(2);
    expect(postorder.c.lim).not.equals(postorder.d.lim);
  });
});
