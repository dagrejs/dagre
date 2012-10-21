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

  graph.addNode = function(u) {
    if (graph.hasNode(u)) {
      throw new Error("Graph already has node '" + u + "':\n" + graph.toString());
    }
    nodes[u] = u;
    inEdges[u] = {};
    outEdges[u] = {};
  }

  graph.delNode = function(u) {
    strictHasNode(u);

    graph.edges(u, null).forEach(function(e) { graph.delEdge(e); });
    graph.edges(null, u).forEach(function(e) { graph.delEdge(e); });

    delete inEdges[u];
    delete outEdges[u];
    delete nodes[u];
  }

  graph.hasNode = function(u) {
    return u in nodes;
  }

  graph.addEdge = function(e, source, target) {
    strictHasNode(source);
    strictHasNode(target);

    if (graph.hasEdge(e)) {
      throw new Error("Graph already has edge '" + e + "':\n" + graph.toString());
    }

    edges[e] = { source: source, target: target, key: e };
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
      target: edge.target
    };
  }

  graph.hasEdge = function(e) {
    return e in edges;
  }

  graph.successors = function(u) {
    strictHasNode(u);
    return keys(outEdges[u]).map(function(v) { return nodes[v]; });
  }

  graph.predecessors = function(u) {
    strictHasNode(u);
    return keys(inEdges[u]).map(function(v) { return nodes[v]; });
  }

  graph.neighbors = function(u) {
    strictHasNode(u);
    var vs = {};
    keys(outEdges[u]).map(function(v) { vs[v] = true; });
    keys(inEdges[u]).map(function(v) { vs[v] = true; });
    return keys(vs).map(function(v) { return nodes[v]; });
  }

  graph.nodes = function() {
    return values(nodes);
  }

  graph.edges = function(source, target) {
    var sourceDefined = source !== undefined && source != null;
    var targetDefined = target !== undefined && target != null;

    if (sourceDefined) { strictHasNode(source); }
    if (targetDefined) { strictHasNode(target); }

    if (!sourceDefined && !targetDefined) {
      return values(edges).map(function(e) { return e.key; });
    } else {
      var es;
      if (sourceDefined) {
        if (targetDefined) {
          var sourceEdges = outEdges[source];
          es = (target in sourceEdges) ? keys(sourceEdges[target].edges) : [];
        } else {
          es = concat(values(outEdges[source]).map(function(es) { return keys(es.edges); }));
        }
      } else {
        es = concat(values(inEdges[target]).map(function(es) { return keys(es.edges); }));
      }
      return es.map(function(e) { return edges[e].key });
    }
  };

  graph.inEdges = function(target) {
    return graph.edges(null, target);
  };

  graph.outEdges = function(source) {
    return graph.edges(source);
  };

  graph.subgraph = function(us) {
    var g = dagre.graph();
    us.forEach(function(u) {
      strictHasNode(u);
      g.addNode(u);
    });
    values(edges).forEach(function(e) {
      if (g.hasNode(e.source) && g.hasNode(e.target)) {
        g.addEdge(e.key, e.source, e.target);
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

  function strictHasNode(u) {
    if (!(u in nodes)) {
      throw new Error("Node '" + u + "' is not in graph:\n" + graph.toString());
    }
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

/*
 * Dot-like language parser.
 */
dagre.graph.read = function(str) {
  var parseTree = dot_parser.parse(str);
  var graph = dagre.graph();
  var graphAttrs = {};
  var nodeAttrs = {};
  var undir = parseTree.type === "graph";

  var edgeCount = {};
  function createEdge(tail, head, attrs) {
    var edgeKey = tail + "-" + head;
    var count = edgeCount[edgeKey];
    if (!count) {
      count = edgeCount[edgeKey] = 0;
    }
    edgeCount[edgeKey]++;
    graph.addEdge(edgeKey + "-" + count, tail, head, attrs);
  }

  function handleStmt(stmt) {
    switch (stmt.type) {
      case "node":
        var id = stmt.id;
        if (!graph.hasNode(id)) {
          graph.addNode(id);
          nodeAttrs[id] = { label: id };
        }
        mergeAttributes(stmt.attrs, nodeAttrs[id]);
        break;
      case "edge":
        var prev;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node":
              var curr = elem.id;
              if (!graph.hasNode(curr)) {
                graph.addNode(curr);
              }

              if (prev) {
                createEdge(prev, curr, stmt.attrs);
                if (undir) {
                  createEdge(curr, prev, stmt.attrs);
                }
              }
              prev = curr;
              break;
            default:
              // We don't currently support subgraphs incident on an edge
              throw new Error("Unsupported type incident on edge: " + elem.type);
          }
        });
        break;
      case "attr":
        if (stmt.attrType === "graph") {
          mergeAttributes(stmt.attrs, graphAttrs);
        }
        // Otherwise ignore for now
        break;
      default:
        throw new Error("Unsupported statement type: " + stmt.type);
    }
  }

  if (parseTree.stmts) {
    parseTree.stmts.forEach(function(stmt) {
      handleStmt(stmt);
    });
  }

  return { graph: graph, graphAttrs: graphAttrs, nodeAttrs: nodeAttrs };
}   
