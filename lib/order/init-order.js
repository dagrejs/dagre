"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initOrder;
var util = _interopRequireWildcard(require("../util.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
function initOrder(g) {
  let visited = {};
  let simpleNodes = g.nodes().filter(v => !g.children(v).length);
  let maxRank = Math.max(...simpleNodes.map(v => g.node(v).rank));
  let layers = util.range(maxRank + 1).map(() => []);
  function dfs(v) {
    if (visited[v]) return;
    visited[v] = true;
    let node = g.node(v);
    layers[node.rank].push(v);
    g.successors(v).forEach(dfs);
  }
  let orderedVs = simpleNodes.sort((a, b) => g.node(a).rank - g.node(b).rank);
  orderedVs.forEach(dfs);
  return layers;
}
module.exports = exports.default;
