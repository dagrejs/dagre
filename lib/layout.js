"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = layout;
var acyclic = _interopRequireWildcard(require("./acyclic.js"));
var normalize = _interopRequireWildcard(require("./normalize.js"));
var _index = _interopRequireDefault(require("./rank/index.js"));
var _parentDummyChains = _interopRequireDefault(require("./parent-dummy-chains.js"));
var nestingGraph = _interopRequireWildcard(require("./nesting-graph.js"));
var _addBorderSegments = _interopRequireDefault(require("./add-border-segments.js"));
var coordinateSystem = _interopRequireWildcard(require("./coordinate-system.js"));
var _index2 = _interopRequireDefault(require("./order/index.js"));
var _index3 = _interopRequireDefault(require("./position/index.js"));
var util = _interopRequireWildcard(require("./util.js"));
var _graphlib = require("@dagrejs/graphlib");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const removeEmptyRanks = util.removeEmptyRanks;
const normalizeRanks = util.normalizeRanks;
function layout(g, opts) {
  let time = opts && opts.debugTiming ? util.time : util.notime;
  time("layout", () => {
    let layoutGraph = time("  buildLayoutGraph", () => buildLayoutGraph(g));
    time("  runLayout", () => runLayout(layoutGraph, time));
    time("  updateInputGraph", () => updateInputGraph(g, layoutGraph));
  });
}
function runLayout(g, time) {
  time("    makeSpaceForEdgeLabels", () => makeSpaceForEdgeLabels(g));
  time("    removeSelfEdges", () => removeSelfEdges(g));
  time("    acyclic", () => acyclic.run(g));
  time("    nestingGraph.run", () => nestingGraph.run(g));
  time("    rank", () => (0, _index.default)(util.asNonCompoundGraph(g)));
  time("    injectEdgeLabelProxies", () => injectEdgeLabelProxies(g));
  time("    removeEmptyRanks", () => removeEmptyRanks(g));
  time("    nestingGraph.cleanup", () => nestingGraph.cleanup(g));
  time("    normalizeRanks", () => normalizeRanks(g));
  time("    assignRankMinMax", () => assignRankMinMax(g));
  time("    removeEdgeLabelProxies", () => removeEdgeLabelProxies(g));
  time("    normalize.run", () => normalize.run(g));
  time("    parentDummyChains", () => (0, _parentDummyChains.default)(g));
  time("    addBorderSegments", () => (0, _addBorderSegments.default)(g));
  time("    order", () => (0, _index2.default)(g));
  time("    insertSelfEdges", () => insertSelfEdges(g));
  time("    adjustCoordinateSystem", () => coordinateSystem.adjust(g));
  time("    position", () => (0, _index3.default)(g));
  time("    positionSelfEdges", () => positionSelfEdges(g));
  time("    removeBorderNodes", () => removeBorderNodes(g));
  time("    normalize.undo", () => normalize.undo(g));
  time("    fixupEdgeLabelCoords", () => fixupEdgeLabelCoords(g));
  time("    undoCoordinateSystem", () => coordinateSystem.undo(g));
  time("    translateGraph", () => translateGraph(g));
  time("    assignNodeIntersects", () => assignNodeIntersects(g));
  time("    reversePoints", () => reversePointsForReversedEdges(g));
  time("    acyclic.undo", () => acyclic.undo(g));
}

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
function updateInputGraph(inputGraph, layoutGraph) {
  inputGraph.nodes().forEach(v => {
    let inputLabel = inputGraph.node(v);
    let layoutLabel = layoutGraph.node(v);
    if (inputLabel) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
      inputLabel.rank = layoutLabel.rank;
      if (layoutGraph.children(v).length) {
        inputLabel.width = layoutLabel.width;
        inputLabel.height = layoutLabel.height;
      }
    }
  });
  inputGraph.edges().forEach(e => {
    let inputLabel = inputGraph.edge(e);
    let layoutLabel = layoutGraph.edge(e);
    inputLabel.points = layoutLabel.points;
    if (layoutLabel.hasOwnProperty("x")) {
      inputLabel.x = layoutLabel.x;
      inputLabel.y = layoutLabel.y;
    }
  });
  inputGraph.graph().width = layoutGraph.graph().width;
  inputGraph.graph().height = layoutGraph.graph().height;
}
let graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
let graphDefaults = {
  ranksep: 50,
  edgesep: 20,
  nodesep: 50,
  rankdir: "tb"
};
let graphAttrs = ["acyclicer", "ranker", "rankdir", "align"];
let nodeNumAttrs = ["width", "height"];
let nodeDefaults = {
  width: 0,
  height: 0
};
let edgeNumAttrs = ["minlen", "weight", "width", "height", "labeloffset"];
let edgeDefaults = {
  minlen: 1,
  weight: 1,
  width: 0,
  height: 0,
  labeloffset: 10,
  labelpos: "r"
};
let edgeAttrs = ["labelpos"];

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
function buildLayoutGraph(inputGraph) {
  let g = new _graphlib.Graph({
    multigraph: true,
    compound: true
  });
  let graph = canonicalize(inputGraph.graph());
  g.setGraph(Object.assign({}, graphDefaults, selectNumberAttrs(graph, graphNumAttrs), util.pick(graph, graphAttrs)));
  inputGraph.nodes().forEach(v => {
    let node = canonicalize(inputGraph.node(v));
    const newNode = selectNumberAttrs(node, nodeNumAttrs);
    Object.keys(nodeDefaults).forEach(k => {
      if (newNode[k] === undefined) {
        newNode[k] = nodeDefaults[k];
      }
    });
    g.setNode(v, newNode);
    g.setParent(v, inputGraph.parent(v));
  });
  inputGraph.edges().forEach(e => {
    let edge = canonicalize(inputGraph.edge(e));
    g.setEdge(e, Object.assign({}, edgeDefaults, selectNumberAttrs(edge, edgeNumAttrs), util.pick(edge, edgeAttrs)));
  });
  return g;
}

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
function makeSpaceForEdgeLabels(g) {
  let graph = g.graph();
  graph.ranksep /= 2;
  g.edges().forEach(e => {
    let edge = g.edge(e);
    edge.minlen *= 2;
    if (edge.labelpos.toLowerCase() !== "c") {
      if (graph.rankdir === "TB" || graph.rankdir === "BT") {
        edge.width += edge.labeloffset;
      } else {
        edge.height += edge.labeloffset;
      }
    }
  });
}

