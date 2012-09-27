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
 * Creates a new directed graph. This should be invoked with
 * `var g = dagre.graph.create()` and _not_ `var g = new dagre.graph.create()`.
 */
dagre.graph.create = function() {
  /*
   * Returns graph level attributes.
   */
  function attrs() {
    return _attrs;
  }

  /*
   * Adds a or updates a node in the graph with the given id. It only makes
   * sense to use primitive values as ids. This function also optionally takes
   * an object that will be used as attributes for the node.
   *
   * If the node already exists in the graph then the supplied attributes will
   * merged with the nodes attributes. Where there are overlapping keys, the
   * new attribute will replace the current attribute.
   *
   * If a new node was added to the graph this function returns `true`. If the
   * node was updated in the graph then this function returns `false`.
   */
  function addNode(id, attrs) {
    var created = false;
    if (!(id in _nodes)) {
      created = true;
      _nodes[id] = {
        id: id,
        attrs: {},
        successors: [],
        predecessors: []
      };
    }
    if (arguments.length > 1) {
      _mergeAttributes(attrs, _nodes[id].attrs);
    }
    return created;
  }

  function addNodes() {
    for (var i = 0; i < arguments.length; ++i) {
      addNode(arguments[i]);
    }
  }

  /*
   * Returns a node view for the given node id. If the node is not in the graph
   * this function will raise an error.
   */
  function node(id) {
    var u = _nodes[id];
    if (u === undefined) {
      throw new Error("Node is not in graph: " + id);
    }

    function addSuccessor(suc, attrs) {
      var sucId = suc.id ? suc.id() : suc;
      _addEdge(id, sucId, attrs);
    }

    function addPredecessor(pred, attrs) {
      var predId = pred.id ? pred.id() : pred;
      _addEdge(predId, id, attrs);
    }

    function successors() {
      return u.successors.map(function(sucId) { return node(sucId); });
    }

    function predecessors() {
      return u.predecessors.map(function(predId) { return node(predId); });
    }

    function neighbors() {
      return successors().concat(predecessors());
    }

    function outEdges() {
      return u.successors.map(function(sucId) { return _edge(id, sucId); });
    }

    function inEdges() {
      return u.predecessors.map(function(predId) { return _edge(predId, id); });
    }

    function edges() {
      return inEdges().concat(outEdges());
    }

    return {
      id: function() { return id; },
      attrs: u.attrs,
      addSuccessor: addSuccessor,
      addPredecessor: addPredecessor,
      successors: successors,
      predecessors: predecessors,
      neighbors: neighbors,
      outEdges: outEdges,
      inEdges: inEdges,
      edges: edges
    }
  }

  function nodes() {
    return Object.keys(_nodes).map(function(id) { return node(id); });
  }

  function edges() {
    return Object.keys(_edges).map(function(id) { return _edgeById(id); });
  }

  /*
   * Adds a new edge to the graph. Nodes for `tailId` and `headId` must already
   * exist in the graph or an error will be thrown. Optionally attributes can be
   * added to the edge.
   *
   * If a new edge was added to the graph this function returns `true`. If the
   * edge was updated then this function returns `false`.
   */
  function _addEdge(tailId, headId, attrs) {
    var created = false;
    var id = _edgeId(tailId, headId);
    if (!(id in _edges)) {
      created = true;
      _edges[id] = {
        tailId: tailId,
        headId: headId,
        attrs: {}
      };
      _nodes[tailId].successors.push(headId);
      _nodes[headId].predecessors.push(tailId);
    }
    if (attrs) {
      _mergeAttributes(attrs, _edges[id].attrs);
    }
    return created;
  }

  function _edge(tailId, headId) {
    return _edgeById(_edgeId(tailId, headId));
  }

  function _edgeById(id) {
    var e = _edges[id];
 
    return {
      id:    function() { return id; },
      tail:  function() { return node(e.tailId); },
      head:  function() { return node(e.headId); },
      attrs: e.attrs
    };
  }

  /*
   * Creates a unique primitive identifier from the given `tailId` and `headId`.
   */
  function _edgeId(tailId, headId) {
    return (tailId.toString().length) + ":" + tailId + '->' + headId;
  }

  /*
   * Copies attributes from `src` to `dst`. If an attribute name is in both
   * `src` and `dst` then the attribute value from `src` takes precedence.
   */
  function _mergeAttributes(src, dst) {
    Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
  }

  _attrs = {};
  _nodes = {};
  _edges = {};

  // Public API is defined here
  return {
    attrs: attrs,
    addNode: addNode,
    addNodes: addNodes,
    node: node,
    nodes: nodes,
    edges: edges
  };
}

/*
 * Dot-like language parser.
 */
dagre.graph.read = function(str) {
  var parseTree = dot_parser.parse(str);
  var graph = dagre.graph.create();
  var undir = parseTree.type === "graph";

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
                prev.addSuccessor(curr, stmt.attrs);
                if (undir) {
                  prev.addPredecessor(curr, stmt.attrs);
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
        // Ignore attrs
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

  g.nodes().forEach(function(u) {
    str += _writeNode(u);
  });

  g.edges().forEach(function(e) {
    str += _writeEdge(e);
  });

  str += "}\n";
  return str;
}
