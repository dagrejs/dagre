"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = debugOrdering;
var util = _interopRequireWildcard(require("./util.js"));
var _graphlib = require("@dagrejs/graphlib");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// web-devs write a <script type="importmap"> to map
// nodejs paths to actual http://paths

/* istanbul ignore next */
function debugOrdering(g) {
  let layerMatrix = util.buildLayerMatrix(g);
  let h = new _graphlib.Graph({
    compound: true,
    multigraph: true
  }).setGraph({});
  g.nodes().forEach(v => {
    h.setNode(v, {
      label: v
    });
    h.setParent(v, "layer" + g.node(v).rank);
  });
  g.edges().forEach(e => h.setEdge(e.v, e.w, {}, e.name));
  layerMatrix.forEach((layer, i) => {
    let layerV = "layer" + i;
    h.setNode(layerV, {
      rank: "same"
    });
    layer.reduce((u, v) => {
      h.setEdge(u, v, {
        style: "invis"
      });
      return v;
    });
  });
  return h;
}
module.exports = exports.default;
