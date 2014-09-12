var _ = require("lodash"),
    util = require("../util");

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

module.exports = {
  positionX: positionX,
  findType1Conflicts: findType1Conflicts,
  addType1Conflict: addType1Conflict,
  hasType1Conflict: hasType1Conflict,
  verticalAlignment: verticalAlignment,
  horizontalCompaction: horizontalCompaction,
  alignCoordinates: alignCoordinates,
  findSmallestWidthAlignment: findSmallestWidthAlignment,
  balance: balance
};

var DEFAULT_NODE_SEP = 50,
    DEFAULT_EDGE_SEP = 10;

/*
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 */
function findType1Conflicts(g, layering) {
  var conflicts = {};

  function visitLayer(prevLayer, layer) {
    var
      // last visited node in the previous layer that is incident on an inner
      // segment.
      k0 = 0,
      // Tracks the last node in this layer scanned for crossings with a type-1
      // segment.
      scanPos = 0,
      prevLayerLength = prevLayer.length,
      lastNode = _.last(layer);

    _.each(layer, function(v, i) {
      var w = findOtherInnerSegmentNode(g, v),
          k1 = w ? g.getNode(w).order : prevLayerLength;

      if (w || v === lastNode) {
        _.each(layer.slice(scanPos, i +1), function(scanNode) {
          _.each(g.predecessors(scanNode), function(u) {
            var uLabel = g.getNode(u),
                uPos = uLabel.order;
            if ((uPos < k0 || k1 < uPos) &&
                !(uLabel.dummy && g.getNode(scanNode).dummy)) {
              addType1Conflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  }

  _.reduce(layering, visitLayer);
  return conflicts;
}

function findOtherInnerSegmentNode(g, v) {
  if (g.getNode(v).dummy) {
    return _.find(g.predecessors(v), function(u) {
      return g.getNode(u).dummy;
    });
  }
}

function addType1Conflict(conflicts, v, w) {
  if (v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }

  var conflictsV = conflicts[v];
  if (!conflictsV) {
    conflicts[v] = conflictsV = {};
  }
  conflictsV[w] = true;
}

function hasType1Conflict(conflicts, v, w) {
  if (v > w) {
    var tmp = v;
    v = w;
    w = tmp;
  }
  return _.has(conflicts[v], w);
}

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
function verticalAlignment(g, layering, conflicts, neighborFn) {
  var root = {},
      align = {},
      pos = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  _.each(layering, function(layer) {
    _.each(layer, function(v, order) {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  _.each(layering, function(layer) {
    var prevIdx = -1;
    _.each(layer, function(v) {
      var ws = neighborFn(v);
      if (ws.length) {
        ws = _.sortBy(ws, function(w) { return pos[w]; });
        var mp = (ws.length - 1) / 2;
        for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          var w = ws[i];
          if (align[v] === v &&
              prevIdx < pos[w] &&
              !hasType1Conflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });

  return { root: root, align: align };
}

function horizontalCompaction(g, layering, root, align) {
  // We use local variables for these parameters instead of manipulating the
  // graph because it becomes more verbose to access them in a chained manner.
  var shift = {},
      sink = {},
      xs = {},
      pred = {},
      graphLabel = g.getGraph(),
      sepFn = sep(_.has(graphLabel, "nodesep") ? graphLabel.nodesep : DEFAULT_NODE_SEP,
                  _.has(graphLabel, "edgesep") ? graphLabel.edgesep : DEFAULT_EDGE_SEP);

  _.each(layering, function(layer) {
    _.each(layer, function(v, order) {
      sink[v] = v;
      shift[v] = Number.POSITIVE_INFINITY;
      pred[v] = layer[order - 1];
    });
  });

  _.each(g.nodes(), function(v) {
    if (root[v] === v) {
      placeBlock(g, layering, sepFn, root, align, shift, sink, pred, xs, v);
    }
  });

  _.each(g.nodes(), function(v) {
    xs[v] = xs[root[v]];
    if (shift[sink[root[v]]] < Number.POSITIVE_INFINITY) {
      xs[v] += shift[sink[root[v]]];
    }
  });

  return xs;
}

function placeBlock(g, layering, sepFn, root, align, shift, sink, pred, xs, v) {
  if (_.has(xs, v)) return;
  xs[v] = 0;

  var w = v,
      u;
  do {
    if (pred[w]) {
      u = root[pred[w]];
      placeBlock(g, layering, sepFn, root, align, shift, sink, pred, xs, u);
      if (sink[v] === v) {
        sink[v] = sink[u];
      }

      var delta = sepFn(g, w, pred[w]);
      if (sink[v] !== sink[u]) {
        shift[sink[u]] = Math.min(shift[sink[u]], xs[v] - xs[u] - delta);
      } else {
        xs[v] = Math.max(xs[v], xs[u] + delta);
      }
    }
    w = align[w];
  } while (w !== v);
}

/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
function findSmallestWidthAlignment(g, xss) {
  return _.min(xss, function(xs) {
    var min = _.min(xs, function(x, v) { return x - width(g, v) / 2; }),
        max = _.max(xs, function(x, v) { return x + width(g, v) / 2; });
    return max - min;
  });
}

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
function alignCoordinates(xss, alignTo) {
  var alignToMin = _.min(alignTo),
      alignToMax = _.max(alignTo);

  _.each(["u", "d"], function(vert) {
    _.each(["l", "r"], function(horiz) {
      var alignment = vert + horiz,
          xs = xss[alignment],
          delta;
      if (xs === alignTo) return;

      delta = horiz === "l" ? alignToMin - _.min(xs) : alignToMax - _.max(xs);

      if (delta) {
        xss[alignment] = _.mapValues(xs, function(x) { return x + delta; });
      }
    });
  });
}

function balance(xss) {
  return _.mapValues(xss.ul, function(ignore, v) {
    var xs = _.sortBy(_.pluck(xss, v));
    return (xs[1] + xs[2]) / 2;
  });
}

function positionX(g) {
  var layering = util.buildLayerMatrix(g),
      conflicts = findType1Conflicts(g, layering);

  var xss = {},
      adjustedLayering;
  _.each(["u", "d"], function(vert) {
    adjustedLayering = vert === "u" ? layering : _.values(layering).reverse();
    _.each(["l", "r"], function(horiz) {
      if (horiz === "r") {
        adjustedLayering = _.map(adjustedLayering, function(inner) {
          return _.values(inner).reverse();
        });
      }

      var neighborFn = vert === "u" ? g.predecessors.bind(g) : g.successors.bind(g);
      var align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      var xs = horizontalCompaction(g, adjustedLayering, align.root, align.align);
      if (horiz === "r") {
        xs = _.mapValues(xs, function(x) { return -x; });
      }
      xss[vert + horiz] = xs;
    });
  });

  var smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss);
}

function sep(nodeSep, edgeSep) {
  return function(g, v, u) {
    var vLabel = g.getNode(v),
        uLabel = g.getNode(u),
        sums = uLabel.width +
           (uLabel.dummy ? edgeSep : nodeSep) +
           (vLabel.dummy ? edgeSep : nodeSep) +
           vLabel.width;
    return sums / 2;
  };
}

function width(g, v) {
  return g.getNode(v).width;
}
