var expect = require("../chai").expect,
    Digraph = require("graphlib").Digraph,
    normalize = require("../../lib/rank/normalize");

describe("normalize", function() {
  it("adjust ranks such that all are >= 0, and at least one is 0", function() {
    var g = new Digraph()
      .setNode("n1", { rank: 3 })
      .setNode("n2", { rank: 2 })
      .setNode("n3", { rank: 4 });

    normalize(g);

    expect(g.getNode("n1").rank).to.equal(1);
    expect(g.getNode("n2").rank).to.equal(0);
    expect(g.getNode("n3").rank).to.equal(2);
  });

  it("works for negative ranks", function() {
    var g = new Digraph()
      .setNode("n1", { rank: -3 })
      .setNode("n2", { rank: -2 });

    normalize(g);

    expect(g.getNode("n1").rank).to.equal(0);
    expect(g.getNode("n2").rank).to.equal(1);
  });
});
