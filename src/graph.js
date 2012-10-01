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
   * If the node already exists in the graph the supplied attributes will
   * merged with the node's attributes. Where there are overlapping keys, the
   * new attribute will replace the current attribute.
   */
  function addNode(id, attrs) {
    if (!(id in _nodes)) {
      _nodes[id] = {
        id: id,
        attrs: {},
        successors: {},
        predecessors: {}
      };
    }
    if (arguments.length > 1) {
      _mergeAttributes(attrs, _nodes[id].attrs);
    }
    return node(id);
  }

  function addNodes() {
    for (var i = 0; i < arguments.length; ++i) {
      addNode(arguments[i]);
    }
  }

  function removeNode(n) {
    var id = n.id ? n.id() : n;
    var u = node(id);
    if (u) {
      u.successors().forEach(function(v) { u.removeSuccessor(v); });
      u.predecessors().forEach(function(v) { u.removePredecessor(v); });
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

    function addSuccessor(suc, attrs) {
      var sucId = suc.id ? suc.id() : suc;
      return addEdge(id, sucId, attrs);
    }

    function addPredecessor(pred, attrs) {
      var predId = pred.id ? pred.id() : pred;
      return addEdge(predId, id, attrs);
    }

    function removeSuccessor(suc) {
      return removeEdge(id, suc.id ? suc.id() : suc);
    }

    function removePredecessor(pred) {
      return removeEdge(pred.id ? pred.id() : pred, id);
    }

    function successors() {
      return Object.keys(u.successors).map(function(sucId) { return node(sucId); });
    }

    function predecessors() {
      return Object.keys(u.predecessors).map(function(predId) { return node(predId); });
    }

    function neighbors() {
      return successors().concat(predecessors());
    }

    function outEdges() {
      return Object.keys(u.successors).map(function(sucId) { return edge(id, sucId); });
    }

    function inEdges() {
      return Object.keys(u.predecessors).map(function(predId) { return edge(predId, id); });
    }

    function edges() {
      return inEdges().concat(outEdges());
    }

    function outEdge(suc) {
      return edge(id, suc.id ? suc.id() : suc);
    }

    function inEdge(pred) {
      return edge(pred.id ? pred.id() : pred, id);
    }

    return {
      id: function() { return u.id; },
      attrs: u.attrs,
      addSuccessor: addSuccessor,
      addPredecessor: addPredecessor,
      removeSuccessor: removeSuccessor,
      removePredecessor: removePredecessor,
      successors: successors,
      predecessors: predecessors,
      neighbors: neighbors,
      outEdges: outEdges,
      inEdges: inEdges,
      edges: edges,
      outEdge: outEdge,
      inEdge: inEdge
    }
  }

  /*
   * Adds or updates an erde in the graph with the given head and tail node
   * ids. This function optionally taks an object that will be used as
   * attributes for the edge.
   *
   * If the edge already exists in the graph the supplied attributes will be
   * merged with the edge's attributes. Where there are overlapping keys, the
   * new attribute will replace the current attribute.
   */
  function addEdge(tailId, headId, attrs) {
    var id = _edgeId(tailId, headId);
    if (!(id in _edges)) {
      _edges[id] = {
        tailId: tailId,
        headId: headId,
        attrs: {}
      };
      _nodes[tailId].successors[headId] = true;
      _nodes[headId].predecessors[tailId] = true;
    }
    if (attrs) {
      _mergeAttributes(attrs, _edges[id].attrs);
    }
    return _edgeById(id);
  }

  function removeEdge(tailId, headId) {
    var id = _edgeId(tailId, headId);
    var edge = _edges[id];
    if (edge) {
      delete _edges[id];
      delete _nodes[tailId].successors[headId];
      delete _nodes[headId].predecessors[tailId];
      return true;
    }
    return false;
  }

  function edge(tail, head) {
    var tailId = tail.id ? tail.id() : tail;
    var headId = head.id ? head.id() : head;
    var id = _edgeId(tailId, headId);
    return _edgeById(id);
  }

  function nodes() {
    return Object.keys(_nodes).map(function(id) { return node(id); });
  }

  function edges() {
    return Object.keys(_edges).map(function(id) { return _edgeById(id); });
  }

  function copy() {
    var g = dagre.graph.create();
    nodes().forEach(function(u) {
      g.addNode(u.id(), u.attrs);
    });
    edges().forEach(function(e) {
      g.addEdge(e.tail().id(), e.head().id(), e.attrs);
    });
    return g;
  }

  function _edgeById(id) {
    var e = _edges[id];
 
    if (e) {
      return {
        id:    function() { return id; },
        tail:  function() { return node(e.tailId); },
        head:  function() { return node(e.headId); },
        attrs: e.attrs
      };
    } else {
      return null;
    }
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

  var _attrs = {};
  var _nodes = {};
  var _edges = {};

  // Public API is defined here
  return {
    attrs: attrs,
    addNode: addNode,
    addNodes: addNodes,
    removeNode: removeNode,
    addEdge: addEdge,
    node: node,
    edge: edge,
    nodes: nodes,
    edges: edges,
    copy: copy
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
