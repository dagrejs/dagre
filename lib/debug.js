var util = require('./util');

/*
 * Renders a graph in a stringified DOT format that indicates the rank of each
 * node and the minLen of each edge.
 */
exports.dotLayering = function(g) {
  var result = 'digraph {';

  function dfs(u) {
    var children = g.children(u),
        a = g.node(u);
    if (children.length) {
      result += 'subgraph "cluster_' + escape(u) + '" {';
      result += 'label="' + escape(u) + '";';
      children.forEach(function(v) {
        dfs(v);
      });
      result += '}';
    } else {
      result += id(u) + ' [label="' + escape(u) + ', rank=' + a.rank + '"';
      if (a.dummySegment) {
        result += ', shape=diamond';
      } else if (a.rightBorderSegment) {
        result += ', shape=larrow';
      } else if (a.leftBorderSegment) {
        result += ', shape=rarrow';
      } else if (a.nestingGraphTop) {
        result += ', shape=invtriangle';
      } else if (a.nestingGraphBottom) {
        result += ', shape=triangle';
      }
      result += '];';
    }
  }

  g.children(null).forEach(dfs);

  g.eachEdge(function(e, u, v, a) {
    result += id(u) + '->' + id(v) + ' [label="' + escape(e) +', minLen=' + a.minLen + '"];';
  });

  result += '}';

  return result;
};

/*
 * Renders a graph in a stringified DOT format that indicates the ordering of
 * nodes by layer. Circles represent normal nodes. Diamons represent dummy
 * nodes. While we try to put nodes in clusters, it appears that graphviz
 * does not respect this because we're later using subgraphs for ordering nodes
 * in each layer.
 */
exports.dotOrdering = function(g) {
  var ordering = util.ordering(g.filterNodes(util.filterNonSubgraphs(g)));
  var result = 'digraph {';

  function dfs(u) {
    var children = g.children(u);
    if (children.length) {
      result += 'subgraph "cluster_' + escape(u) + '" {';
      result += 'label="' + escape(u) + '";';
      children.forEach(function(v) {
        dfs(v);
      });
      result += '}';
    } else {
      result += id(u);
      if (g.node(u).dummySegment) {
        result += ' [shape=diamond]';
      } else if (g.node(u).rightBorderSegment) {
        result += ' [shape=larrow]';
      } else if (g.node(u).leftBorderSegment) {
        result += ' [shape=rarrow]';
      } else if (g.node(u).nestingGraphTop) {
        result += ' [shape=invtriangle]';
      } else if (g.node(u).nestingGraphBottom) {
        result += ' [shape=triangle]';
      }
      result += ';';
    }
  }

  g.children(null).forEach(dfs);

  ordering.forEach(function(layer) {
    result += 'subgraph { rank=same; edge [style="invis"];';
    result += layer.map(id).join('->');
    result += '}';
  });

  g.eachEdge(function(e, u, v) {
    result += id(u) + '->' + id(v) + ';';
  });

  result += '}';

  return result;
};

/*
 * Renders a graph in a stringified DOT format that indicates the position of
 * of all of the nodes in the graph. This is best used with neato - dot does
 * not appear to respect position information.
 */
exports.dotPositioning = function(g) {
  var result = 'digraph {',
      scale = 0.1; // scale factor for graphviz

  g.eachNode(function(u, attrs) {
    if (!g.children(u).length) {
      result += id(u) + ' [pos="' + (attrs.x * scale) + ',' + (-attrs.y * scale) + '!"';
      if (attrs.dummySegment) {
        result += ', shape=diamond';
      } else if (attrs.rightBorderSegment) {
        result += ', shape=larrow';
      } else if (attrs.leftBorderSegment) {
        result += ', shape=rarrow';
      } else if (attrs.nestingGraphTop) {
        result += ', shape=invtriangle';
      } else if (attrs.nestingGraphBottom) {
        result += ', shape=triangle';
      }
      result += ', label="' + escape(u) + ' ' + attrs.x + ',' + attrs.y + '"];';
    }
  });

  g.eachEdge(function(e, u, v) {
    result += id(u) + '->' + id(v) + ' [label="' + escape(e) +'"];';
  });

  result += '}';

  return result;
};

function id(str) {
  return '"' + escape(str) + '"';
}

function escape(str) {
  return str.replace(/"/g, '\\"');
}
