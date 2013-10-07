var util = require('./util');

module.exports = addBorderSegments;

/*
 * An function that takes a compound directed graph that has already been
 * ordered and updates it with nodes that border the left and right of each
 * subgraph. This ensures that a rectangle can be draw around each subgraph
 * without including non-subgraph nodes.
 *
 * Assumes that the input graph is ordered such that nodes in a subgraph are
 * contiguous.
 *
 * For a more detailed description of the function of this algorithm, please
 * see Sander, "Layout of Compound Directed Graphs", Section 7.
 */
function addBorderSegments(g) {
  g.eachNode(function(u, value) {
    if (g.children(u).length) {
      value.leftBorderSegments = [];
      value.rightBorderSegments = [];
    }
  });

  var ordering = util.ordering(g);
  ordering.forEach(function(layer, rank) {
    var nextOrder = 0,
        stack = [null],         // stack of visited subgraphs
        visited = {null: true}; // map of visited subgraphs

    function unwindStack(u) {
      while ((curr = stack[stack.length - 1]) !== u) {
        stack.pop();
        delete visited[curr];
        v = g.addNode(null, {
          rank: rank,
          order: nextOrder++,
        });
        g.parent(v, curr);
        g.node(curr).rightBorderSegments[rank] = v;
      }
    }

    for (var i = 0, il = layer.length; i < il; ++i, ++nextOrder) {
      var u = layer[i],
          parent = g.parent(u),
          path = pathFromLCA(g, parent, visited),
          curr;

      // First unwind the stack if necessary, adding right border segments along
      // the way.
      unwindStack(path[0]);

      // Next append to the stack as needed, adding left border segments along
      // the way.
      for (var j = 1, jl = path.length; j < jl; ++j) {
        curr = path[j];
        stack.push(curr);
        visited[curr] = true;
        v = g.addNode(null, {
          rank: rank,
          order: nextOrder++,
        });
        g.parent(v, curr);
        g.node(curr).leftBorderSegments[rank] = v;
      }

      g.node(u).order = nextOrder;
    }

    // Unwind to the root of the graph
    unwindStack(null);
  });
}

/*
 * Given a subgraph and a map of nodes in the stack, this function returns the
 * path from the lowest common ancestor to sg.
 */
function pathFromLCA(g, sg, visited) {
  var path = [];

  while (!(sg in visited)) {
    path.push(sg);
    sg = g.parent(sg);
  }
  path.push(sg);

  return path.reverse();
}
