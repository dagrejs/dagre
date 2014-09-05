var expect = require("../chai").expect,
    Digraph = require("graphlib").Digraph,
    normalize = require("../../lib/rank/util").normalize;

describe("rank/util", function() {
  describe("normalize", function() {
    it("adjust ranks such that all are >= 0, and at least one is 0", function() {
      var g = new Digraph()
        .setNode("a", { rank: 3 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 4 });

      normalize(g);

      expect(g.getNode("a").rank).to.equal(1);
      expect(g.getNode("b").rank).to.equal(0);
      expect(g.getNode("c").rank).to.equal(2);
    });

    it("works for negative ranks", function() {
      var g = new Digraph()
        .setNode("a", { rank: -3 })
        .setNode("b", { rank: -2 });

      normalize(g);

      expect(g.getNode("a").rank).to.equal(0);
      expect(g.getNode("b").rank).to.equal(1);
    });
  });
});
