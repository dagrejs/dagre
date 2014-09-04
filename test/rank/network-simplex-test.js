var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    Digraph = require("graphlib").Digraph,
    networkSimplex = require("../../lib/rank/network-simplex"),
    longestPath = require("../../lib/rank/longest-path"),
    initLowLimValues = networkSimplex.initLowLimValues,
    initCutValues = networkSimplex.initCutValues,
    calcCutValue = networkSimplex.calcCutValue,
    leaveEdge = networkSimplex.leaveEdge,
    enterEdge = networkSimplex.enterEdge,
    exchangeEdges = networkSimplex.exchangeEdges;

describe("network simplex", function() {
  var g, t, gansnerGraph, gansnerTree;

  beforeEach(function() {
    g = new Digraph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; });

    t = new Graph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; });

    gansnerGraph = new Digraph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);

    gansnerTree = new Graph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; })
      .setPath(["a", "b", "c", "d", "h", "g", "e"])
      .setEdge("g", "f");
  });

  it("can assign a rank to a single node", function() {
    g.setNode("a");
    networkSimplex(g);
    expect(g.getNode("a").rank).to.equal(0);
  });

  it("can assign a rank to a 2-node disconnected graph", function() {
    g.setNode("a");
    g.setNode("b");
    networkSimplex(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(0);
  });

  it("can assign a rank to a 2-node sconnected graph", function() {
    g.setEdge("a", "b");
    networkSimplex(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(1);
  });

  it("can assign ranks for a diamond", function() {
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);
    networkSimplex(g);
    expect(g.getNode("a").rank).to.equal(0);
    expect(g.getNode("b").rank).to.equal(1);
    expect(g.getNode("c").rank).to.equal(1);
    expect(g.getNode("d").rank).to.equal(2);
  });

  it("uses the minlen attribute on the edge", function() {
    g.setPath(["a", "b", "d"]);
    g.setEdge("a", "c");
    g.setEdge("c", "d", { minlen: 2 });
    networkSimplex(g);
    expect(g.getNode("a").rank).to.equal(0);
    // longest path biases towards the lowest rank it can assign. Since the
    // graph has no optimization opportunities we can assume that the longest
    // path ranking is used.
    expect(g.getNode("b").rank).to.equal(2);
    expect(g.getNode("c").rank).to.equal(1);
    expect(g.getNode("d").rank).to.equal(3);
  });

  describe("leaveEdge", function() {
    it("returns undefined if there is no edge with a negative cutvalue", function() {
      var tree = new Graph();
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: 1 });
      expect(leaveEdge(tree)).to.be.undefined;
    });

    it("returns an edge if one is found with a negative cutvalue", function() {
      var tree = new Graph();
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: -1 });
      expect(leaveEdge(tree)).to.eql({ v: "b", w: "c", label: { cutvalue: -1 }});
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
        .updateNodes(["a", "b", "c", "d", "e"], function() { return {}; })
        .setPath(["a", "b", "a", "c", "d", "c", "e"]);

      initLowLimValues(g, "a");

      var a = g.getNode("a"),
          b = g.getNode("b"),
          c = g.getNode("c"),
          d = g.getNode("d"),
          e = g.getNode("e");

      expect(_.sortBy(_.map(g.nodes(), function(node) { return node.label.lim; })))
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
      var g = new Digraph()
              .setDefaultNodeLabel(function() { return {}; })
              .setDefaultEdgeLabel(function() { return { weight: 1 }; })
              .setPath(["a", "b", "c", "d", "h"])
              .setPath(["a", "e", "g", "h"])
              .setPath(["a", "f", "g"]),
          t = new Graph()
              .setDefaultNodeLabel(function() { return {}; })
              .setEdge("a", "b", { cutvalue: 3 })
              .setEdge("b", "c", { cutvalue: 3 })
              .setEdge("c", "d", { cutvalue: 3 })
              .setEdge("d", "h", { cutvalue: 3 })
              .setEdge("g", "h", { cutvalue: -1 })
              .setEdge("e", "g", { cutvalue: 0 })
              .setEdge("f", "g", { cutvalue: 0 });
      initLowLimValues(t, "h");

      exchangeEdges(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });

      // check new cut values
      expect(t.getEdge("a", "b").cutvalue).to.equal(2);
      expect(t.getEdge("b", "c").cutvalue).to.equal(2);
      expect(t.getEdge("c", "d").cutvalue).to.equal(2);
      expect(t.getEdge("d", "h").cutvalue).to.equal(2);
      expect(t.getEdge("a", "e").cutvalue).to.equal(1);
      expect(t.getEdge("e", "g").cutvalue).to.equal(1);
      expect(t.getEdge("g", "f").cutvalue).to.equal(0);

      // ensure lim numbers look right
      var lims = _.sortBy(_.map(t.nodes(), function(node) { return node.label.lim; }));
      expect(lims).to.eql(_.range(1, 9));
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
      expect(gansnerTree.getEdge("a", "b").cutvalue).to.equal(3);
      expect(gansnerTree.getEdge("b", "c").cutvalue).to.equal(3);
      expect(gansnerTree.getEdge("c", "d").cutvalue).to.equal(3);
      expect(gansnerTree.getEdge("d", "h").cutvalue).to.equal(3);
      expect(gansnerTree.getEdge("g", "h").cutvalue).to.equal(-1);
      expect(gansnerTree.getEdge("e", "g").cutvalue).to.equal(0);
      expect(gansnerTree.getEdge("f", "g").cutvalue).to.equal(0);
    });

    it("works for updated gansnerGraph", function() {
      gansnerTree.removeEdge("g", "h");
      gansnerTree.setEdge("a", "e");
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);
      expect(gansnerTree.getEdge("a", "b").cutvalue).to.equal(2);
      expect(gansnerTree.getEdge("b", "c").cutvalue).to.equal(2);
      expect(gansnerTree.getEdge("c", "d").cutvalue).to.equal(2);
      expect(gansnerTree.getEdge("d", "h").cutvalue).to.equal(2);
      expect(gansnerTree.getEdge("a", "e").cutvalue).to.equal(1);
      expect(gansnerTree.getEdge("e", "g").cutvalue).to.equal(1);
      expect(gansnerTree.getEdge("f", "g").cutvalue).to.equal(0);
    });
  });
});

function undirectedEdge(e) {
  return e.v < e.w ? { v: e.v, w: e.w } : { v: e.w, w: e.v };
}
