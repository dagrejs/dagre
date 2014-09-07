var _ = require("lodash");

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */

module.exports = {
  collectType1Conflicts: collectType1Conflicts,
  addType1Conflict: addType1Conflict,
  hasType1Conflict: hasType1Conflict,
  verticalAlignment: verticalAlignment,
  horizontalCompaction: horizontalCompaction,
  alignCoordinates: alignCoordinates,
  findSmallestWidthAlignment: findSmallestWidthAlignment,
  balance: balance
};

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
function collectType1Conflicts(g, layering) {
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
  _.each(g.nodes(), function(node) {
    var v = node.v,
        label = node.label;
    label.root = v;
    label.align = v;
  });

  _.each(layering, function(layer) {
    var prevIdx = -1;
    _.each(layer, function(v) {
      var ws = neighborFn(v);
      if (ws.length) {
        var mp = (ws.length - 1) / 2,
            vLab = g.getNode(v);
        for (var i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          var w = ws[i],
              wLab = g.getNode(w);
          if (vLab.align === v &&
              prevIdx < wLab.order &&
              !hasType1Conflict(conflicts, v, w)) {
            wLab.align = v;
            vLab.align = vLab.root = wLab.root;
            prevIdx = wLab.order;
          }
        }
      }
    });
  });
}

function horizontalCompaction(g, layering, options) {
  // We use local variables for these parameters instead of manipulating the
  // graph because it becomes more verbose to access them in a chained manner.
  var shift = {},
      sink = {},
      xs = {};

  if (!options) {
    options = {};
  }
  _.defaults(options, { nodesep: 50, edgesep: 10 });

  _.each(g.nodeIds(), function(v) {
    sink[v] = v;
    shift[v] = Number.POSITIVE_INFINITY;
  });

  _.each(g.nodes(), function(node) {
    var v = node.v;
    if (node.label.root === v) {
      placeBlock(g, layering, options, shift, sink, xs, v);
    }
  });

  _.each(g.nodes(), function(node) {
    var v = node.v,
        root = g.getNode(v).root;
    xs[v] = xs[root];
    if (shift[sink[root]] < Number.POSITIVE_INFINITY) {
      xs[v] += shift[sink[root]];
    }
  });

  return xs;
}

function placeBlock(g, layering, options, shift, sink, xs, v) {
  if (_.has(xs, v)) return;
  xs[v] = 0;

  var w = v,
      u;
  do {
    if (pos(g, w) > 0) {
      u = root(g, pred(g, layering, w));
      placeBlock(g, layering, options, shift, sink, xs, u);
      if (sink[v] === v) {
        sink[v] = sink[u];
      }

      var delta = sep(g, options, w, u);
      if (sink[v] !== sink[u]) {
        shift[sink[u]] = Math.min(shift[sink[u]], xs[v] - xs[u] - delta);
      } else {
        xs[v] = Math.max(xs[v], xs[u] + delta);
      }
    }
    w = align(g, w);
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

function sep(g, options, v, u) {
  var vLabel = g.getNode(v),
      uLabel = g.getNode(u),
      nodeSep = options.nodesep / 2,
      edgeSep = options.edgesep / 2;

  return uLabel.width / 2 +
         (uLabel.dummy ? edgeSep : nodeSep) +
         (vLabel.dummy ? edgeSep : nodeSep) +
         vLabel.width / 2;
}

function width(g, v) {
  return g.getNode(v).width;
}

function pos(g, v) {
  return g.getNode(v).order;
}

function root(g, v) {
  return g.getNode(v).root;
}

function align(g, v) {
  return g.getNode(v).align;
}

function pred(g, layering, v) {
  var vLabel = g.getNode(v);
  return layering[vLabel.rank][vLabel.order - 1];
}
