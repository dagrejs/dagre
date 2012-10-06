dagre.layout = function(g) {
  var layering = dagre.layout.rank(g);

  // Psuedo positioning
  var posY = 0;
  for (var i = 0; i < layering.length; ++i) {
    var layer = layering[i];
    var height = max(layer.map(function(u) { return u.attrs.height; })) + g.attrs.nodeSep;
    var posX = 0;
    for (var j = 0; j < layer.length; ++j) {
      var uAttrs = layer[j].attrs;
      uAttrs.x = posX;
      uAttrs.y = posY;
      posX += uAttrs.width + g.attrs.nodeSep;
    }
    posY += height;
  }

  dagre.layout.edges(g);
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

  // For now we only support rectangles

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  var dx = vAttrs.x - x;
  var dy = vAttrs.y - y;
  var w = uAttrs.width / 2 + uAttrs.marginX  + uAttrs.strokeWidth;
  var h = uAttrs.height / 2 + uAttrs.marginY + uAttrs.strokeWidth;

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

  return (x + sx) + "," + (y + sy);
}

function collapseDummyNodes(g) {
  var visited = {};

  // Use dfs from all non-dummy nodes to find the roots of dummy chains. Then
  // walk the dummy chain until a non-dummy node is found. Collapse all edges
  // traversed into a single edge.

  function collapseChain(e) {
    var root = e.tail();
    var points = e.attrs.tailPoint;
    do
    {
      points += " " + e.head().attrs.x + "," + e.head().attrs.y;
      e = e.head().outEdges()[0];
      g.removeNode(e.tail());
    }
    while (e.head().attrs.dummy);
    points += " " + e.attrs.headPoint;
    var e2 = root.addSuccessor(e.head(), e.attrs);
    e2.attrs.points = points;
    e2.attrs.type = "line";
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
    if (e.head().id() !== e.tail().id()) {
      if (!e.tail().attrs.dummy) {
        e.attrs.tailPoint = intersect(e.tail(), e.head());
      }
      if (!e.head().attrs.dummy) {
        e.attrs.headPoint = intersect(e.head(), e.tail());
      }
    }
  });

  g.edges().forEach(function(e) {
    if (e.head().id() === e.tail().id()) {
      var attrs = e.head().attrs;
      var right = attrs.x + attrs.width / 2 + attrs.marginX + attrs.strokeWidth;
      var h = attrs.height / 2 + attrs.marginY + attrs.strokeWidth;
      var points = [[right,                       attrs.y - h / 3],
                    [right + g.attrs.nodeSep / 2, attrs.y - h],
                    [right + g.attrs.nodeSep / 2, attrs.y + h],
                    [right,                       attrs.y + h / 3]]
      points = points.map(function(pt) { return pt.join(","); });
      e.attrs.points = points.join(" ");
      e.attrs.type = "curve";
    }
  });

  collapseDummyNodes(g);

  g.edges().forEach(function(e) {
    var attrs = e.attrs;
    if (!attrs.points) {
      attrs.points = attrs.tailPoint + " " + attrs.headPoint;
      attrs.type = "line";
    }
  });
}
