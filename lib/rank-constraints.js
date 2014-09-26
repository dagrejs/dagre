var _ = require("lodash"),
    util = require("./util");

module.exports = {
  collapse: collapse
};

function collapse(g) {
  function dfs(parent) {
    var children = g.children(parent);
    if (!children.length) {
      return;
    }
    _.each(children, dfs);

    var groups =
      _.chain(children)
       .filter(function(v) { return _.has(g.node(v), "rankconstraint"); })
       .groupBy(function(v) { return g.node(v).rankconstraint; })
       .value();

    _.each(groups, function(group, name) {
      if (name[0] !== "$" || _.contains(["$min", "$max"], name)) {
        var v = util.addDummyNode(g, "collapsed", { orig: group }, "_collapsed");
        g.setParent(v, parent);
        _.each(group, function(w) {
          redirectInEdges(g, v, w, name === "$min");
          redirectOutEdges(g, v, w, name === "$max");
          g.removeNode(w);
        });
      }
    });
  }
  dfs();
}

function redirectInEdges(g, dest, src, reverse) {
  _.each(g.inEdges(src), function(e) {
    var edge = g.edge(e),
        v = e.v,
        w = dest;
    if (reverse) {
      v = dest;
      w = e.v;
    }
    addCollapsedEdge(g, v, w, e.name, e, edge, reverse);
  });
}

function redirectOutEdges(g, dest, src, reverse) {
  _.each(g.outEdges(src), function(e) {
    var edge = g.edge(e),
        v = dest,
        w = e.w;
    if (reverse) {
      v = e.w;
      w = dest;
    }
    addCollapsedEdge(g, v, w, e.name, e, edge, reverse);
  });
}

function addCollapsedEdge(g, v, w, name, e, edge, reverse) {
  var prevEdge = g.edge(v, w, name);
  if (prevEdge) {
    prevEdge.edges.push({ e: e, edge: edge });
    prevEdge.weight += edge.weight;
    prevEdge.minlen = Math.max(prevEdge.minlen, edge.minlen);
  } else {
    var newEdge =  {
      edges: [{ e: e, edge: edge }],
      weight: edge.weight,
      minlen: edge.minlen
    };
    if (reverse) {
      newEdge.reversed = true;
    }
    g.setEdge(v, w, newEdge, e.name);
  }
}
