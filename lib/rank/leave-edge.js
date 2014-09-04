var _ = require("lodash");

module.exports = leaveEdge;

function leaveEdge(tree) {
  return _.find(tree.edges(), function(edge) {
    return edge.label.cutvalue < 0;
  });
}
