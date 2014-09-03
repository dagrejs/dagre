var updateLowLim = require("./low-lim").update,
    calcCutValue = require("./calc-cut-value");

module.exports = exchange;

function exchange(tree, g, e, f) {
  var v = e.v,
      w = e.w,
      lca = findLCA(tree, v, w);
  tree.removeEdge(v, w);
  tree.setEdge(f.v, f.w, {});
  updateLowLim(tree, lca);
  updateCutValues(tree, g, v, lca);
  updateCutValues(tree, g, w, lca);
}

function updateCutValues(tree, g, v, lca) {
  var parent;
  while (v !== lca) {
    parent = tree.getNode(v).parent;
    tree.getEdge(v, parent).cutvalue = calcCutValue(tree, g, v);
    v = parent;
  }
}

function findLCA(tree, v, w) {
  var vLabel = tree.getNode(v),
      wLabel = tree.getNode(w),
      low = Math.min(vLabel.low, wLabel.low),
      lim = Math.max(vLabel.lim, wLabel.lim),
      lca = v,
      lcaLabel = vLabel;
  while (lcaLabel.low > low || lcaLabel.lim < lim) {
    lca = lcaLabel.parent;
    lcaLabel = tree.getNode(lca);
  }
  return lca;
}
