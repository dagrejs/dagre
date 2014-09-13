var _ = require("lodash"),
    expect = require("./chai").expect,
    Graph = require("graphlib").Graph,
    util = require("../lib/util");

describe("util", function() {
  describe("intersectRect", function() {
    function expectIntersects(rect, point) {
      var cross = util.intersectRect(rect, point);
      if (cross.x !== point.x) {
        var m = (cross.y - point.y) / (cross.x - point.x);
        expect(cross.y - rect.y).equals(m * (cross.x - rect.x));
      }
    }

    function expectTouchesBorder(rect, point) {
      var cross = util.intersectRect(rect, point);
      if (Math.abs(rect.x - cross.x) !== rect.width / 2) {
        expect(Math.abs(rect.y - cross.y)).equals(rect.height / 2);
      }
    }

    it("creates a slope that will intersect the rectangle's center", function() {
      var rect = { x: 0, y: 0, width: 1, height: 1 };
      expectIntersects(rect, { x:  2, y:  6 });
      expectIntersects(rect, { x:  2, y: -6 });
      expectIntersects(rect, { x:  6, y:  2 });
      expectIntersects(rect, { x: -6, y:  2 });
      expectIntersects(rect, { x:  5, y:  0 });
      expectIntersects(rect, { x:  0, y:  5 });
    });

    it("touches the border of the rectangle", function() {
      var rect = { x: 0, y: 0, width: 1, height: 1 };
      expectTouchesBorder(rect, { x:  2, y:  6 });
      expectTouchesBorder(rect, { x:  2, y: -6 });
      expectTouchesBorder(rect, { x:  6, y:  2 });
      expectTouchesBorder(rect, { x: -6, y:  2 });
      expectTouchesBorder(rect, { x:  5, y:  0 });
      expectTouchesBorder(rect, { x:  0, y:  5 });
    });

    it("throws an error if the point is at the center of the rectangle", function() {
      var rect = { x: 0, y: 0, width: 1, height: 1 };
      expect(function() { util.intersectRect(rect, { x: 0, y: 0 }); }).to.throw();
    });
  });

  describe("buildLayerMatrix", function() {
    it("creates a matrix based on rank and order of nodes in the graph", function() {
      var g = new Graph();
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setNode("d", { rank: 1, order: 1 });
      g.setNode("e", { rank: 2, order: 0 });

      expect(util.buildLayerMatrix(g)).to.eql([
        ["a", "b"],
        ["c", "d"],
        ["e"]
      ]);
    });
  });

  describe("time", function() {
    var consoleLog;

    beforeEach(function() {
      consoleLog = console.log;
    });

    afterEach(function() {
      console.log = consoleLog;
    });

    it("logs timing information", function() {
      var capture = [];
      console.log = function() { capture.push(_.toArray(arguments)[0]); };
      util.time("foo", function() {});
      expect(capture.length).to.equal(1);
      expect(capture[0]).to.match(/^foo time: .*ms/);
    });

    it("returns the value from the evaluated function", function() {
      console.log = function() {};
      expect(util.time("foo", _.constant("bar"))).to.equal("bar");
    });
  });
});
