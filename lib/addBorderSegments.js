var Digraph = require('graphlib').Digraph;

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
  var cg = new Digraph();

  function addConstraints(left, vs, right) {
    cg.addNode(left);
    cg.addNode(right);
    cg.addEdge(null, left, right);
    if (vs) {
      vs.forEach(function(v) {
        cg.addNode(v);
        cg.addEdge(null, left, v);
        cg.addEdge(null, v, right);
      });
    }
  }

  g.eachNode(function(u, value) {
    var children = g.children(u);
    if (children.length) {
      // First pass, find min, max rank for cluster and capture the rank of
      // each node so that we can updated the constraint graph.
      var min = Number.MAX_VALUE,
          max = Number.MIN_VALUE,
          rankMap = {},
          i,
          prevLeftSeg,
          leftSeg,
          prevRightSeg,
          rightSeg;

      children.forEach(function(v) {
        var rank = g.node(v).rank,
            rankEntry = rankMap[rank];
        min = Math.min(min, rank);
        max = Math.max(max, rank);
        if (!rankEntry) {
          rankEntry = rankMap[rank] = [];
        }
        rankEntry.push(v);
      });

      // Second pass, add left and right border segments from the min rank to
      // the max rank and update the constraint graph.
      value.leftBorderSegments = [];
      value.rightBorderSegments = [];

      for (i = min; i <= max; ++i) {
        leftSeg = g.addNode(null, { rank: i, width: 0, height: 0, leftBorderSegment: true, dummy: true });
        rightSeg = g.addNode(null, { rank: i, width: 0, height: 0, rightBorderSegment: true, dummy: true });

        g.parent(leftSeg, u);
        g.parent(rightSeg, u);

        if (prevLeftSeg !== undefined) {
          g.addEdge(null, prevLeftSeg, leftSeg, {});
          g.addEdge(null, prevRightSeg, rightSeg, {});
        }

        value.leftBorderSegments.push(leftSeg);
        value.rightBorderSegments.push(rightSeg);
        addConstraints(leftSeg, rankMap[i], rightSeg);

        prevLeftSeg = leftSeg;
        prevRightSeg = rightSeg;
      }
    }
  });

  return cg;
}
