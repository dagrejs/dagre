module.exports = normalize;
module.exports.undo = undoNormalize;

/*
 * This function is responsible for 'normalizing' the graph. The process of
 * normalization ensures that no edge in the graph has spans more than one
 * rank. To do this it inserts dummy nodes as needed and links them by adding
 * dummy edges. This function keeps enough information in the dummy nodes and
 * edges to ensure that the original graph can be reconstructed later.
 *
 * This method assumes that the input graph is cycle free.
 */
function normalize(g) {
  var dummyCount = 0;
  g.eachEdge(function(e, s, t, a) {
    var sourceRank = g.node(s).rank;
    var targetRank = g.node(t).rank;
    if (sourceRank + 1 < targetRank) {
      for (var u = s, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
        var v = '_D' + (++dummyCount);
        var node = {
          width: a.width,
          height: a.height,
          edge: { id: e, source: s, target: t, attrs: a },
          rank: rank,
          dummy: true
        };

        // If this node represents a bend then we will use it as a control
        // point. For edges with 2 segments this will be the center dummy
        // node. For edges with more than two segments, this will be the
        // first and last dummy node.
        if (i === 0) node.index = 0;
        else if (rank + 1 === targetRank) node.index = 1;

        g.addNode(v, node);
        g.addEdge(null, u, v, {});
        u = v;
      }
      g.addEdge(null, u, t, {});
      g.delEdge(e);
    }
  });
}

/*
 * Reconstructs the graph as it was before normalization. The positions of
 * dummy nodes are used to build an array of points for the original 'long'
 * edge. Dummy nodes and edges are removed.
 */
function undoNormalize(g) {
  g.eachNode(function(u, a) {
    if (a.dummy) {
      if ('index' in a) {
        var edge = a.edge;
        if (!g.hasEdge(edge.id)) {
          g.addEdge(edge.id, edge.source, edge.target, edge.attrs);
        }
        var points = g.edge(edge.id).points;
        points[a.index] = { x: a.x, y: a.y, ul: a.ul, ur: a.ur, dl: a.dl, dr: a.dr };
      }
      g.delNode(u);
    }
  });
}

