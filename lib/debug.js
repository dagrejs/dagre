var util = require("./util");
var Graph = require("@dagrejs/graphlib").Graph;

module.exports = {
  debugOrdering: debugOrdering
};

/* istanbul ignore next */
function debugOrdering(g) {
  var layerMatrix = util.buildLayerMatrix(g);

  var h = new Graph({ compound: true, multigraph: true }).setGraph({});

  g.nodes().forEach(v => {
    h.setNode(v, { label: v });
    h.setParent(v, "layer" + g.node(v).rank);
  });

  g.edges().forEach(e => h.setEdge(e.v, e.w, {}, e.name));

  layerMatrix.forEach((layer, i) => {
    var layerV = "layer" + i;
    h.setNode(layerV, { rank: "same" });
    layer.reduce((u, v) => {
      h.setEdge(u, v, { style: "invis" });
      return v;
    });
  });

  return h;
}
