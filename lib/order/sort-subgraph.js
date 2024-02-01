"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sortSubgraph;
var _barycenter = _interopRequireDefault(require("./barycenter.js"));
var _resolveConflicts = _interopRequireDefault(require("./resolve-conflicts.js"));
var _sort = _interopRequireDefault(require("./sort.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function sortSubgraph(g, v, cg, biasRight) {
  let movable = g.children(v);
  let node = g.node(v);
  let bl = node ? node.borderLeft : undefined;
  let br = node ? node.borderRight : undefined;
  let subgraphs = {};
  if (bl) {
    movable = movable.filter(w => w !== bl && w !== br);
  }
  let barycenters = (0, _barycenter.default)(g, movable);
  barycenters.forEach(entry => {
    if (g.children(entry.v).length) {
      let subgraphResult = sortSubgraph(g, entry.v, cg, biasRight);
      subgraphs[entry.v] = subgraphResult;
      if (subgraphResult.hasOwnProperty("barycenter")) {
        mergeBarycenters(entry, subgraphResult);
      }
    }
  });
  let entries = (0, _resolveConflicts.default)(barycenters, cg);
  expandSubgraphs(entries, subgraphs);
  let result = (0, _sort.default)(entries, biasRight);
  if (bl) {
    result.vs = [bl, result.vs, br].flat(true);
    if (g.predecessors(bl).length) {
      let blPred = g.node(g.predecessors(bl)[0]),
        brPred = g.node(g.predecessors(br)[0]);
      if (!result.hasOwnProperty("barycenter")) {
        result.barycenter = 0;
        result.weight = 0;
      }
      result.barycenter = (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
      result.weight += 2;
    }
  }
  return result;
}
function expandSubgraphs(entries, subgraphs) {
  entries.forEach(entry => {
    entry.vs = entry.vs.flatMap(v => {
      if (subgraphs[v]) {
        return subgraphs[v].vs;
      }
      return v;
    });
  });
}
function mergeBarycenters(target, other) {
  if (target.barycenter !== undefined) {
    target.barycenter = (target.barycenter * target.weight + other.barycenter * other.weight) / (target.weight + other.weight);
    target.weight += other.weight;
  } else {
    target.barycenter = other.barycenter;
    target.weight = other.weight;
  }
}
module.exports = exports.default;
