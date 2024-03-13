"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = order;
var _initOrder = _interopRequireDefault(require("./init-order.js"));
var _crossCount = _interopRequireDefault(require("./cross-count.js"));
var _sortSubgraph = _interopRequireDefault(require("./sort-subgraph.js"));
var _buildLayerGraph = _interopRequireDefault(require("./build-layer-graph.js"));
var _addSubgraphConstraints = _interopRequireDefault(require("./add-subgraph-constraints.js"));
var _graphlib = require("@dagrejs/graphlib");
var util = _interopRequireWildcard(require("../util.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
function order(g, opts) {
  if (opts && typeof opts.customOrder === 'function') {
    opts.customOrder(g, order);
    return;
  }

  let maxRank = util.maxRank(g),
    downLayerGraphs = buildLayerGraphs(g, util.range(1, maxRank + 1), "inEdges"),
    upLayerGraphs = buildLayerGraphs(g, util.range(maxRank - 1, -1, -1), "outEdges");
  let layering = (0, _initOrder.default)(g);
  assignOrder(g, layering);

  if (opts && opts.disableOptimalOrderHeuristic) {
    return;
  }

  let bestCC = Number.POSITIVE_INFINITY,
    best;
  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);
    layering = util.buildLayerMatrix(g);
    let cc = (0, _crossCount.default)(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = Object.assign({}, layering);
      bestCC = cc;
    }
  }
  assignOrder(g, best);
}
function buildLayerGraphs(g, ranks, relationship) {
  return ranks.map(function (rank) {
    return (0, _buildLayerGraph.default)(g, rank, relationship);
  });
}
function sweepLayerGraphs(layerGraphs, biasRight) {
  let cg = new _graphlib.Graph();
  layerGraphs.forEach(function (lg) {
    let root = lg.graph().root;
    let sorted = (0, _sortSubgraph.default)(lg, root, cg, biasRight);
    sorted.vs.forEach((v, i) => lg.node(v).order = i);
    (0, _addSubgraphConstraints.default)(lg, cg, sorted.vs);
  });
}
function assignOrder(g, layering) {
  Object.values(layering).forEach(layer => layer.forEach((v, i) => g.node(v).order = i));
}
module.exports = exports.default;
