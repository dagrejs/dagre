var util = require("./util"),
    Set = require("./data/set");

module.exports = Graph;

function Graph() {
  /* Map of nodeId -> {id, value} */
  this._nodes = {};

  /* Map of sourceId -> {targetId -> {count, edgeId -> true}} */
  this._inEdges = {};

  /* Map of targetId -> {sourceId -> {count, edgeId -> true}} */
  this._outEdges = {};

  /* Map of edgeId -> {id, source, target, value} */
  this._edges = {};

  /* Used to generate anonymous edge ids */
  this._nextEdgeId = 0;
}

Graph.prototype.addNode = function(u, value) {
  if (this.hasNode(u)) {
    throw new Error("Graph already has node '" + u + "':\n" + this.toString());
  }
  this._nodes[u] = { id: u, value: value };
  this._inEdges[u] = {};
  this._outEdges[u] = {};
};

Graph.prototype.delNode = function(u) {
  this._strictGetNode(u);

  var self = this;
  this.edges(u).forEach(function(e) { self.delEdge(e); });

  delete this._inEdges[u];
  delete this._outEdges[u];
  delete this._nodes[u];
};

Graph.prototype.node = function(u) {
  return this._strictGetNode(u).value;
};

Graph.prototype.hasNode = function(u) {
  return u in this._nodes;
};

Graph.prototype.addEdge = function(e, source, target, value) {
  this._strictGetNode(source);
  this._strictGetNode(target);

  if (e === null) {
    e = "_ANON-" + (++this._nextEdgeId);
  }
  else if (this.hasEdge(e)) {
    throw new Error("Graph already has edge '" + e + "':\n" + this.toString());
  }

  this._edges[e] = { id: e, source: source, target: target, value: value };
  addEdgeToMap(this._inEdges[target], source, e);
  addEdgeToMap(this._outEdges[source], target, e);
};

Graph.prototype.delEdge = function(e) {
  var edge = this._strictGetEdge(e);
  delEdgeFromMap(this._inEdges[edge.target], edge.source, e);
  delEdgeFromMap(this._outEdges[edge.source], edge.target, e);
  delete this._edges[e];
};

Graph.prototype.edge = function(e) {
  return this._strictGetEdge(e).value;
};

Graph.prototype.source = function(e) {
  return this._strictGetEdge(e).source;
};

Graph.prototype.target = function(e) {
  return this._strictGetEdge(e).target;
};

Graph.prototype.hasEdge = function(e) {
  return e in this._edges;
};

Graph.prototype.successors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._outEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

Graph.prototype.predecessors = function(u) {
  this._strictGetNode(u);
  return Object.keys(this._inEdges[u])
               .map(function(v) { return this._nodes[v].id; }, this);
};

Graph.prototype.neighbors = function(u) {
  this._strictGetNode(u);
  var vs = {};

  Object.keys(this._outEdges[u])
        .map(function(v) { vs[v] = true; });

  Object.keys(this._inEdges[u])
        .map(function(v) { vs[v] = true; });

  return Object.keys(vs)
               .map(function(v) { return this._nodes[v].id; }, this);
};

Graph.prototype.nodes = function() {
  var nodes = [];
  this.eachNode(function(id, _) { nodes.push(id); });
  return nodes;
};

Graph.prototype.eachNode = function(func) {
  for (var k in this._nodes) {
    var node = this._nodes[k];
    func(node.id, node.value);
  }
};

/*
 * Return all edges with no arguments,
 * the ones that are incident on a node (one argument),
 * or all edges from a source to a target (two arguments)
 */
Graph.prototype.edges = function(u, v) {
  var es, sourceEdges;
  if (!arguments.length) {
    es = [];
    this.eachEdge(function(id) { es.push(id); });
    return es;
  } else if (arguments.length === 1) {
    return util.union([this.inEdges(u), this.outEdges(u)]);
  } else if (arguments.length === 2) {
    this._strictGetNode(u);
    this._strictGetNode(v);
    sourceEdges = this._outEdges[u];
    es = (v in sourceEdges) ? Object.keys(sourceEdges[v].edges) : [];
    return es.map(function(e) { return this._edges[e].id; }, this);
  }
};

Graph.prototype.eachEdge = function(func) {
  for (var k in this._edges) {
    var edge = this._edges[k];
    func(edge.id, edge.source, edge.target, edge.value);
  }
};

/*
 * Return all in edges to a target node
 */
Graph.prototype.inEdges = function(target) {
  this._strictGetNode(target);
  return util.concat(util.values(this._inEdges[target])
             .map(function(es) { return Object.keys(es.edges); }, this));
};

/*
 * Return all out edges from a source node
 */
Graph.prototype.outEdges = function(source) {
  this._strictGetNode(source);
  return util.concat(util.values(this._outEdges[source])
             .map(function(es) { return Object.keys(es.edges); }, this));
};

Graph.prototype.subgraph = function(us) {
  var g = new Graph();
  var self = this;

  us.forEach(function(u) { g.addNode(u, self.node(u)); });
  util.values(this._edges).forEach(function(e) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.addEdge(e.id, e.source, e.target, self.edge(e.id));
    }
  });

  return g;
};

Graph.prototype.toString = function() {
  var str = "GRAPH:\n";

  str += "    Nodes:\n";
  Object.keys(this._nodes)
        .forEach(function(u) {
          str += "        " + u + ": " + JSON.stringify(nodes[u].value) + "\n";
        });

  str += "    Edges:\n";
  Object.keys(this._edges)
        .forEach(function(e) {
          var edge = edges[e];
          str += "        " + e + " (" + edge.source + " -> " + edge.target + "): " + JSON.stringify(edges[e].value) + "\n";
        });

  return str;
};

Graph.prototype._strictGetNode = function(u) {
  var node = this._nodes[u];
  if (node === undefined) {
    throw new Error("Node '" + u + "' is not in graph:\n" + this.toString());
  }
  return node;
};

Graph.prototype._strictGetEdge = function(e) {
  var edge = this._edges[e];
  if (edge === undefined) {
    throw new Error("Edge '" + e + "' is not in graph:\n" + this.toString());
  }
  return edge;
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
  if (--vEntry.count === 0) {
    delete map[v];
  } else {
    delete vEntry.edges[e];
  }
}
