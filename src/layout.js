dagre.layout = function() {
}

/*
 * Makes the input graph acyclic by reversing edges as needed. This algorithm
 * does not attempt to reverse the minimal set of edges (feedback arc set
 * problem) because an exact algorithm is NP-complete.
 */
dagre.layout.acyclic = function(g) {
  var onStack = {};
  var visited = {};

  function dfs(u) {
    if (u in visited)
      return;

    visited[u] = true;
    onStack[u] = true;
    u.outEdges().forEach(function(e) {
      var v = e.head();
      if (v in onStack) {
        u.removeSuccessor(v);

        // If u === v then this edge was a self loop in which case it should be
        // removed altogether. Otherwise, we need to reverse the edge.
        if (u !== v) {
          var e2 = u.inEdge(v);
          if (e2) {
            e2.attrs.weight = parseInt(e2.attrs.weight) + parseInt(e.attrs.weight);
          } else {
            u.addPredecessor(v, { weight: parseInt(e.attrs.weight) });
          }
        }
      } else {
        dfs(v);
      }
    });

    delete onStack[u];
  }

  g.nodes().forEach(function(u) {
    dfs(u);
  });
}

/*
 * Finds the point at which a line from v intersects with the border of the
 * shape of u.
 */
function intersect(u, v) {
  var uAttrs = u.attrs;
  var vAttrs = v.attrs;
  var x = uAttrs.x;
  var y = uAttrs.y;
  if (uAttrs.dummy) {
    return { x: x, y: y };
  }

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = vAttrs.x - x;
  var dy = vAttrs.y - y;
  var w = uAttrs.width / 2 + uAttrs.marginX  + uAttrs.strokewidth;
  var h = uAttrs.height / 2 + uAttrs.marginY + uAttrs.strokewidth;

  var sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = dy === 0 ? 0 : h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = dx === 0 ? 0 : w * dy / dx;
  }

  return { x: x + sx, y: y + sy };
}

function collapseDummyNodes(g) {
  var visited = {};

  // Use dfs from all non-dummy nodes to find the roots of dummy chains. Then
  // walk the dummy chain until a non-dummy node is found. Collapse all edges
  // traversed into a single edge.

  function collapseChain(e) {
    var root = e.tail();
    var path = "M " + e.attrs.tailPoint.x + "," + e.attrs.tailPoint.y + " L";
    do
    {
      path += " " + e.attrs.headPoint.x + "," + e.attrs.headPoint.y;
      e = e.head().outEdges()[0];
      g.removeNode(e.tail());
    }
    while (e.head().attrs.dummy);
    path += " " + e.attrs.headPoint.x + "," + e.attrs.headPoint.y;
    root.addSuccessor(e.head(), {path: path});
  }

  function dfs(u) {
    if (!(u.id() in visited)) {
      visited[u.id()] = true;
      u.outEdges().forEach(function(e) {
        var v = e.head();
        if (v.attrs.dummy) {
          collapseChain(e);
        } else {
          dfs(v);
        }
      });
    }
  }

  g.nodes().forEach(function(u) {
    if (!u.attrs.dummy) {
      dfs(u);
    }
  });
}

/*
 * For each edge in the graph, this function assigns one or more points to the
 * points attribute. This function requires that the nodes in the graph have
 * their x and y attributes assigned. Dummy nodes should be marked with the
 * dummy attribute.
 */
dagre.layout.edges = function(g) {
  g.edges().forEach(function(e) {
    e.attrs.tailPoint = intersect(e.tail(), e.head());
    e.attrs.headPoint = intersect(e.head(), e.tail());
  });

  // TODO handle self loops

  collapseDummyNodes(g);

  g.edges().forEach(function(e) {
    var attrs = e.attrs;
    if (!attrs.path) {
      attrs.path = "M " + attrs.tailPoint.x + "," + attrs.tailPoint.y + " L " + attrs.headPoint.x + "," + attrs.headPoint.y;
    }
  });
}

/*
 * Copies attributes from the source graph to the destination graph. All nodes
 * and edges in the source graph must all be present in the destination graph.
 */
dagre.layout.update = function(src, dst) {
  src.nodes().forEach(function(u) {
    mergeAttributes(u.attrs, dst.node(u.id()).attrs);
  });
  src.edges().forEach(function(e) {
    mergeAttributes(e.attrs, dst.edge(e.tail(), e.head()).attrs);
  });
}
