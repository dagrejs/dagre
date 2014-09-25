var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    Graph = require("graphlib").Graph,
    networkSimplex = require("../../lib/rank/network-simplex"),
    longestPath = require("../../lib/rank/util").longestPath,
    initLowLimValues = networkSimplex.initLowLimValues,
    initCutValues = networkSimplex.initCutValues,
    calcCutValue = networkSimplex.calcCutValue,
    leaveEdge = networkSimplex.leaveEdge,
    enterEdge = networkSimplex.enterEdge,
    exchangeEdges = networkSimplex.exchangeEdges,
    normalizeRanks = require("../../lib/util").normalizeRanks;

describe("network simplex", function() {
  var g, t, gansnerGraph, gansnerTree;

  beforeEach(function() {
    g = new Graph({ multigraph: true })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; });

    t = new Graph({ directed: false })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; });

    gansnerGraph = new Graph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);

    gansnerTree = new Graph({ directed: false })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; })
      .setPath(["a", "b", "c", "d", "h", "g", "e"])
      .setEdge("g", "f");
  });

  it("can assign a rank to a single node", function() {
    g.setNode("a");
    ns(g);
    expect(g.node("a").rank).to.equal(0);
  });

  it("can assign a rank to a 2-node connected graph", function() {
    g.setEdge("a", "b");
    ns(g);
    expect(g.node("a").rank).to.equal(0);
    expect(g.node("b").rank).to.equal(1);
  });

  it("can assign ranks for a diamond", function() {
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);
    ns(g);
    expect(g.node("a").rank).to.equal(0);
    expect(g.node("b").rank).to.equal(1);
    expect(g.node("c").rank).to.equal(1);
    expect(g.node("d").rank).to.equal(2);
  });

  it("uses the minlen attribute on the edge", function() {
    g.setPath(["a", "b", "d"]);
    g.setEdge("a", "c");
    g.setEdge("c", "d", { minlen: 2 });
    ns(g);
    expect(g.node("a").rank).to.equal(0);
    // longest path biases towards the lowest rank it can assign. Since the
    // graph has no optimization opportunities we can assume that the longest
    // path ranking is used.
    expect(g.node("b").rank).to.equal(2);
    expect(g.node("c").rank).to.equal(1);
    expect(g.node("d").rank).to.equal(3);
  });

  it("can rank the gansner graph", function() {
    g = gansnerGraph;
    ns(g);
    expect(g.node("a").rank).to.equal(0);
    expect(g.node("b").rank).to.equal(1);
    expect(g.node("c").rank).to.equal(2);
    expect(g.node("d").rank).to.equal(3);
    expect(g.node("h").rank).to.equal(4);
    expect(g.node("e").rank).to.equal(1);
    expect(g.node("f").rank).to.equal(1);
    expect(g.node("g").rank).to.equal(2);
  });

  it("can handle multi-edges", function() {
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "e", { weight: 2, minlen: 1 });
    g.setEdge("e", "d");
    g.setEdge("b", "c", { weight: 1, minlen: 2 }, "multi");
    ns(g);
    expect(g.node("a").rank).to.equal(0);
    expect(g.node("b").rank).to.equal(1);
    // b -> c has minlen = 1 and minlen = 2, so it should be 2 ranks apart.
    expect(g.node("c").rank).to.equal(3);
    expect(g.node("d").rank).to.equal(4);
    expect(g.node("e").rank).to.equal(1);
  });

  describe("leaveEdge", function() {
    it("returns undefined if there is no edge with a negative cutvalue", function() {
      var tree = new Graph({ directed: false });
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: 1 });
      expect(leaveEdge(tree)).to.be.undefined;
    });

    it("returns an edge if one is found with a negative cutvalue", function() {
      var tree = new Graph({ directed: false });
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: -1 });
      expect(leaveEdge(tree)).to.eql({ v: "b", w: "c" });
    });
  });

  describe("enterEdge", function() {
    it("finds an edge from the head to tail component", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 3 })
        .setPath(["a", "b", "c"])
        .setEdge("a", "c");
      t.setPath(["b", "c", "a"]);
      initLowLimValues(t, "c");

      var f = enterEdge(t, g, { v: "b", w: "c" });
      expect(undirectedEdge(f)).to.eql(undirectedEdge({ v: "a", w: "b" }));
    });

    it("works when the root of the tree is in the tail component", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 3 })
        .setPath(["a", "b", "c"])
        .setEdge("a", "c");
      t.setPath(["b", "c", "a"]);
      initLowLimValues(t, "b");

      var f = enterEdge(t, g, { v: "b", w: "c" });
      expect(undirectedEdge(f)).to.eql(undirectedEdge({ v: "a", w: "b" }));
    });

    it("finds the edge with the least slack", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 1 })
        .setNode("c", { rank: 3 })
        .setNode("d", { rank: 4 })
        .setEdge("a", "d")
        .setPath(["a", "c", "d"])
        .setEdge("b", "c");
      t.setPath(["c", "d", "a", "b"]);
      initLowLimValues(t, "a");

      var f = enterEdge(t, g, { v: "c", w: "d" });
      expect(undirectedEdge(f)).to.eql(undirectedEdge({ v: "b", w: "c" }));
    });

    it("finds an appropriate edge for gansner graph #1", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      var f = enterEdge(t, g, { v: "g", w: "h" });
      expect(undirectedEdge(f).v).to.equal("a");
      expect(["e", "f"]).to.include(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #2", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      var f = enterEdge(t, g, { v: "g", w: "h" });
      expect(undirectedEdge(f).v).to.equal("a");
      expect(["e", "f"]).to.include(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #3", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      var f = enterEdge(t, g, { v: "h", w: "g" });
      expect(undirectedEdge(f).v).to.equal("a");
      expect(["e", "f"]).to.include(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #4", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      var f = enterEdge(t, g, { v: "h", w: "g" });
      expect(undirectedEdge(f).v).to.equal("a");
      expect(["e", "f"]).to.include(undirectedEdge(f).w);
    });
  });

  describe("initLowLimValues", function() {
    it("assigns low, lim, and parent for each node in a tree", function() {
      var g = new Graph()
        .setDefaultNodeLabel(function() { return {}; })
        .setNodes(["a", "b", "c", "d", "e"])
        .setPath(["a", "b", "a", "c", "d", "c", "e"]);

      initLowLimValues(g, "a");

      var a = g.node("a"),
          b = g.node("b"),
          c = g.node("c"),
          d = g.node("d"),
          e = g.node("e");

      expect(_.sortBy(_.map(g.nodes(), function(v) { return g.node(v).lim; })))
        .to.eql(_.range(1, 6));

      expect(a).to.eql({ low: 1, lim: 5 });

      expect(b.parent).to.equal("a");
      expect(b.lim).to.be.lt(a.lim);

      expect(c.parent).to.equal("a");
      expect(c.lim).to.be.lt(a.lim);
      expect(c.lim).to.not.equal(b.lim);

      expect(d.parent).to.equal("c");
      expect(d.lim).to.be.lt(c.lim);

      expect(e.parent).to.equal("c");
      expect(e.lim).to.be.lt(c.lim);
      expect(e.lim).to.not.equal(d.lim);
    });
  });

  describe("exchangeEdges", function() {
    it("exchanges edges and updates cut values and low/lim numbers", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });

      // check new cut values
      expect(t.edge("a", "b").cutvalue).to.equal(2);
      expect(t.edge("b", "c").cutvalue).to.equal(2);
      expect(t.edge("c", "d").cutvalue).to.equal(2);
      expect(t.edge("d", "h").cutvalue).to.equal(2);
      expect(t.edge("a", "e").cutvalue).to.equal(1);
      expect(t.edge("e", "g").cutvalue).to.equal(1);
      expect(t.edge("g", "f").cutvalue).to.equal(0);

      // ensure lim numbers look right
      var lims = _.sortBy(_.map(t.nodes(), function(v) { return t.node(v).lim; }));
      expect(lims).to.eql(_.range(1, 9));
    });

    it("updates ranks", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });
      normalizeRanks(g);

      // check new ranks
      expect(g.node("a").rank).to.equal(0);
      expect(g.node("b").rank).to.equal(1);
      expect(g.node("c").rank).to.equal(2);
      expect(g.node("d").rank).to.equal(3);
      expect(g.node("e").rank).to.equal(1);
      expect(g.node("f").rank).to.equal(1);
      expect(g.node("g").rank).to.equal(2);
      expect(g.node("h").rank).to.equal(4);
    });
  });

  // Note: we use p for parent, c for child, gc_x for grandchild nodes, and o for
  // other nodes in the tree for these tests.
  describe("calcCutValue", function() {
    it("works for a 2-node tree with c -> p", function() {
      g.setPath(["c", "p"]);
      t.setPath(["p", "c"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(1);
    });

    it("works for a 2-node tree with c <- p", function() {
      g.setPath(["p", "c"]);
      t.setPath(["p", "c"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(1);
    });

    it("works for 3-node tree with gc -> c -> p", function() {
      g.setPath(["gc", "c", "p"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(3);
    });

    it("works for 3-node tree with gc -> c <- p", function() {
      g
        .setEdge("p", "c")
        .setEdge("gc", "c");
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-1);
    });

    it("works for 3-node tree with gc <- c -> p", function() {
      g
        .setEdge("c", "p")
        .setEdge("c", "gc");
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-1);
    });

    it("works for 3-node tree with gc <- c <- p", function() {
      g.setPath(["p", "c", "gc"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(3);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["gc", "c", "p", "o"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setPath(["c", "p", "o"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-4);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["gc", "c", "p", "o"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setPath(["c", "p", "o"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(10);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["o", "gc", "c", "p"]);
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-4);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["o", "gc", "c", "p"]);
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(10);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o -> c", function() {
      g
        .setEdge("gc", "c")
        .setEdge("p", "c")
        .setEdge("p", "o")
        .setEdge("o", "c", { weight: 7 });
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(6);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o <- c", function() {
      g
        .setEdge("gc", "c")
        .setEdge("p", "c")
        .setEdge("p", "o")
        .setEdge("c", "o", { weight: 7 });
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-8);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["o", "gc", "c"])
        .setEdge("p", "c");
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(6);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["o", "gc", "c"])
        .setEdge("p", "c");
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-8);
    });
  });

  describe("initCutValues", function() {
    it("works for gansnerGraph", function() {
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);
      expect(gansnerTree.edge("a", "b").cutvalue).to.equal(3);
      expect(gansnerTree.edge("b", "c").cutvalue).to.equal(3);
      expect(gansnerTree.edge("c", "d").cutvalue).to.equal(3);
      expect(gansnerTree.edge("d", "h").cutvalue).to.equal(3);
      expect(gansnerTree.edge("g", "h").cutvalue).to.equal(-1);
      expect(gansnerTree.edge("e", "g").cutvalue).to.equal(0);
      expect(gansnerTree.edge("f", "g").cutvalue).to.equal(0);
    });

    it("works for updated gansnerGraph", function() {
      gansnerTree.removeEdge("g", "h");
      gansnerTree.setEdge("a", "e");
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);
      expect(gansnerTree.edge("a", "b").cutvalue).to.equal(2);
      expect(gansnerTree.edge("b", "c").cutvalue).to.equal(2);
      expect(gansnerTree.edge("c", "d").cutvalue).to.equal(2);
      expect(gansnerTree.edge("d", "h").cutvalue).to.equal(2);
      expect(gansnerTree.edge("a", "e").cutvalue).to.equal(1);
      expect(gansnerTree.edge("e", "g").cutvalue).to.equal(1);
      expect(gansnerTree.edge("f", "g").cutvalue).to.equal(0);
    });
  });
});

function ns(g) {
  networkSimplex(g);
  normalizeRanks(g);
}

function undirectedEdge(e) {
  return e.v < e.w ? { v: e.v, w: e.w } : { v: e.w, w: e.v };
}
