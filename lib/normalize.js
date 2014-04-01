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
    var
        // The rank of the source and target of the edge, held constant over
        // the span of this function.
        sourceRank = g.node(s).rank,
        targetRank = g.node(t).rank,

        // The lowest common ancestor for s and t
        lca = findLCA(g, s, t),

        // The id of the current node
        u = s,

        // The id of the next dummy node to create
        v,

        // The attributes for the next dummy node to create
        node,

        // The rank of the next dummy node to create
        rank;

    if (sourceRank + 1 < targetRank) {
      for (rank = sourceRank + 1; rank < targetRank; ++rank) {
        v = '_D' + (++dummyCount);
        node = {
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
        if (rank - 1 === sourceRank) node.index = 0;
        else if (rank + 1 === targetRank) node.index = 1;

        g.addNode(v, node);
        g.parent(v, lca);
        g.addEdge(null, u, v, {});
        u = v;
      }
      g.addEdge(null, u, t, {});
      g.delEdge(e);
    }
  });
}

/*
 * Returns the lowest common ancestor of nodes u and v in the nesting tree of
 * graph g.
 */
function findLCA(g, u, v) {
  var visited = {};
  while (u !== null && v !== null) {
    if (visited[u]) return u;
    visited[u] = true;
    u = g.parent(u);

    if (visited[v]) return v;
    visited[v] = true;
    v = g.parent(v);
  }
  return null;
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

