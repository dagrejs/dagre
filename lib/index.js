"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "debug", {
  enumerable: true,
  get: function () {
    return _debug.default;
  }
});
exports.graphlib = void 0;
Object.defineProperty(exports, "layout", {
  enumerable: true,
  get: function () {
    return _layout.default;
  }
});
exports.util = void 0;
Object.defineProperty(exports, "version", {
  enumerable: true,
  get: function () {
    return _version.default;
  }
});
var _graphlib = _interopRequireWildcard(require("@dagrejs/graphlib"));
exports.graphlib = _graphlib;
var _layout = _interopRequireDefault(require("./layout.js"));
var _debug = _interopRequireDefault(require("./debug.js"));
var _util = require("./util.js");
var _version = _interopRequireDefault(require("./version.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const util = exports.util = {
  time: _util.time,
  notime: _util.notime
};
