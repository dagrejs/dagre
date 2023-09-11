let expect = require("../chai").expect;
let sort = require("../../lib/order/sort");

describe("sort", () => {
  it("sorts nodes by barycenter", () => {
    let input = [
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ];
    expect(sort(input)).eqls({
      vs: ["b", "a"],
      barycenter: (2 * 3 + 1 * 2) / (3 + 2),
      weight: 3 + 2 });
  });

  it("can sort super-nodes", () => {
    let input = [
      { vs: ["a", "c", "d"], i: 0, barycenter: 2, weight: 3 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ];
    expect(sort(input)).eqls({
      vs: ["b", "a", "c", "d"],
      barycenter: (2 * 3 + 1 * 2) / (3 + 2),
      weight: 3 + 2 });
  });

  it("biases to the left by default", () => {
    let input = [
      { vs: ["a"], i: 0, barycenter: 1, weight: 1 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 1 }
    ];
    expect(sort(input)).eqls({
      vs: ["a", "b"],
      barycenter: 1,
      weight: 2 });
  });

  it("biases to the right if biasRight = true", () => {
    let input = [
      { vs: ["a"], i: 0, barycenter: 1, weight: 1 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 1 }
    ];
    expect(sort(input, true)).eqls({
      vs: ["b", "a"],
      barycenter: 1,
      weight: 2 });
  });

  it("can sort nodes without a barycenter", () => {
    let input = [
      { vs: ["a"], i: 0, barycenter: 2, weight: 1 },
      { vs: ["b"], i: 1, barycenter: 6, weight: 1 },
      { vs: ["c"], i: 2 },
      { vs: ["d"], i: 3, barycenter: 3, weight: 1 }
    ];
    expect(sort(input)).eqls({
      vs: ["a", "d", "c", "b"],
      barycenter: (2 + 6 + 3) / 3,
      weight: 3
    });
  });

  it("can handle no barycenters for any nodes", () => {
    let input = [
      { vs: ["a"], i: 0 },
      { vs: ["b"], i: 3 },
      { vs: ["c"], i: 2 },
      { vs: ["d"], i: 1 }
    ];
    expect(sort(input)).eqls({ vs: ["a", "d", "c", "b"] });
  });

  it("can handle a barycenter of 0", () => {
    let input = [
      { vs: ["a"], i: 0, barycenter: 0, weight: 1 },
      { vs: ["b"], i: 3 },
      { vs: ["c"], i: 2 },
      { vs: ["d"], i: 1 }
    ];
    expect(sort(input)).eqls({
      vs: ["a", "d", "c", "b"],
      barycenter: 0,
      weight: 1
    });
  });
});
