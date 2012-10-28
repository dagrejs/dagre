/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
dagre.layout.position = function() {
  // External configuration
  var
    nodeSep = 50,
    edgeSep = 10,
    rankSep = 30,
    direction = null,
    // Level 1: log time spent
    debugLevel = 0;

  var self = {};

  self.nodeSep = function(x) {
    if (!arguments.length) return nodeSep;
    nodeSep = x;
    return self;
  };

  self.edgeSep = function(x) {
    if (!arguments.length) return edgeSep;
    edgeSep = x;
    return self;
  };

  self.rankSep = function(x) {
    if (!arguments.length) return rankSep;
    rankSep = x;
    return self;
  };

  self.direction = function(x) {
    if (!arguments.length) return direction;
    direction = x;
    return self;
  };

  self.debugLevel = function(x) {
    if (!arguments.length) return debugLevel;
    debugLevel = x;
    return self;
  };

  self.run = function(g, nodeMap) {
    var timer = createTimer();

    var layering = [];
    keys(nodeMap).forEach(function(u) {
      var node = nodeMap[u];
      var layer = layering[node.rank] || (layering[node.rank] = []);
      layer[node.order] = u;
    });

    var type1Conflicts = findType1Conflicts(g, layering, nodeMap);

    var xss = {};
    ["up", "down"].forEach(function(vertDir) {
      if (vertDir === "down") { layering.reverse(); }

      ["left", "right"].forEach(function(horizDir) {
        if (horizDir === "right") { reverseInnerOrder(layering); }

        var dir = vertDir + "-" + horizDir;
        if (!direction || direction === dir) {
          var align = verticalAlignment(g, layering, type1Conflicts, vertDir === "up" ? "predecessors" : "successors");
          xss[dir]= horizontalCompaction(layering, nodeMap, align.pos, align.root, align.align, nodeSep, edgeSep);
          if (horizDir === "right") { flipHorizontally(layering, xss[dir]); }
        }

        if (horizDir === "right") { reverseInnerOrder(layering); }
      });

      if (vertDir === "down") { layering.reverse(); }
    });

    if (direction) {
      // In debug mode we allow forcing layout to a particular alignment.
      g.nodes().forEach(function(u) {
        nodeMap[u].x = xss[direction][u];
      });
    } else {
      alignToSmallest(layering, xss, nodeMap);

      // Find average of medians for xss array
      g.nodes().forEach(function(u) {
        var xs = values(xss).map(function(xs) { return xs[u]; }).sort(function(x, y) { return x - y; });
        nodeMap[u].x = (xs[1] + xs[2]) / 2;
      });
    }

    // Align min center point with 0
    var minX = min(g.nodes().map(function(u) { return nodeMap[u].x - nodeMap[u].width / 2; }));
    g.nodes().forEach(function(u) {
      nodeMap[u].x -= minX;
    });

    // Align y coordinates with ranks
    var posY = 0;
    layering.forEach(function(layer) {
      var height = max(layer.map(function(u) { return nodeMap[u].height; }));
      posY += height / 2;
      layer.forEach(function(u) {
        nodeMap[u].y = posY;
      });
      posY += height / 2 + rankSep;
    });

    if (debugLevel >= 1) {
      console.log("Position phase time: " + timer.elapsedString());
    }
  };

  return self;

  function findType1Conflicts(g, layering, nodeMap) {
    var type1Conflicts = {};

    var pos = {};
    layering[0].forEach(function(u, i) {
      pos[u] = i;
    });

    for (var i = 1; i < layering.length; ++i) {
      var layer = layering[i];

      // Position of last inner segment in the previous layer
      var innerLeft = 0;
      var currIdx = 0;

      // Scan current layer for next node with an inner segment.
      for (var j = 0; j < layer.length; ++j) {
        var u = layer[j];
        // Update positions map for next layer iteration
        pos[u] = j;

        // Search for the next inner segment in the previous layer
        var innerRight = null;
        if (nodeMap[u].dummy) {
          g.predecessors(u).some(function(v) {
            if (nodeMap[v].dummy) {
              innerRight = pos[v];
              return true;
            }
            return false;
          });
        }

        // If no inner segment but at the end of the list we still
        // need to check for type 1 conflicts with earlier segments
        if (innerRight === null && j === layer.length - 1) {
          innerRight = layering[i-1].length - 1;
        }

        if (innerRight !== null) {
          for (;currIdx <= j; ++currIdx) {
            var v = layer[currIdx];
            g.inEdges(v).forEach(function(e) {
              var sourcePos = pos[g.source(e)];
              if (sourcePos < innerLeft || sourcePos > innerRight) {
                type1Conflicts[e] = true;
              }
            });
          }
          innerLeft = innerRight;
        }
      }
    }

    return type1Conflicts;
  }

  function verticalAlignment(g, layering, type1Conflicts, relationship) {
    var pos = {};
    var root = {};
    var align = {};

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
        var related = g[relationship](v);
        if (related.length > 0) {
          // TODO could find medians with linear algorithm if performance warrants it.
          related.sort(function(x, y) { return pos[x] - pos[y]; });
          var mid = (related.length - 1) / 2;
          related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function(u) {
            if (align[v] === v) {
              // TODO should we collapse multi-edges for vertical alignment?
              
              // Only need to check first returned edge for a type 1 conflict
              if (!type1Conflicts[concat([g.edges(v, u), g.edges(u, v)])[0]] && prevIdx < pos[u]) {
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

  /*
   * Determines how much spacing u needs from its origin (center) to satisfy
   * width and node separation.
   */
  function deltaX(u, nodeSep, edgeSep) {
    var sep = u.dummy ? edgeSep : nodeSep;
    return u.width / 2 + sep / 2;
  }

  function horizontalCompaction(layering, nodeMap, pos, root, align, nodeSep, edgeSep) {
    // Mapping of node id -> sink node id for class
    var sink = {};

    // Mapping of sink node id -> x delta
    var shift = {};

    // Mapping of node id -> predecessor node (or null)
    var pred = {};

    // Calculated X positions
    var xs = {};

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        sink[u] = u;
        pred[u] = i > 0 ? layer[i - 1] : null;
      });
    });

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
            var delta = deltaX(nodeMap[pred[w]], nodeSep, edgeSep) +
                        deltaX(nodeMap[w], nodeSep, edgeSep);
            if (sink[v] !== sink[u]) {
              shift[sink[u]] = Math.min(shift[sink[u]] || Number.POSITIVE_INFINITY, xs[v] - xs[u] - delta);
            } else {
              xs[v] = Math.max(xs[v], xs[u] + delta);
            }
          }
          w = align[w];
        } while (w !== v);
      }
    }

    // Root coordinates relative to sink
    values(root).forEach(function(v) {
      placeBlock(v);
    });

    var prevShift = 0;
    layering.forEach(function(layer) {
      var s = shift[layer[0]];
      if (s === undefined) {
        s = 0;
      }
      prevShift = shift[layer[0]] = s + prevShift;
    });

    // Absolute coordinates
    layering.forEach(function(layer) {
      layer.forEach(function(v) {
        xs[v] = xs[root[v]];
        if (root[v] === v) {
          var xDelta = shift[sink[v]];
          if (xDelta < Number.POSITIVE_INFINITY) {
            xs[v] += xDelta;
          }
        }
      });
    });

    return xs;
  }

  function findMinCoord(layering, xs, nodeMap) {
    return min(layering.map(function(layer) {
      var u = layer[0];
      return xs[u] - nodeMap[u].width / 2;
    }));
  }

  function findMaxCoord(layering, xs, nodeMap) {
    return max(layering.map(function(layer) {
      var u = layer[layer.length - 1];
      return xs[u] - nodeMap[u].width / 2;
    }));
  }

  function shiftX(delta, xs) {
    Object.keys(xs).forEach(function(x) {
      xs[x] += delta;
    });
  }

  function alignToSmallest(layering, xss, nodeMap) {
    // First find the smallest width
    var smallestWidthMinCoord;
    var smallestWidthMaxCoord;
    var smallestWidth = Number.POSITIVE_INFINITY;
    values(xss).forEach(function(xs) {
      var minCoord = findMinCoord(layering, xs, nodeMap);
      var maxCoord = findMaxCoord(layering, xs, nodeMap);
      var width = maxCoord - minCoord;
      if (width < smallestWidth) {
        smallestWidthMinCoord = minCoord;
        smallestWidthMaxCoord = maxCoord;
        smallestWidth = width;
      }
    });

    // Realign coordinates with smallest width
    ["up", "down"].forEach(function(vertDir) {
      var xs = xss[vertDir + "-left"];
      var delta = smallestWidthMinCoord - findMinCoord(layering, xs, nodeMap);
      if (delta) {
        shiftX(delta, xs);
      }
    });

    ["up", "down"].forEach(function(vertDir) {
      var xs = xss[vertDir + "-right"];
      var delta = smallestWidthMaxCoord - findMaxCoord(layering, xs, nodeMap);
      if (delta) {
        shiftX(delta, xs);
      }
    });
  }

  function flipHorizontally(layering, xs) {
    var maxCenter = max(values(xs));
    Object.keys(xs).forEach(function(u) {
      xs[u] = maxCenter - xs[u];
    });
  }

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }
}
