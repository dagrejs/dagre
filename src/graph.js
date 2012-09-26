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
   * node updated in the graph then this function returns `false`.
   */
  function addNode(id, attrs) {
    var created = false;
    if (!(id in _nodes)) {
      created = true;
      _nodes[id] = {
        id: id,
        attrs: {}
      };
    }
    if (arguments.length > 1) {
      _mergeAttrs(attrs, _nodes[id].attrs);
    }
    return created;
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

    return {
      id: id,
      attrs: u.attrs
    }
  }

  /*
   * Copies attributes from `src` to `dst`. If an attribute name is in both
   * `src` and `dst` then the attribute value from `src` takes precedence.
   */
  function _mergeAttrs(src, dst) {
    Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
  }

  _attrs = {};
  _nodes = {};

  // Public API is defined here
  return {
    attrs: attrs,
    addNode: addNode,
    node: node
  };
}
