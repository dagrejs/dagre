dagre.util = {};

function createSVGElement(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/*
 * Performs some of the common rendering that is used by both preLayout and
 * render.
 */
function createTextNode(node, x) {
  var fontSize = node.attrs.fontSize;
  var text = createSVGElement("text");
  text.setAttribute("font-family", node.attrs.fontName);
  text.setAttribute("font-size", fontSize);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("fill", node.attrs.fontColor);

  var firstLine = true;
  var lines = node.attrs.label.split("\n");
  lines.forEach(function(line) {
    var tspan = createSVGElement("tspan");
    tspan.textContent = line;
    if (!firstLine) {
      tspan.setAttribute("x", x || 0);
      tspan.setAttribute("dy", "1em");
    }
    text.appendChild(tspan);
    firstLine = false;
  });

  // TODO This constant yields consistently better vertical centering. I
  // suspect it is related to vertical spacing, but I don't know where to get
  // the appropriate value programmatically.
  var adjustConstant = 2;
  text.setAttribute("y", fontSize - adjustConstant - (fontSize * lines.length / 2));

  return text;
}

/*
 * If `obj` does not have a property `prop` then it is added to `obj` with the
 * default value (`def`).
 */
function defaultVal(obj, prop, def) {
  if (!(prop in obj)) {
    obj[prop] = def;
  }
}

/*
 * If `obj` has `prop` then it is coerced to a string. Otherwise it's value is
 * set to `def`.
 */
function defaultStr(obj, prop, def) {
  obj[prop] = prop in obj ? obj[prop].toString() : def;
}

/*
 * If `obj` has `prop` then it is coerced to an int. Otherwise it's value is
 * set to `def`.
 */
function defaultInt(obj, prop, def) {
  obj[prop] = prop in obj ? parseInt(obj[prop]) : def;
}

function defaultFloat(obj, prop, def) {
  obj[prop] = prop in obj ? parseFloat(obj[prop]) : def;
}

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
    if (!(u.id() in visited)) {
      visited[u.id()] = true;
      component.push(u);
      u.neighbors().forEach(function(v) {
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
  var parents = {};
  var q = priorityQueue();

  if (g.nodes().length === 0) {
    return result;
  }

  g.nodes().forEach(function(u) {
    q.add(u.id(), Number.POSITIVE_INFINITY);
  });

  // Start from arbitrary node
  q.decrease(g.nodes()[0].id(), 0);

  function addEdge(uId, vId) {
    if (!(uId in result)) {
      result[uId] = [];
    }
    result[uId].push(vId);
  }

  var uId;
  var init = false;
  while (q.size() > 0) {
    uId = q.removeMin();
    if (uId in parents) {
      addEdge(uId, parents[uId]);
      addEdge(parents[uId], uId);
    } else if (init) {
      throw new Error("Input graph is not connected:\n" + dagre.graph.write(g));
    } else {
      init = true;
    }

    var u = g.node(uId);
    u.neighbors().forEach(function(v) {
      var pri = q.priority(v.id());
      if (pri !== undefined) {
        var edgeWeight = weight(u, v);
        if (edgeWeight < pri) {
          parents[v.id()] = uId;
          q.decrease(v.id(), edgeWeight);
        }
      }
    });
  }

  return result;
};
