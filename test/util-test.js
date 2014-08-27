var _ = require("lodash"),
    expect = require("./chai").expect,
    util = require("../lib/util");

describe("util", function() {
  describe("time", function() {
    var consoleLog;
    beforeEach(function() { consoleLog = console.log; });
    afterEach(function() {
      console.log = consoleLog;
      util.log.level = 0;
    });

    it("does nothing if the log.level is 0", function() {
      util.log.level = 0;
      var capture = [];
      console.log = function() { capture.push(_.toArray(arguments)[0]); };
      util.time("foo", function() {});
      expect(capture).to.be.empty;
    });

    it("logs timing information if the log.level is > 0", function() {
      util.log.level = 1;
      var capture = [];
      console.log = function() { capture.push(_.toArray(arguments)[0]); };
      util.time("foo", function() {});
      expect(capture.length).to.equal(1);
      expect(capture[0]).to.match(/^foo time: .*ms/);
    });

    it("returns the value from the evaluated function", function() {
      expect(util.time("foo", _.constant("bar"))).to.equal("bar");
    });
  });
});
