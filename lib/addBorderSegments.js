var util = require('./util'),
    Digraph = require('graphlib').Digraph;

module.exports = addBorderSegments;

/*
 * Given a ranked graph this function will add left and right border segements
 * for each cluster such that a rectangular border can later replace border
 * segment nodes. For each cluster we start inserting border segment nodes at
 * the first rank containing a node in the cluster and we continue until we
 * reach the last rank containing a node in the cluster. We construct a
 * constraint graph to ensure that the left border segment remains to the left
 * of all cluster nodes during ordering and we do the same for the right border
 * segments.
 *
 * For a more detailed description of the function of this algorithm, please
 * see Sander, "Layout of Compound Directed Graphs", Section 7.
 */
function addBorderSegments(g) {
  var cg = new Digraph(),
      leftIdGen = util.idGen('_cl'),
      rightIdGen = util.idGen('_cr');

  g.eachNode(function(u) { cg.addNode(u); });

  g.eachNode(function(u, attrs) {
    var children = g.children(u);
    if (children.length) {
      var leftBorderSegments = attrs.leftBorderSegments = [],
          rightBorderSegments = attrs.rightBorderSegments = [],
          leftBorder,
          rightBorder;
      for (var i = attrs.minRank, il = attrs.maxRank, j = 0; i <= il; ++i, ++j) {
        leftBorderSegments[j] = leftBorder =
            createBorderNode(g, u, i, 'leftBorderSegment', leftIdGen);
        cg.addNode(leftBorder);

        rightBorderSegments[j] = rightBorder =
            createBorderNode(g, u, i, 'rightBorderSegment', rightIdGen);
        cg.addNode(rightBorder);

        if (j > 0) {
          g.addEdge(leftIdGen(), leftBorderSegments[j-1], leftBorder, {});
          g.addEdge(rightIdGen(), rightBorderSegments[j-1], rightBorder, {});
        }

        cg.addEdge(null, leftBorder, rightBorder);
        for (var k = 0, kl = children.length; k < kl; ++k) {
          var v = children[k],
              vAttrs = g.node(v);
          if (vAttrs.minRank <= i && i <= vAttrs.maxRank) {
            cg.addEdge(null, leftBorder, v);
            cg.addEdge(null, v, rightBorder);
          }
        }
      }
    }
  });

  return cg;
}

function createBorderNode(g, parent, rank, type, idGen) {
  var attrs = {
    rank: rank,
    minRank: rank,
    maxRank: rank,
    width: 0,
    height: 0,
    dummy: true
  };
  attrs[type] = true;
  var u = g.addNode(idGen(), attrs);
  g.parent(u, parent);
  return u;
}
