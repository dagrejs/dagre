/*
 * Directed multi-graph used during layout.
 */
dagre.graph = {};

/*
 * Creates a new directed multi-graph. This should be invoked with
 * `var g = dagre.graph()` and _not_ `var g = new dagre.graph()`.
 */
dagre.graph = function() {
  var nodes = {},
      inEdges = {},
      outEdges = {},
      edges = {},
      graph = {};

  graph.addNode = function(u, value) {
    if (graph.hasNode(u)) {
      throw new Error("Graph already has node '" + u + "':\n" + graph.toString());
    }
    nodes[u] = { id: u, value: value };
    inEdges[u] = {};
    outEdges[u] = {};
  }

  graph.delNode = function(u) {
    strictGetNode(u);

    graph.edges(u).forEach(function(e) { graph.delEdge(e); });

    delete inEdges[u];
    delete outEdges[u];
    delete nodes[u];
  }

  graph.node = function(u) {
    var node = strictGetNode(u);
    return {
      value: node.value
    };
  }

  graph.hasNode = function(u) {
    return u in nodes;
  }

  graph.addEdge = function(e, source, target, value) {
    strictGetNode(source);
    strictGetNode(target);

    if (graph.hasEdge(e)) {
      throw new Error("Graph already has edge '" + e + "':\n" + graph.toString());
    }

    edges[e] = { id: e, source: source, target: target, value: value };
    addEdgeToMap(inEdges[target], source, e);
    addEdgeToMap(outEdges[source], target, e);
  }

  graph.delEdge = function(e) {
    var edge = strictGetEdge(e);
    delEdgeFromMap(inEdges[edge.target], edge.source, e)
    delEdgeFromMap(outEdges[edge.source], edge.target, e)
    delete edges[e];
  }

  graph.edge = function(e) {
    var edge = strictGetEdge(e);
    return {
      source: edge.source,
      target: edge.target,
      value: edge.value
    };
  }

  graph.hasEdge = function(e) {
    return e in edges;
  }

  graph.successors = function(u) {
    strictGetNode(u);
    return keys(outEdges[u]).map(function(v) { return nodes[v].id; });
  }

  graph.predecessors = function(u) {
    strictGetNode(u);
    return keys(inEdges[u]).map(function(v) { return nodes[v].id; });
  }

  graph.neighbors = function(u) {
    strictGetNode(u);
    var vs = {};
    keys(outEdges[u]).map(function(v) { vs[v] = true; });
    keys(inEdges[u]).map(function(v) { vs[v] = true; });
    return keys(vs).map(function(v) { return nodes[v].id; });
  }

  graph.nodes = function() {
    return values(nodes).map(function(u) { return u.id; });
  }

  graph.edges = function(u, v) {
    if (!arguments.length) {
      return values(edges).map(function(e) { return e.id; });
    } else if (arguments.length === 1) {
      return union([graph.inEdges(u), graph.outEdges(u)]);
    } else if (arguments.length === 2) {
      strictGetNode(u);
      strictGetNode(v);
      var sourceEdges = outEdges[u];
      var es = (v in sourceEdges) ? keys(sourceEdges[v].edges) : [];
      return es.map(function(e) { return edges[e].id });
    }
  };

  graph.inEdges = function(target) {
    strictGetNode(target);
    return concat(values(inEdges[target]).map(function(es) { return keys(es.edges); }));
  };

  graph.outEdges = function(source) {
    strictGetNode(source);
    return concat(values(outEdges[source]).map(function(es) { return keys(es.edges); }));
  };

  graph.subgraph = function(us) {
    var g = dagre.graph();
    us.forEach(function(u) {
      strictGetNode(u);
      g.addNode(u);
    });
    values(edges).forEach(function(e) {
      if (g.hasNode(e.source) && g.hasNode(e.target)) {
        g.addEdge(e.id, e.source, e.target);
      }
    });
    return g;
  };

  graph.toString = function() {
    var str = "GRAPH:\n";
    str += "    Nodes: [" + keys(nodes).join(", ") + "]\n";
    str += "    Edges:\n";
    keys(edges).forEach(function(e) {
      var edge = edges[e];
      str += "        " + e + ": " + edge.source + " -> " + edge.target + "\n";
    });
    return str;
  };

  function addEdgeToMap(map, v, e) {
    var vEntry = map[v];
    if (!vEntry) {
      vEntry = map[v] = { count: 0, edges: {} };
    }
    vEntry.count++;
    vEntry.edges[e] = true;
  }

  function delEdgeFromMap(map, v, e) {
    var vEntry = map[v];
    if (--vEntry.count == 0) {
      delete map[v];
    } else {
      delete vEntry.edges[e];
    }
  }

  function strictGetNode(u) {
    var node = nodes[u];
    if (!(u in nodes)) {
      throw new Error("Node '" + u + "' is not in graph:\n" + graph.toString());
    }
    return node;
  }

  function strictGetEdge(e) {
    var edge = edges[e];
    if (!edge) {
      throw new Error("Edge '" + e + "' is not in graph:\n" + graph.toString());
    }
    return edge;
  }

  return graph;
}
