let List = require("../../lib/data/list");

describe("data.List", () => {
  let list;

  beforeEach(() => {
    list = new List();
  });

  describe("dequeue", () => {
    it("returns undefined with an empty list", () => {
      expect(list.dequeue()).toBeUndefined();
    });

    it("unlinks and returns the first entry", () => {
      let obj = {};
      list.enqueue(obj);
      expect(list.dequeue()).toBe(obj);
    });

    it("unlinks and returns multiple entries in FIFO order", () => {
      let obj1 = {};
      let obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);

      expect(list.dequeue()).toBe(obj1);
      expect(list.dequeue()).toBe(obj2);
    });

    it("unlinks and relinks an entry if it is re-enqueued", () => {
      let obj1 = {};
      let obj2 = {};
      list.enqueue(obj1);
      list.enqueue(obj2);
      list.enqueue(obj1);

      expect(list.dequeue()).toBe(obj2);
      expect(list.dequeue()).toBe(obj1);
    });

    it("unlinks and relinks an entry if it is enqueued on another list", () => {
      let obj = {};
      let list2 = new List();
      list.enqueue(obj);
      list2.enqueue(obj);

      expect(list.dequeue()).toBeUndefined();
      expect(list2.dequeue()).toBe(obj);
    });

    it("can return a string representation", () => {
      list.enqueue({ entry: 1 });
      list.enqueue({ entry: 2 });

      expect(list.toString()).toBe("[{\"entry\":1}, {\"entry\":2}]");
    });
  });
});
