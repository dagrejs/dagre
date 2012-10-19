/*
 * Graph API.
 *
 * Graphs is dagre are always directed. It is possible to simulate an
 * undirected graph by creating identical edges in both directions. It is also
 * possible to do undirected graph traversal on a directed graph using the
 * `neighbors` function.
 *
 * Dagre graphs have attributes at the graph, node, and edge levels.
 */

dagre.graph = {};

/*
 * Creates a new directed multi-graph. This should be invoked with
 * `var g = dagre.graph.create()` and _not_ `var g = new dagre.graph.create()`.
 */
dagre.graph.create = function() {
  /*
   * Adds a or updates a node in the graph with the given id. If the value of
   * id is `null` then an id will automatically be assigned.
   *
   * It only makes sense to use primitive values as ids. This function also
   * optionally takes an object that will be used as attributes for the node.
   *
   * If the node already exists in the graph the supplied attributes will
   * merged with the node's attributes. Where there are overlapping keys, the
   * new attribute will replace the current attribute.
   */
  function addNode(id, attrs) {
    id = _maybeGenId(id);
    if (!(id in _nodes)) {
      _nodes[id] = {
        /* Unique id for this node, should match the id used to look this node in `_nodes`. */
        id: id,

        attrs: {},

        /* A mapping of successor id to a list of edge ids. */
        successors: {},

        /* A mapping of predecessor id to a list of edge ids. */
        predecessors: {}
      };
    }
    if (arguments.length > 1) {
      mergeAttributes(attrs, _nodes[id].attrs);
    }
    return node(id);
  }

  function removeNode(n) {
    var id = _nodeId(n);
    var u = node(id);
    if (u) {
      u.edges().forEach(function(e) { removeEdge(e); });
      delete _nodes[id];
      return true;
    }
    return false;
  }

  /*
   * Returns a node view for the given node id. If the node is not in the graph
   * this function will raise an error.
   */
  function node(id) {
    var u = _nodes[id];
    if (u === undefined) {
      return null;
    }

    function successors() {
      return _mapNodes(Object.keys(u.successors));
    }

    function predecessors() {
      return _mapNodes(Object.keys(u.predecessors));
    }

    function neighbors() {
      var neighbors = {};
      Object.keys(u.successors).forEach(function(v) {
        neighbors[v] = true;
      });
      Object.keys(u.predecessors).forEach(function(v) {
        neighbors[v] = true;
      });
      return _mapNodes(Object.keys(neighbors));
    }

    /*
     * Returns out edges from this node. If an optional successor is supplied
     * this function will only return edges to the successor. Otherwise this
     * function returns all edges from this node.
     */
    function outEdges(suc) {
      var edgeIds = suc !== undefined
        ? u.successors[_nodeId(suc)]
        : values(u.successors);
      return _mapEdges(concat(edgeIds));
    }

    /*
     * Returns in edges from this node. If an optional predecsesor is supplied
     * this function will only return edges from the predecessor. Otherwise
     * this function returns all edges to this node.
     */
    function inEdges(pred) {
      var edgeId = pred !== undefined
        ? u.predecessors[_nodeId(pred)]
        : values(u.predecessors);
      return _mapEdges(concat(edgeId));
    }

    /*
     * Returns out edges for this node. If an optional adjacent node is
     * supplied this function will only return edges between this node
     * and the adjacent node. Otherwise this function returns all edges
     * incident on this node.
     */
    function edges(adj) {
      var edges = {};
      inEdges(adj).forEach(function(e) {
        edges[e.id()] = e;
      });
      outEdges(adj).forEach(function(e) {
        edges[e.id()] = e;
      });
      return values(edges);
    }

    function inDegree() { return inEdges().length; }

    function outDegree() { return outEdges().length; }

    return {
      id: function() { return u.id; },
      attrs: u.attrs,
      successors: successors,
      predecessors: predecessors,
      neighbors: neighbors,
      outEdges: outEdges,
      inEdges: inEdges,
      inDegree: inDegree,
      outDegree: outDegree,
      edges: edges,
    }
  }

  /*
   * Adds a or updates an edge in the graph with the given id. If the value of
   * id is `null` then an id will automatically be assigned.
   *
   * This function optionally takes an object that will be used as attributes
   * for the edge.
   *
   * Multiple edges between the same tail and head nodes can be added by either
   * using `null` or a unique edge id for each call. If the same id is used
   * with a different tail or head node this function will raise an error.
   *
   * This function returns the edge that was created or updated.
   */
  function addEdge(id, tail, head, attrs) {
    var id = _maybeGenId(id);
    var tailId = _nodeId(tail);
    var headId = _nodeId(head);

    var e = _edges[id];
    if (!e) {
      e = _edges[id] = {
        /*
         * Unique id for this edge (combination of both incident node ids and a
         * counter to ensure uniqueness for multiple edges between the same nodes.
         */
        id: id,

        tailId: tailId,
        headId: headId,
        attrs: {}
      };

      var tailSucs = _nodes[tailId].successors;
      tailSucs[headId] = tailSucs[headId] || [];
      tailSucs[headId].push(e.id);

      var headPreds = _nodes[headId].predecessors;
      headPreds[tailId] = headPreds[tailId] || [];
      headPreds[tailId].push(e.id);
    } else if (e.tail().id() !== tailId || e.head().id() !== headId) {
      throw new Error("addEdge called with different tail or head node. " +
                      "Old: (" + e.tail().id() + "," + e.head().id() + " " +
                      "New: (" + tailId + "," + headId + ")");
    }

    if (attrs) {
      mergeAttributes(attrs, e.attrs);
    }

    return edge(id);
  }

  // Note: edge removal is O(n)
  function removeEdge(e) {
    var id = _edgeId(e);

    var edge = _edges[id];
    if (edge) {
      var tailId = e.tail().id();
      var headId = e.head().id();

      delete _edges[id];
      _removeEdgeFromMap(edge.headId, id, _nodes[tailId].successors);
      _removeEdgeFromMap(edge.tailId, id, _nodes[headId].predecessors);
      return true;
    }
    return false;
  }

  function edge(edgeId) {
    var e = _edges[edgeId];
 
    if (e) {
      return {
        id:    function() { return e.id; },
        tail:  function() { return node(e.tailId); },
        head:  function() { return node(e.headId); },
        attrs: e.attrs
      };
    } else {
      return null;
    }
  }

  function hasEdge(u, v) {
    return _nodeId(v) in _nodes[_nodeId(u)].successors;
  }

  function nodes() {
    return _mapNodes(Object.keys(_nodes));
  }

  function edges() {
    return _mapEdges(Object.keys(_edges));
  }

  /*
   * Creates a new graph that only includes the specified nodes. Edges that are
   * only incident on the specified nodes are included in the new graph. While
   * node ids will be the same in the new graph, edge ids are not guaranteed to
   * be the same.
   */
  // TODO: this will probably need to be renamed when we start handling clusters
  function subgraph(nodes) {
    var g = dagre.graph.create();
    mergeAttributes(_attrs, g.attrs);
    var nodeIds = nodes.map(_nodeId);
    nodeIds.forEach(function(uId) {
      g.addNode(uId, node(uId).attrs);
    });
    nodeIds.forEach(function(uId) {
      var u = node(uId);
      u.successors().forEach(function(v) {
        if (g.node(v.id())) {
          u.outEdges(v).forEach(function(e) {
            g.addEdge(e.id(), e.tail().id(), e.head().id(), e.attrs);
          })
        }
      });
    });
    return g;
  }

  function _nodeId(node) {
    return node.id ? node.id() : node;
  }

  function _edgeId(edge) {
    return edge.id ? edge.id() : edge;
  }

  function _mapNodes(nodeIds) {
    return nodeIds.map(function(id) { return node(id); });
  }

  function _mapEdges(edgeIds) {
    return edgeIds.map(function(id) { return edge(id); });
  }

  function _maybeGenId(id) {
    if (id === null) {
      return "_dagre-" + _nextId++;
    }
    return id;
  }

  function _removeEdgeFromMap(key, id, map) {
    var entries = map[key];
    for (var i = 0; i < entries.length; ++i) {
      if (entries[i] === id) {
        entries.splice(i, 1);
        if (entries.length === 0) {
          delete map[key];
        }
        return;
      }
    }
    throw new Error("No edge with id '" + id + "' in graph");
  }

  var _attrs = {};
  var _nodes = {};
  var _edges = {};
  var _nextId = 0;

  // Public API is defined here
  return {
    attrs: _attrs,
    addNode: addNode,
    removeNode: removeNode,
    addEdge: addEdge,
    removeEdge: removeEdge,
    node: node,
    edge: edge,
    hasEdge: hasEdge,
    nodes: nodes,
    edges: edges,
    subgraph: subgraph,
  };
}

