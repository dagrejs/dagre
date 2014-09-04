var _ = require("lodash"),
    expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    Digraph = require("graphlib").Digraph,
    networkSimplex = require("../../lib/rank/network-simplex"),
    assignLowLim = networkSimplex.assignLowLim,
    calcCutValue = networkSimplex.calcCutValue,
    leaveEdge = networkSimplex.leaveEdge,
    enterEdge = networkSimplex.enterEdge,
    exchange = networkSimplex.exchange;

describe("network", function() {
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
      var g = new Digraph()
                .setNode("a", { rank: 0 })
                .setNode("b", { rank: 2 })
                .setNode("c", { rank: 3 })
                .setDefaultEdgeLabel(function() { return { minlen: 1 }; })
                .setPath(["a", "b", "c"])
                .setEdge("a", "c"),
          t = new Graph()
                .setDefaultNodeLabel(function() { return {}; })
                .setPath(["b", "c", "a"]);
      assignLowLim(t, "c");

      var f = enterEdge(t, g, { v: "b", w: "c" });
      expect(f).to.eql({ v: "a", w: "b", label: { minlen: 1 } });
    });

    it("works when the root of the tree is in the tail component", function() {
      var g = new Digraph()
                .setNode("a", { rank: 0 })
                .setNode("b", { rank: 2 })
                .setNode("c", { rank: 3 })
                .setDefaultEdgeLabel(function() { return { minlen: 1 }; })
                .setPath(["a", "b", "c"])
                .setEdge("a", "c"),
          t = new Graph()
                .setDefaultNodeLabel(function() { return {}; })
                .setPath(["b", "c", "a"]);
      assignLowLim(t, "b");

      var f = enterEdge(t, g, { v: "b", w: "c" });
      expect(f).to.eql({ v: "a", w: "b", label: { minlen: 1 } });
    });

    it("finds the edge with the least slack", function() {
      var g = new Digraph()
                .setNode("a", { rank: 0 })
                .setNode("b", { rank: 1 })
                .setNode("c", { rank: 3 })
                .setNode("d", { rank: 4 })
                .setDefaultEdgeLabel(function() { return { minlen: 1 }; })
                .setEdge("a", "d")
                .setPath(["a", "c", "d"])
                .setEdge("b", "c"),
          t = new Graph()
                .setDefaultNodeLabel(function() { return {}; })
                .setPath(["c", "d", "a", "b"]);
      assignLowLim(t, "a");

      var f = enterEdge(t, g, { v: "c", w: "d" });
      expect(f).to.eql({ v: "b", w: "c", label: { minlen: 1 } });
    });
  });

  describe("assignLowLim", function() {
    it("assigns low, lim, and parent for each node in a tree", function() {
      var g = new Graph()
        .updateNodes(["a", "b", "c", "d", "e"], function() { return {}; })
        .setPath(["a", "b", "a", "c", "d", "c", "e"]);

      assignLowLim(g, "a");

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

  describe("exchange", function() {
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
      assignLowLim(t, "h");

      exchange(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });

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
      var g = createGraph()
                .setPath(["c", "p"]),
          t = createTree()
                .setPath(["p", "c"]);
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(1);
    });

    it("works for a 2-node tree with c <- p", function() {
      var g = createGraph()
                .setPath(["p", "c"]),
          t = createTree()
                .setPath(["p", "c"]);
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(1);
    });

    it("works for 3-node tree with gc -> c -> p", function() {
      var g = createGraph()
                .setPath(["gc", "c", "p"]),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("p", "c");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(3);
    });

    it("works for 3-node tree with gc -> c <- p", function() {
      var g = createGraph()
                .setEdge("p", "c")
                .setEdge("gc", "c"),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("p", "c");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-1);
    });

    it("works for 3-node tree with gc <- c -> p", function() {
      var g = createGraph()
                .setEdge("c", "p")
                .setEdge("c", "gc"),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("p", "c");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-1);
    });

    it("works for 3-node tree with gc <- c <- p", function() {
      var g = createGraph()
                .setPath(["p", "c", "gc"]),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("p", "c");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(3);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o -> c", function() {
      var g = createGraph()
                .setEdge("o", "c", { weight: 7 })
                .setPath(["gc", "c", "p", "o"]),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setPath(["c", "p", "o"]);
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-4);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o <- c", function() {
      var g = createGraph()
                .setEdge("c", "o", { weight: 7 })
                .setPath(["gc", "c", "p", "o"]),
          t = createTree()
                .setEdge("gc", "c", { cutvalue: 3 })
                .setPath(["c", "p", "o"]);
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(10);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o -> c", function() {
      var g = createGraph()
                .setEdge("o", "c", { weight: 7 })
                .setPath(["o", "gc", "c", "p"]),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-4);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o <- c", function() {
      var g = createGraph()
                .setEdge("c", "o", { weight: 7 })
                .setPath(["o", "gc", "c", "p"]),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(10);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o -> c", function() {
      var g = createGraph()
                .setEdge("gc", "c")
                .setEdge("p", "c")
                .setEdge("p", "o")
                .setEdge("o", "c", { weight: 7 }),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(6);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o <- c", function() {
      var g = createGraph()
                .setEdge("gc", "c")
                .setEdge("p", "c")
                .setEdge("p", "o")
                .setEdge("c", "o", { weight: 7 }),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-8);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o -> c", function() {
      var g = createGraph()
                .setEdge("o", "c", { weight: 7 })
                .setPath(["o", "gc", "c"])
                .setEdge("p", "c"),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(6);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o <- c", function() {
      var g = createGraph()
                .setEdge("c", "o", { weight: 7 })
                .setPath(["o", "gc", "c"])
                .setEdge("p", "c"),
          t = createTree()
                .setEdge("o", "gc")
                .setEdge("gc", "c", { cutvalue: 3 })
                .setEdge("c", "p");
      assignLowLim(t, "p");

      expect(calcCutValue(t, g, "c")).to.equal(-8);
    });

    describe("gansner graph", function() {
      var g, t;

      beforeEach(function() {
        g = createGraph()
              .setPath(["a", "b", "c", "d", "h"])
              .setPath(["a", "e", "g", "h"])
              .setPath(["a", "f", "g"]);
        t = createTree()
              .setPath(["a", "b", "c", "d", "h", "g", "e"])
              .setEdge("g", "f");
        assignLowLim(t, "h");
      });

      it("works for edge (a, b)", function() {
        expect(calcCutValue(t, g, "a")).to.equal(3);
      });

      it("works for edge (e, g)", function() {
        expect(calcCutValue(t, g, "e")).to.equal(0);
      });

      it("works for edge (g, h)", function() {
        t.setEdge("e", "g", { cutvalue: 0 });
        t.setEdge("f", "g", { cutvalue: 0 });
        expect(calcCutValue(t, g, "g")).to.equal(-1);
      });
    });
  });

  function createGraph() {
    return new Digraph()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  }

  function createTree() {
    return new Graph()
      .setDefaultNodeLabel(function() { return {}; });
  }
});
