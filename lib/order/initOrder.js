var crossCount = require('./crossCount');

module.exports = initOrder;

/*
 * Given a graph with a set of layered nodes (i.e. nodes that have a `rank`
 * attribute) this function attaches an `order` attribute that uniquely
 * arranges each node of each rank. If no constraint graph is provided the
 * order of the nodes in each rank is entirely arbitrary.
 */
function initOrder(g) {
  var orderCount = [];

  function addNode(u, value) {
    if ('order' in value) return;
    if (g.children && g.children(u).length > 0) return;
    if (!(value.rank in orderCount)) {
      orderCount[value.rank] = 0;
    }
    value.order = orderCount[value.rank]++;
  }

  g.eachNode(function(u, value) { addNode(u, value); });
  var cc = crossCount(g);
  g.graph().orderInitCC = cc;
  g.graph().orderCC = Number.MAX_VALUE;
}
