var expect = require("./chai").expect;
var layout = require("..").layout;
var graphlib = require("@dagrejs/graphlib");
var Graph = graphlib.Graph;

describe("layout", () => {
  var g;

  beforeEach(() => {
    g = new Graph({ multigraph: true, compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(() => ({}));
  });

  it("can layout a single node", () => {
    g.setNode("a", { width: 50, height: 100 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2, y: 100 / 2 },
    });
    expect(g.node("a").x).to.equal(50 / 2);
    expect(g.node("a").y).to.equal(100 / 2);
  });

  it("can layout two nodes on the same rank", () => {
    g.graph().nodesep = 200;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });

  it("can layout two nodes connected by an edge", () => {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 },
    });

    // We should not get x, y coordinates if the edge has no label
    expect(g.edge("a", "b")).to.not.have.property("x");
    expect(g.edge("a", "b")).to.not.have.property("y");
  });

  it("can layout an edge with a label", () => {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, labelpos: "c" });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 },
    });
    expect(g.edge("a", "b").x).eqls(75 / 2);
    expect(g.edge("a", "b").y).eqls(100 + 150 + 70 / 2);
  });

  describe("can layout an edge with a long label, with rankdir =", () => {
    ["TB", "BT", "LR", "RL"].forEach((rankdir) => {
      it(rankdir, () => {
        g.graph().nodesep = g.graph().edgesep = 10;
        g.graph().rankdir = rankdir;
        ["a", "b", "c", "d"].forEach((v) => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "c", { width: 2000, height: 10, labelpos: "c" });
        g.setEdge("b", "d", { width: 1, height: 1 });
        layout(g);

        var p1, p2;
        if (rankdir === "TB" || rankdir === "BT") {
          p1 = g.edge("a", "c");
          p2 = g.edge("b", "d");
        } else {
          p1 = g.node("a");
          p2 = g.node("c");
        }

        expect(Math.abs(p1.x - p2.x)).gt(1000);
      });
    });
  });

  describe("can apply an offset, with rankdir =", () => {
    ["TB", "BT", "LR", "RL"].forEach((rankdir) => {
      it(rankdir, () => {
        g.graph().nodesep = g.graph().edgesep = 10;
        g.graph().rankdir = rankdir;
        ["a", "b", "c", "d"].forEach((v) => {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "b", {
          width: 10,
          height: 10,
          labelpos: "l",
          labeloffset: 1000,
        });
        g.setEdge("c", "d", {
          width: 10,
          height: 10,
          labelpos: "r",
          labeloffset: 1000,
        });
        layout(g);

        if (rankdir === "TB" || rankdir === "BT") {
          expect(g.edge("a", "b").x - g.edge("a", "b").points[0].x).equals(
            -1000 - 10 / 2
          );
          expect(g.edge("c", "d").x - g.edge("c", "d").points[0].x).equals(
            1000 + 10 / 2
          );
        } else {
          expect(g.edge("a", "b").y - g.edge("a", "b").points[0].y).equals(
            -1000 - 10 / 2
          );
          expect(g.edge("c", "d").y - g.edge("c", "d").points[0].y).equals(
            1000 + 10 / 2
          );
        }
      });
    });
  });

  it("can layout a long edge with a label", () => {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, minlen: 2, labelpos: "c" });
    layout(g);
    expect(g.edge("a", "b").x).to.equal(75 / 2);
    expect(g.edge("a", "b").y).to.be.gt(g.node("a").y).to.be.lt(g.node("b").y);
  });

  it("can layout out a short cycle", () => {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("b", "a");
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2 },
    });
    // One arrow should point down, one up
    expect(g.edge("a", "b").points[1].y).gt(g.edge("a", "b").points[0].y);
    expect(g.edge("b", "a").points[0].y).gt(g.edge("b", "a").points[1].y);
  });

  it("adds rectangle intersects for edges", () => {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b");
    layout(g);
    var points = g.edge("a", "b").points;
    expect(points).to.have.length(3);
    expect(points).eqls([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }, // intersect with top of b
    ]);
  });

  it("adds rectangle intersects for edges spanning multiple ranks", () => {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { minlen: 2 });
    layout(g);
    var points = g.edge("a", "b").points;
    expect(points).to.have.length(5);
    expect(points).eqls([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }, // intersect with top of b
    ]);
  });

  describe("can layout a self loop", () => {
    ["TB", "BT", "LR", "RL"].forEach((rankdir) => {
      it("in rankdir = " + rankdir, () => {
        g.graph().edgesep = 75;
        g.graph().rankdir = rankdir;
        g.setNode("a", { width: 100, height: 100 });
        g.setEdge("a", "a", { width: 50, height: 50 });
        layout(g);
        var nodeA = g.node("a");
        var points = g.edge("a", "a").points;
        expect(points).to.have.length(7);
        points.forEach((point) => {
          if (rankdir !== "LR" && rankdir !== "RL") {
            expect(point.x).gt(nodeA.x);
            expect(Math.abs(point.y - nodeA.y)).lte(nodeA.height / 2);
          } else {
            expect(point.y).gt(nodeA.y);
            expect(Math.abs(point.x - nodeA.x)).lte(nodeA.width / 2);
          }
        });
      });
    });
  });

  it("can layout a graph with subgraphs", () => {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.setNode("a", { width: 50, height: 50 });
    g.setParent("a", "sg1");
    layout(g);
  });

  it("minimizes the height of subgraphs", () => {
    ["a", "b", "c", "d", "x", "y"].forEach((v) => {
      g.setNode(v, { width: 50, height: 50 });
    });
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "x", { weight: 100 });
    g.setEdge("y", "d", { weight: 100 });
    g.setParent("x", "sg");
    g.setParent("y", "sg");

    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    layout(g);
    expect(g.node("x").y).to.equal(g.node("y").y);
  });

  it("can layout subgraphs with different rankdirs", () => {
    g.setNode("a", { width: 50, height: 50 });
    g.setNode("sg", {});
    g.setParent("a", "sg");

    function check(rankdir) {
      expect(g.node("sg").width, "width " + rankdir).gt(50);
      expect(g.node("sg").height, "height " + rankdir).gt(50);
      expect(g.node("sg").x, "x " + rankdir).gt(50 / 2);
      expect(g.node("sg").y, "y " + rankdir).gt(50 / 2);
    }

    ["tb", "bt", "lr", "rl"].forEach((rankdir) => {
      g.graph().rankdir = rankdir;
      layout(g);
      check(rankdir);
    });
  });

  it("adds dimensions to the graph", () => {
    g.setNode("a", { width: 100, height: 50 });
    layout(g);
    expect(g.graph().width).equals(100);
    expect(g.graph().height).equals(50);
  });

  describe("ensures all coordinates are in the bounding box for the graph", () => {
    ["TB", "BT", "LR", "RL"].forEach((rankdir) => {
      describe(rankdir, () => {
        beforeEach(() => {
          g.graph().rankdir = rankdir;
        });

        it("node", () => {
          g.setNode("a", { width: 100, height: 200 });
          layout(g);
          expect(g.node("a").x).equals(100 / 2);
          expect(g.node("a").y).equals(200 / 2);
        });

        it("edge, labelpos = l", () => {
          g.setNode("a", { width: 100, height: 100 });
          g.setNode("b", { width: 100, height: 100 });
          g.setEdge("a", "b", {
            width: 1000,
            height: 2000,
            labelpos: "l",
            labeloffset: 0,
          });
          layout(g);
          if (rankdir === "TB" || rankdir === "BT") {
            expect(g.edge("a", "b").x).equals(1000 / 2);
          } else {
            expect(g.edge("a", "b").y).equals(2000 / 2);
          }
        });
      });
    });
  });

  it("treats attributes with case-insensitivity", () => {
    g.graph().nodeSep = 200; // note the capital S
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).to.eql({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });

  it.only("can layout...", () => {
    const graphJson = {
      options: { directed: true, multigraph: true, compound: true },
      nodes: [
        {
          v: "6b127a17-4484-4abc-a1e9-b0754586df5a",
          value: { width: 1, height: 1 },
        },
        {
          v: "2647eb87-eeea-4f3c-8ad5-a49eeeee97ed",
          value: { width: 300, height: 300 },
          parent: "6b127a17-4484-4abc-a1e9-b0754586df5a",
        },
        {
          v: "461f4912-39dc-4c9e-942b-69d28c3af301",
          value: { width: 1, height: 1 },
        },
        {
          v: "088ba8b1-08ab-4006-9561-78834eb0568f",
          value: { width: 300, height: 300 },
          parent: "461f4912-39dc-4c9e-942b-69d28c3af301",
        },
        {
          v: "732d1cc6-1e9c-46d0-8daf-7d928920445d",
          value: { width: 1, height: 1 },
        },
        {
          v: "af92a4d0-1e80-4244-aa11-d365abbe9bbd",
          value: { width: 300, height: 300 },
          parent: "732d1cc6-1e9c-46d0-8daf-7d928920445d",
        },
        {
          v: "5b1c4a93-c06f-4f5d-a03b-1bb5e6e29554",
          value: { width: 1, height: 1 },
        },
        {
          v: "6a4d8232-0c68-4bbc-9af2-8e9d7313ae8d",
          value: { width: 300, height: 300 },
          parent: "5b1c4a93-c06f-4f5d-a03b-1bb5e6e29554",
        },
        {
          v: "2df5bdc7-5810-4fa9-b161-009bf1be4310",
          value: { width: 1, height: 1 },
        },
        {
          v: "d236a7c3-148b-4d07-a0c8-b736a3ec9083",
          value: { width: 300, height: 300 },
          parent: "2df5bdc7-5810-4fa9-b161-009bf1be4310",
        },
        {
          v: "6d262a28-3752-4dce-bef2-72ec99afbeae",
          value: { width: 1, height: 1 },
        },
        {
          v: "a5531c1d-5243-496e-91fe-448ed774ff5f",
          value: { width: 300, height: 300 },
          parent: "6d262a28-3752-4dce-bef2-72ec99afbeae",
        },
        {
          v: "763a4465-4e7c-470e-b60c-2ac0674ab44d",
          value: { width: 1, height: 1 },
        },
        {
          v: "93748001-c84b-4182-9ff4-bd930a4de6e0",
          value: { width: 300, height: 300 },
          parent: "763a4465-4e7c-470e-b60c-2ac0674ab44d",
        },
        {
          v: "0b471df4-8c58-43ab-9e29-355be2bdce78",
          value: { width: 300, height: 300 },
          parent: "5b1c4a93-c06f-4f5d-a03b-1bb5e6e29554",
        },
        {
          v: "7bdf40bc-36b0-462b-b560-26230fa03af7",
          value: { width: 300, height: 300 },
          parent: "6d262a28-3752-4dce-bef2-72ec99afbeae",
        },
        {
          v: "dbd8fc71-3e9c-415f-8b63-893c8398849f",
          value: { width: 300, height: 300 },
          parent: "6d262a28-3752-4dce-bef2-72ec99afbeae",
        },
        {
          v: "764159fa-b830-4637-86f0-37ba974cfb2b",
          value: { width: 1, height: 1 },
        },
        {
          v: "8e22a8b7-2900-456a-a0b2-9281f8c1e416",
          value: { width: 300, height: 300 },
          parent: "764159fa-b830-4637-86f0-37ba974cfb2b",
        },
        {
          v: "f0d225f5-3092-49ce-94da-85626f7debd2",
          value: { width: 300, height: 300 },
          parent: "732d1cc6-1e9c-46d0-8daf-7d928920445d",
        },
        {
          v: "6f86b84e-f853-4543-80fe-a6ef576b7981",
          value: { width: 300, height: 300 },
          parent: "763a4465-4e7c-470e-b60c-2ac0674ab44d",
        },
        {
          v: "b09f3217-2e36-44a8-8dcb-a5317983c4fb",
          value: { width: 300, height: 300 },
          parent: "5b1c4a93-c06f-4f5d-a03b-1bb5e6e29554",
        },
        {
          v: "aa8a79e3-b6b4-4352-9828-086307904638",
          value: { width: 300, height: 300 },
          parent: "2df5bdc7-5810-4fa9-b161-009bf1be4310",
        },
      ],
      edges: [
        {
          v: "2647eb87-eeea-4f3c-8ad5-a49eeeee97ed",
          w: "7bdf40bc-36b0-462b-b560-26230fa03af7",
          name: "c1eec7b1-3016-483f-b79b-88edbb551b54",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "dbd8fc71-3e9c-415f-8b63-893c8398849f",
          w: "2647eb87-eeea-4f3c-8ad5-a49eeeee97ed",
          name: "b3202df2-0a7c-4982-ba46-6c33f05f7721",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "6a4d8232-0c68-4bbc-9af2-8e9d7313ae8d",
          w: "0b471df4-8c58-43ab-9e29-355be2bdce78",
          name: "198193b2-3fa6-4831-a760-9e0970ef7a57",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "6f86b84e-f853-4543-80fe-a6ef576b7981",
          w: "93748001-c84b-4182-9ff4-bd930a4de6e0",
          name: "9ba92932-bf92-48aa-8bd1-4df6308f5494",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "b09f3217-2e36-44a8-8dcb-a5317983c4fb",
          w: "6a4d8232-0c68-4bbc-9af2-8e9d7313ae8d",
          name: "88a4530d-3a1c-4aea-a1db-8363869254c3",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "aa8a79e3-b6b4-4352-9828-086307904638",
          w: "d236a7c3-148b-4d07-a0c8-b736a3ec9083",
          name: "1ac811cb-514a-41b5-819b-3720a740da0e",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "f0d225f5-3092-49ce-94da-85626f7debd2",
          w: "a5531c1d-5243-496e-91fe-448ed774ff5f",
          name: "af3957b0-4d00-42bc-8185-e69f393eed04",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
        {
          v: "af92a4d0-1e80-4244-aa11-d365abbe9bbd",
          w: "088ba8b1-08ab-4006-9561-78834eb0568f",
          name: "b3c9693e-abc5-4aed-8ff3-2ba3bf0b7815",
          value: {
            minLen: 1,
            weight: 1,
            labelpos: "c",
            labeloffset: 0,
            width: 0,
            height: 0,
          },
        },
      ],
    };

    const graph = graphlib.json.read(graphJson);
    const label = {
      rankdir: "LR",
      align: "UL",
      nodesep: 150,
      edgesep: 30,
      ranksep: 175,
      ranker: "longest-path",
      marginx: 30,
      marginy: 150,
    };
    graph.setGraph(label);
    layout(graph);
  });
});

function extractCoordinates(g) {
  var nodes = g.nodes();
  return nodes.reduce((acc, v) => {
    const node = g.node(v);
    acc[v] = { x: node.x, y: node.y };
    return acc;
  }, {});
}