/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
function injectEdgeLabelProxies(g) {
  g.edges().forEach(e => {
    let edge = g.edge(e);
    if (edge.width && edge.height) {
      let v = g.node(e.v);
      let w = g.node(e.w);
      let label = {
        rank: (w.rank - v.rank) / 2 + v.rank,
        e: e
      };
      util.addDummyNode(g, "edge-proxy", label, "_ep");
    }
  });
}
function assignRankMinMax(g) {
  let maxRank = 0;
  g.nodes().forEach(v => {
    let node = g.node(v);
    if (node.borderTop) {
      node.minRank = g.node(node.borderTop).rank;
      node.maxRank = g.node(node.borderBottom).rank;
      maxRank = Math.max(maxRank, node.maxRank);
    }
  });
  g.graph().maxRank = maxRank;
}
function removeEdgeLabelProxies(g) {
  g.nodes().forEach(v => {
    let node = g.node(v);
    if (node.dummy === "edge-proxy") {
      g.edge(node.e).labelRank = node.rank;
      g.removeNode(v);
    }
  });
}
function translateGraph(g) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = 0;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = 0;
  let graphLabel = g.graph();
  let marginX = graphLabel.marginx || 0;
  let marginY = graphLabel.marginy || 0;
  function getExtremes(attrs) {
    let x = attrs.x;
    let y = attrs.y;
    let w = attrs.width;
    let h = attrs.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  }
  g.nodes().forEach(v => getExtremes(g.node(v)));
  g.edges().forEach(e => {
    let edge = g.edge(e);
    if (edge.hasOwnProperty("x")) {
      getExtremes(edge);
    }
  });
  minX -= marginX;
  minY -= marginY;
  g.nodes().forEach(v => {
    let node = g.node(v);
    node.x -= minX;
    node.y -= minY;
  });
  g.edges().forEach(e => {
    let edge = g.edge(e);
    edge.points.forEach(p => {
      p.x -= minX;
      p.y -= minY;
    });
    if (edge.hasOwnProperty("x")) {
      edge.x -= minX;
    }
    if (edge.hasOwnProperty("y")) {
      edge.y -= minY;
    }
  });
  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}
