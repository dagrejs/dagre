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
    var sourceRank = g.node(s).rank,
        targetRank = g.node(t).rank,

        // Current ranks
        i = sourceRank,
        j = targetRank,

        // Current node ids from source and target ends respectively
        u = s,
        w = t,

        // Current subgraph ids for source and target ends respectively
        uSG = g.parent(u),
        wSG = g.parent(w),

        // The node id to be added
        v,

        // The node attributes to be addded
        node,

        // Iterate from the source or the target end?
        fromSource = true;

    while (i < j - 1) {
      v = '_D' + (++dummyCount);
      node = {
        width: a.width,
        height: a.height,
        edge: { id: e, source: s, target: t, attrs: a },
        dummy: true
      };
      g.addNode(v, node);

      if (fromSource) {
        if (i === sourceRank) node.index = 0;
        node.rank = ++i;
        uSG = findSubgraph(g, uSG, i);
        g.parent(v, uSG);
        g.addEdge(null, u, v, {});
        u = v;
      } else {
        if (j === targetRank) node.index = 1;
        node.rank = --j;
        wSG = findSubgraph(g, wSG, j);
        g.parent(v, wSG);
        g.addEdge(null, v, w, {});
        w = v;
      }
      fromSource = !fromSource;
    }

    if (i === j - 1) {
      g.addEdge(null, u, w, {});
    }

    g.delEdge(e);
  });
}

/*
 * Starting from the given subgraph, find the lowest subgraph in the nesting
 * tree that includes the given rank.
 */
function findSubgraph(g, sg, rank) {
  var sgAttrs;
  while (sg !== null) {
    sgAttrs = g.node(sg);
    if (sgAttrs.minRank <= rank && sgAttrs.maxRank >= rank) {
      return sg;
    }
    sg = g.parent(sg);
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

