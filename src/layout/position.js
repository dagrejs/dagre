/*
Copyright (c) 2012-2013 Chris Pettitt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var util = require("./lib/util");

/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
dagre.layout.position = function() {
  // External configuration
  var config = {
    nodeSep: 50,
    edgeSep: 10,
    universalSep: null,
    rankSep: 30,
    rankDir: "TB",
    debugLevel: 0
  };

  var timer = util.createTimer();

  var self = {};

  self.nodeSep = util.propertyAccessor(self, config, "nodeSep");
  self.edgeSep = util.propertyAccessor(self, config, "edgeSep");
  // If not null this separation value is used for all nodes and edges
  // regardless of their widths. `nodeSep` and `edgeSep` are ignored with this
  // option.
  self.universalSep = util.propertyAccessor(self, config, "universalSep");
  self.rankSep = util.propertyAccessor(self, config, "rankSep");
  self.rankDir = util.propertyAccessor(self, config, "rankDir");
  self.debugLevel = util.propertyAccessor(self, config, "debugLevel", function(x) {
    timer.enabled(x);
  });

  self.run = timer.wrap("Position Phase", run);

  return self;

  function run(g) {
    var layering = [];
    g.eachNode(function(u, node) {
      var layer = layering[node.rank] || (layering[node.rank] = []);
      layer[node.order] = u;
    });

    var conflicts = findConflicts(g, layering);

    var xss = {};
    ["u", "d"].forEach(function(vertDir) {
      if (vertDir === "d") layering.reverse();

      ["l", "r"].forEach(function(horizDir) {
        if (horizDir === "r") reverseInnerOrder(layering);

        var dir = vertDir + horizDir;
        var align = verticalAlignment(g, layering, conflicts, vertDir === "u" ? "predecessors" : "successors");
        xss[dir]= horizontalCompaction(g, layering, align.pos, align.root, align.align);

        if (config.debugLevel >= 3)
          debugPositioning(vertDir + horizDir, g, layering, xss[dir]);

        if (horizDir === "r") flipHorizontally(xss[dir]);

        if (horizDir === "r") reverseInnerOrder(layering);
      });

      if (vertDir === "d") layering.reverse();
    });

    balance(g, layering, xss);
    g.eachNode(function(v) {
      var xs = [];
      for (var alignment in xss) {
        xDebug(alignment, g, v, xss[alignment][v]);
        xs.push(xss[alignment][v]);
      }
      xs.sort(function(x, y) { return x - y; });
      x(g, v, (xs[1] + xs[2]) / 2);
    });

    // Translate layout so left edge of bounding rectangle has coordinate 0
    var minX = util.min(g.nodes().map(function(u) { return x(g, u) - width(g, u) / 2; }));
    g.eachNode(function(u) { x(g, u, x(g, u) - minX); });

    // Align y coordinates with ranks
    var posY = 0;
    layering.forEach(function(layer) {
      var maxHeight = util.max(layer.map(function(u) { return height(g, u); }));
      posY += maxHeight / 2;
      layer.forEach(function(u) { y(g, u, posY); });
      posY += maxHeight / 2 + config.rankSep;
    });
  };

  /*
   * Generate an ID that can be used to represent any undirected edge that is
   * incident on `u` and `v`.
   */
  function undirEdgeId(u, v) {
    return u < v
      ? u.toString().length + ":" + u + "-" + v
      : v.toString().length + ":" + v + "-" + u;
  }

  function findConflicts(g, layering) {
    var conflicts = {}, // Set of conflicting edge ids
        pos = {};       // Position of node in its layer

    if (layering.length <= 2) return conflicts;

    layering[1].forEach(function(u, i) { pos[u] = i; });
    for (var i = 1; i < layering.length - 1; ++i) {
      var prevLayer = layering[i];
      var currLayer = layering[i+1];
      var k0 = 0; // Position of the last inner segment in the previous layer
      var l = 0;  // Current position in the current layer (for iteration up to `l1`)

      // Scan current layer for next node that is incident to an inner segement
      // between layering[i+1] and layering[i].
      for (var l1 = 0; l1 < currLayer.length; ++l1) {
        var u = currLayer[l1]; // Next inner segment in the current layer or
                               // last node in the current layer
        pos[u] = l1;

        var k1 = undefined; // Position of the next inner segment in the previous layer or
                            // the position of the last element in the previous layer
        if (g.node(u).dummy) {
          var uPred = g.predecessors(u)[0];
          if (g.node(uPred).dummy)
            k1 = pos[uPred];
        }
        if (k1 === undefined && l1 === currLayer.length - 1)
          k1 = prevLayer.length - 1;

        if (k1 !== undefined) {
          for (; l <= l1; ++l) {
            g.predecessors(currLayer[l]).forEach(function(v) {
              var k = pos[v];
              if (k < k0 || k > k1)
                conflicts[undirEdgeId(currLayer[l], v)] = true;
            });
          }
          k0 = k1;
        }
      }
    }

    return conflicts;
  }

  function verticalAlignment(g, layering, conflicts, relationship) {
    var pos = {},   // Position for a node in its layer
        root = {},  // Root of the block that the node participates in
        align = {}; // Points to the next node in the block or, if the last
                    // element in the block, points to the first block's root

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        root[u] = u;
        align[u] = u;
        pos[u] = i;
      });
    });

    layering.forEach(function(layer) {
      var prevIdx = -1;
      layer.forEach(function(v) {
        var related = g[relationship](v), // Adjacent nodes from the previous layer
            mid;                          // The mid point in the related array

        if (related.length > 0) {
          related.sort(function(x, y) { return pos[x] - pos[y]; });
          mid = (related.length - 1) / 2;
          related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function(u) {
            if (align[v] === v) {
              if (!conflicts[undirEdgeId(u, v)] && prevIdx < pos[u]) {
                align[u] = v;
                align[v] = root[v] = root[u];
                prevIdx = pos[u];
              }
            }
          });
        }
      });
    });

    return { pos: pos, root: root, align: align };
  }

  // This function deviates from the standard BK algorithm in two ways. First
  // it takes into account the size of the nodes. Second it includes a fix to
  // the original algorithm that is described in Carstens, "Node and Label
  // Placement in a Layered Layout Algorithm".
  function horizontalCompaction(g, layering, pos, root, align) {
    var sink = {},       // Mapping of node id -> sink node id for class
        maybeShift = {}, // Mapping of sink node id -> { class node id, min shift }
        shift = {},      // Mapping of sink node id -> shift
        pred = {},       // Mapping of node id -> predecessor node (or null)
        xs = {};         // Calculated X positions

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        sink[u] = u;
        maybeShift[u] = {};
        if (i > 0)
          pred[u] = layer[i - 1];
      });
    });

    function updateShift(toShift, neighbor, delta) {
      if (!(neighbor in maybeShift[toShift])) {
        maybeShift[toShift][neighbor] = delta;
      } else {
        maybeShift[toShift][neighbor] = Math.min(maybeShift[toShift][neighbor], delta);
      }
    }

    function placeBlock(v) {
      if (!(v in xs)) {
        xs[v] = 0;
        var w = v;
        do {
          if (pos[w] > 0) {
            var u = root[pred[w]];
            placeBlock(u);
            if (sink[v] === v) {
              sink[v] = sink[u];
            }
            var delta = sep(g, pred[w]) + sep(g, w);
            if (sink[v] !== sink[u]) {
              updateShift(sink[u], sink[v], xs[v] - xs[u] - delta);
            } else {
              xs[v] = Math.max(xs[v], xs[u] + delta);
            }
          }
          w = align[w];
        } while (w !== v);
      }
    }

    // Root coordinates relative to sink
    util.values(root).forEach(function(v) {
      placeBlock(v);
    });

    // Absolute coordinates
    // There is an assumption here that we've resolved shifts for any classes
    // that begin at an earlier layer. We guarantee this by visiting layers in
    // order.
    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] = xs[root[v]];
        if (v === root[v] && v === sink[v]) {
          var minShift = 0;
          if (v in maybeShift && Object.keys(maybeShift[v]).length > 0) {
            minShift = util.min(Object.keys(maybeShift[v])
                                 .map(function(u) {
                                      return maybeShift[v][u] + (u in shift ? shift[u] : 0);
                                      }
                                 ));
          }
          shift[v] = minShift;
        }
      });
    });

    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] += shift[sink[root[v]]] || 0;
      });
    });

    return xs;
  }

  function findMinCoord(g, layering, xs) {
    return util.min(layering.map(function(layer) {
      var u = layer[0];
      return xs[u];
    }));
  }

  function findMaxCoord(g, layering, xs) {
    return util.max(layering.map(function(layer) {
      var u = layer[layer.length - 1];
      return xs[u];
    }));
  }

  function balance(g, layering, xss) {
    var min = {},                            // Min coordinate for the alignment
        max = {},                            // Max coordinate for the alginment
        smallestAlignment,
        shift = {};                          // Amount to shift a given alignment

    var smallest = Number.POSITIVE_INFINITY;
    for (var alignment in xss) {
      var xs = xss[alignment];
      min[alignment] = findMinCoord(g, layering, xs);
      max[alignment] = findMaxCoord(g, layering, xs);
      var w = max[alignment] - min[alignment];
      if (w < smallest) {
        smallest = w;
        smallestAlignment = alignment;
      }
    }

    // Determine how much to adjust positioning for each alignment
    ["u", "d"].forEach(function(vertDir) {
      ["l", "r"].forEach(function(horizDir) {
        var alignment = vertDir + horizDir;
        shift[alignment] = horizDir === "l"
            ? min[smallestAlignment] - min[alignment]
            : max[smallestAlignment] - max[alignment];
      });
    });

    // Find average of medians for xss array
    for (var alignment in xss) {
      g.eachNode(function(v) {
        xss[alignment][v] += shift[alignment];
      });
    }
  }

  function flipHorizontally(xs) {
    for (var u in xs) {
      xs[u] = -xs[u];
    }
  }

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }

  function width(g, u) {
    switch (config.rankDir) {
      case "LR": return g.node(u).height;
      default:   return g.node(u).width;
    }
  }

  function height(g, u) {
    switch(config.rankDir) {
      case "LR": return g.node(u).width;
      default:   return g.node(u).height;
    }
  }

  function sep(g, u) {
    if (config.universalSep !== null) {
      return config.universalSep;
    }
    var w = width(g, u);
    var s = g.node(u).dummy ? config.edgeSep : config.nodeSep;
    return (w + s) / 2;
  }

  function x(g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = x;
        }
    }
  }

  function xDebug(name, g, u, x) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u)[name];
        } else {
          g.node(u)[name] = x;
        }
    }
  }

  function y(g, u, y) {
    switch (config.rankDir) {
      case "LR":
        if (arguments.length < 3) {
          return g.node(u).x;
        } else {
          g.node(u).x = y;
        }
        break;
      default:
        if (arguments.length < 3) {
          return g.node(u).y;
        } else {
          g.node(u).y = y;
        }
    }
  }

  function debugPositioning(align, g, layering, xs) {
    layering.forEach(function(l, li) {
      var u, xU;
      l.forEach(function(v) {
        var xV = xs[v];
        if (u) {
          var s = sep(g, u) + sep(g, v);
          if (xV - xU < s)
            console.log("Position phase: sep violation. Align: " + align + ". Layer: " + li + ". " +
              "U: " + u + " V: " + v + ". Actual sep: " + (xV - xU) + " Expected sep: " + s);
        }
        u = v;
        xU = xV;
      });
    });
  }
};