/*
 * Dot-like language parser.
 */
dagre.graph.read = function(str) {
  var parseTree = dot_parser.parse(str);
  var graph = dagre.graph.create();
  var undir = parseTree.type === "graph";

  var edgeCount = {};
  function createEdge(tail, head, attrs) {
    var edgeKey = tail.id() + "-" + head.id();
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
        graph.addNode(id, stmt.attrs);
        break;
      case "edge":
        var prev;
        stmt.elems.forEach(function(elem) {
          handleStmt(elem);

          switch(elem.type) {
            case "node":
              graph.addNode(elem.id);
              var curr = graph.node(elem.id);
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
          mergeAttributes(stmt.attrs, graph.attrs);
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
  return graph;
}   

/*
 * Dot-like serializer.
 */
dagre.graph.write = function(g) {
  function _id(obj) { return '"' + obj.toString().replace(/"/g, '\\"') + '"'; }

  function _idVal(obj) {
    if (Object.prototype.toString.call(obj) === "[object Object]" ||
        Object.prototype.toString.call(obj) === "[object Array]") {
      return _id(JSON.stringify(obj));
    }
    return _id(obj);
  }

  function _writeNode(u) {
    var str = "    " + _id(u.id());
    var hasAttrs = false;
    Object.keys(u.attrs).forEach(function(k) {
      if (!hasAttrs) {
        str += ' [';
        hasAttrs = true;
      } else {
        str += ',';
      }
      str += _id(k) + "=" + _idVal(u.attrs[k]);
    });
    if (hasAttrs) {
      str += "]";
    }
    str += "\n";
    return str;
  }

  function _writeEdge(e) {
    var str = "    " + _id(e.tail().id()) + " -> " + _id(e.head().id());
    var hasAttrs = false;
    Object.keys(e.attrs).forEach(function(k) {
      if (!hasAttrs) {
        str += ' [';
        hasAttrs = true;
      } else {
        str += ',';
      }
      str += _id(k) + "=" + _idVal(e.attrs[k]);
    });
    if (hasAttrs) {
      str += "]";
    }
    str += "\n";
    return str;
  }

  var str = "digraph {\n";

  Object.keys(g.attrs).forEach(function(k) {
    str += "    graph [" + _id(k) + "=" + _idVal(g.attrs[k]) + "]\n";
  });

  g.nodes().forEach(function(u) {
    str += _writeNode(u);
  });

  g.edges().forEach(function(e) {
    str += _writeEdge(e);
  });

  str += "}\n";
  return str;
}