function assignNodeIntersects(g) {
  g.edges().forEach(e => {
    let edge = g.edge(e);
    let nodeV = g.node(e.v);
    let nodeW = g.node(e.w);
    let p1, p2;
    if (!edge.points) {
      edge.points = [];
      p1 = nodeW;
      p2 = nodeV;
    } else {
      p1 = edge.points[0];
      p2 = edge.points[edge.points.length - 1];
    }
    edge.points.unshift(util.intersectRect(nodeV, p1));
    edge.points.push(util.intersectRect(nodeW, p2));
  });
}
function fixupEdgeLabelCoords(g) {
  g.edges().forEach(e => {
    let edge = g.edge(e);
    if (edge.hasOwnProperty("x")) {
      if (edge.labelpos === "l" || edge.labelpos === "r") {
        edge.width -= edge.labeloffset;
      }
      switch (edge.labelpos) {
        case "l":
          edge.x -= edge.width / 2 + edge.labeloffset;
          break;
        case "r":
          edge.x += edge.width / 2 + edge.labeloffset;
          break;
      }
    }
  });
}
function reversePointsForReversedEdges(g) {
  g.edges().forEach(e => {
    let edge = g.edge(e);
    if (edge.reversed) {
      edge.points.reverse();
    }
  });
}
function removeBorderNodes(g) {
  g.nodes().forEach(v => {
    if (g.children(v).length) {
      let node = g.node(v);
      let t = g.node(node.borderTop);
      let b = g.node(node.borderBottom);
      let l = g.node(node.borderLeft[node.borderLeft.length - 1]);
      let r = g.node(node.borderRight[node.borderRight.length - 1]);
      node.width = Math.abs(r.x - l.x);
      node.height = Math.abs(b.y - t.y);
      node.x = l.x + node.width / 2;
      node.y = t.y + node.height / 2;
    }
  });
  g.nodes().forEach(v => {
    if (g.node(v).dummy === "border") {
      g.removeNode(v);
    }
  });
}
function removeSelfEdges(g) {
  g.edges().forEach(e => {
    if (e.v === e.w) {
      var node = g.node(e.v);
      if (!node.selfEdges) {
        node.selfEdges = [];
      }
      node.selfEdges.push({
        e: e,
        label: g.edge(e)
      });
      g.removeEdge(e);
    }
  });
}
function insertSelfEdges(g) {
  var layers = util.buildLayerMatrix(g);
  layers.forEach(layer => {
    var orderShift = 0;
    layer.forEach((v, i) => {
      var node = g.node(v);
      node.order = i + orderShift;
      (node.selfEdges || []).forEach(selfEdge => {
        util.addDummyNode(g, "selfedge", {
          width: selfEdge.label.width,
          height: selfEdge.label.height,
          rank: node.rank,
          order: i + ++orderShift,
          e: selfEdge.e,
          label: selfEdge.label
        }, "_se");
      });
      delete node.selfEdges;
    });
  });
}
function positionSelfEdges(g) {
  g.nodes().forEach(v => {
    var node = g.node(v);
    if (node.dummy === "selfedge") {
      var selfNode = g.node(node.e.v);
      var x = selfNode.x + selfNode.width / 2;
      var y = selfNode.y;
      var dx = node.x - x;
      var dy = selfNode.height / 2;
      g.setEdge(node.e, node.label);
      g.removeNode(v);
      node.label.points = [{
        x: x + 2 * dx / 3,
        y: y - dy
      }, {
        x: x + 5 * dx / 6,
        y: y - dy
      }, {
        x: x + dx,
        y: y
      }, {
        x: x + 5 * dx / 6,
        y: y + dy
      }, {
        x: x + 2 * dx / 3,
        y: y + dy
      }];
      node.label.x = node.x;
      node.label.y = node.y;
    }
  });
}
function selectNumberAttrs(obj, attrs) {
  return util.mapValues(util.pick(obj, attrs), Number);
}
function canonicalize(attrs) {
  var newAttrs = {};
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      if (typeof k === "string") {
        k = k.toLowerCase();
      }
      newAttrs[k] = v;
    });
  }
  return newAttrs;
}
module.exports = exports.default;
