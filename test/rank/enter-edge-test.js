var expect = require("../chai").expect,
    Graph = require("graphlib").Graph,
    Digraph = require("graphlib").Digraph,
    assignLowLim = require("../../lib/rank/low-lim").assign,
    enterEdge = require("../../lib/rank/enter-edge");

describe("rank/leaveEdge", function() {
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
