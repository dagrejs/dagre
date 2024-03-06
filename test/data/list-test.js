let expect = require("../chai").expect;
let List = require("../../lib/data/list");

describe("data.List", () => {
  let list;

  beforeEach(() => {
    list = new List();
  });

  describe("dequeue", () => {
    it("returns undefined with an empty list", () => {
      expect(list.dequeue()).to.be.undefined;
    });

    it("unlinks and returns the first entry", () => {
      let obj = {};
      list.enqueue(obj);
      expect(list.dequeue()).to.equal(obj);
    });

    it("unlinks and returns multiple entries in FIFO order", () => {
      let obj1 = {};
      let obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);

      expect(list.dequeue()).to.equal(obj1);
      expect(list.dequeue()).to.equal(obj2);
    });

    it("unlinks and relinks an entry if it is re-enqueued", () => {
      let obj1 = {};
      let obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);
      list.enqueue(obj1);

      expect(list.dequeue()).to.equal(obj2);
      expect(list.dequeue()).to.equal(obj1);
    });

    it("unlinks and relinks an entry if it is enqueued on another list", () => {
      let obj = {};
      let list2 = new List();
      list.enqueue(obj);
      list2.enqueue(obj);

      expect(list.dequeue()).to.be.undefined;
      expect(list2.dequeue()).to.equal(obj);
    });

    it("can return a string representation", () => {
      list.enqueue({ entry: 1 });
      list.enqueue({ entry: 2 });

      expect(list.toString()).to.equal("[{\"entry\":1}, {\"entry\":2}]");
    });
  });
});
