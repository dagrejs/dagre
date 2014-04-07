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

  function dfs(u) {
    var attrs = g.node(u),
        children = g.children(u);
    if (!children.length) {
      cg.addNode(u);
      return;
    }

    // Add left and right borders
    var minRank = attrs.minRank,
        leftBorder = attrs.leftBorderSegments = [],
        rightBorder = attrs.rightBorderSegments = [];
    for (var i = 0, il = attrs.maxRank - minRank + 1; i < il; ++i) {
      leftBorder[i] = createBorderNode(g, u, minRank + i, 'leftBorderSegment', leftIdGen);
      rightBorder[i] = createBorderNode(g, u, minRank + i, 'rightBorderSegment', leftIdGen);
      cg.addNode(leftBorder[i]);
      cg.addNode(rightBorder[i]);
      if (i > 0) {
        g.addEdge(leftIdGen(), leftBorder[i-1], leftBorder[i], {});
        g.addEdge(rightIdGen(), rightBorder[i-1], rightBorder[i], {});
      }
    }

    children.forEach(function(v) {
      var vAttrs = g.node(v);

      dfs(v);
      
      if (g.children(v).length) {
        var vMinRank = vAttrs.minRank;
        for (var j = 0, jl = vAttrs.maxRank - vMinRank + 1; j < jl; ++j) {
          cg.addEdge(null, leftBorder[j + vMinRank - minRank], vAttrs.leftBorderSegments[j]);
          cg.addEdge(null, vAttrs.rightBorderSegments[j], rightBorder[j + vMinRank - minRank]);
        }
      } else {
        cg.addEdge(null, leftBorder[vAttrs.rank - minRank], v);
        cg.addEdge(null, v, rightBorder[vAttrs.rank - minRank]);
      }
    });
  }

  g.children(null).forEach(dfs);

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
