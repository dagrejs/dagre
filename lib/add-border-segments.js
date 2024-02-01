"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = addBorderSegments;
var util = _interopRequireWildcard(require("./util.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function addBorderSegments(g) {
  function dfs(v) {
    let children = g.children(v);
    let node = g.node(v);
    if (children.length) {
      children.forEach(dfs);
    }
    if (node.hasOwnProperty("minRank")) {
      node.borderLeft = [];
      node.borderRight = [];
      for (let rank = node.minRank, maxRank = node.maxRank + 1; rank < maxRank; ++rank) {
        addBorderNode(g, "borderLeft", "_bl", v, node, rank);
        addBorderNode(g, "borderRight", "_br", v, node, rank);
      }
    }
  }
  g.children().forEach(dfs);
}
function addBorderNode(g, prop, prefix, sg, sgNode, rank) {
  let label = {
    width: 0,
    height: 0,
    rank: rank,
    borderType: prop
  };
  let prev = sgNode[prop][rank - 1];
  let curr = util.addDummyNode(g, "border", label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, {
      weight: 1
    });
  }
}
module.exports = exports.default;
