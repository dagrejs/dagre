var expect = require("../chai").expect,
    Digraph = require("graphlib").Digraph,
    Graph = require("graphlib").Graph,
    assignLowLim = require("../../lib/rank/assign-low-lim"),
    calcCutValue = require("../../lib/rank/calc-cut-value");

// Note: we use p for parent, c for child, gc_x for grandchild nodes, and o for
// other nodes in the tree for these tests.
describe("rank/calcCutValue", function() {
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
