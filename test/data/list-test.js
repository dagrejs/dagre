var expect = require("../chai").expect,
    List = require("../../lib/data/list");

describe("data.List", function() {
  var list;

  beforeEach(function() {
    list = new List();
  });

  describe("dequeue", function() {
    it("returns undefined with an empty list", function() {
      expect(list.dequeue()).to.be.undefined;
    });

    it("unlinks and returns the first entry", function() {
      var obj = {};
      list.enqueue(obj);
      expect(list.dequeue()).to.equal(obj);
    });

    it("unlinks and returns multiple entries in FIFO order", function() {
      var obj1 = {},
          obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);

      expect(list.dequeue()).to.equal(obj1);
      expect(list.dequeue()).to.equal(obj2);
    });

    it("unlinks and relinks an entry if it is re-enqueued", function() {
      var obj1 = {},
          obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);
      list.enqueue(obj1);

      expect(list.dequeue()).to.equal(obj2);
      expect(list.dequeue()).to.equal(obj1);
    });

    it("unlinks and relinks an entry if it is enqueued on another list", function() {
      var obj = {},
          list2 = new List();
      list.enqueue(obj);
      list2.enqueue(obj);

      expect(list.dequeue()).to.be.undefined;
      expect(list2.dequeue()).to.equal(obj);
    });

    it("can return a string representation", function() {
      list.enqueue({ entry: 1 });
      list.enqueue({ entry: 2 });

      expect(list.toString()).to.equal("[{\"entry\":1}, {\"entry\":2}]");
    });
  });
});
