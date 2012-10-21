dagre.util = {};

/*
 * Copies attributes from `src` to `dst`. If an attribute name is in both
 * `src` and `dst` then the attribute value from `src` takes precedence.
 */
function mergeAttributes(src, dst) {
  Object.keys(src).forEach(function(k) { dst[k] = src[k]; });
}

function min(values) {
  return Math.min.apply(null, values);
}

function max(values) {
  return Math.max.apply(null, values);
}

function concat(arrays) {
  return Array.prototype.concat.apply([], arrays);
}

keys = Object.keys;

/*
 * Returns an array of all values in the given object.
 */
function values(obj) {
  return Object.keys(obj).map(function(k) { return obj[k]; });
}

/*
 * Returns all components in the graph using undirected navigation.
 */
var components = dagre.util.components = function(g) {
  var results = [];
  var visited = {};

  function dfs(u, component) {
    if (!(u in visited)) {
      visited[u] = true;
      component.push(u);
      g.neighbors(u).forEach(function(v) {
        dfs(v, component);
      });
    }
  };

  g.nodes().forEach(function(u) {
    var component = [];
    dfs(u, component);
    if (component.length > 0) {
      results.push(component);
    }
  });

  return results;
};

/*
 * This algorithm uses undirected traversal to find a miminum spanning tree
 * using the supplied weight function. The algorithm is described in
 * Cormen, et al., "Introduction to Algorithms". The returned structure
 * is an array of node id to an array of adjacent nodes.
 */
var prim = dagre.util.prim = function(g, weight) {
  var result = {};
  var parent = {};
  var q = priorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.nodes().forEach(function(u) {
    q.add(u, Number.POSITIVE_INFINITY);
    result[u] = [];
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0], 0);

  var u;
  var init = false;
  while (q.size() > 0) {
    u = q.removeMin();
    if (u in parent) {
      result[u].push(parent[u]);
      result[parent[u]].push(u);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + g.toString());
    } else {
      init = true;
    }

    g.neighbors(u).forEach(function(v) {
      var pri = q.priority(v);
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parent[v] = u;
          q.decrease(v, edgeWeight);
        }
      }
    });
  }

  return result;
};
