/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
dagre.layout.position = (function() {
  function actualNodeWidth(u) {
    var uAttrs = u.attrs;
    return uAttrs.width + uAttrs.marginX * 2 + uAttrs.strokeWidth;
  }

  function markType1Conflicts(layering) {
    var pos = {};
    layering[0].forEach(function(u, i) {
      pos[u.id()] = i;
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
        pos[u.id()] = j;

        // Search for the next inner segment in the previous layer
        var innerRight = null;
        u.predecessors().forEach(function(v) {
          // TODO could abort as soon as we find a dummy
          if (u.attrs.dummy || v.attrs.dummy) {
            innerRight = pos[v.id()];
          }
        });

        // If no inner segment but at the end of the list we still
        // need to check for type 1 conflicts with earlier segments
        if (innerRight === null && j === layer.length - 1) {
          innerRight = layer.length;
        }

        if (innerRight !== null) {
          for (;currIdx <= j; ++currIdx) {
            var v = layer[currIdx];
            v.inEdges().forEach(function(e) {
              var tailPos = pos[e.tail().id()];
              if (tailPos < innerLeft || tailPos > innerRight) {
                e.attrs.type1Conflict = true;
              }
            });
          }
          innerLeft = innerRight;
        }
      }
    }
  }

  function verticalAlignment(layering, relationship) {
    var pos = {};
    var root = {};
    var align = {};

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        root[u.id()] = u;
        align[u.id()] = u;
        pos[u.id()] = i;
      });
    });

    layering.forEach(function(layer) {
      var prevIdx = -1;
      layer.forEach(function(v) {
        var related = v[relationship]();
        if (related.length > 0) {
          // TODO could find medians with linear algorithm if performance warrants it.
          related.sort(function(x, y) { return pos[x] - pos[y]; });
          var mid = (related.length - 1) / 2;
          related.slice(Math.floor(mid), Math.ceil(mid) + 1).forEach(function(u) {
            if (align[v.id()].id() === v.id()) {
              // TODO should we collapse multi-edges for vertical alignment?
              
              // Only need to check first returned edge for a type 1 conflict
              if (!u.edges(v)[0].attrs.type1Conflict && prevIdx < pos[u.id()]) {
                align[u.id()] = v;
                align[v.id()] = root[v.id()] = root[u.id()];
                prevIdx = pos[u.id()];
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
   * width, margin, stroke, and node separation.
   */
  function deltaX(u, nodeSep, edgeSep) {
    var sep = u.attrs.dummy ? edgeSep : nodeSep;
    return actualNodeWidth(u) / 2 + sep / 2;
  }

  function horizontalCompaction(layering, pos, root, align, nodeSep, edgeSep) {
    // Mapping of node id -> sink node id for class
    var sink = {};

    // Mapping of sink node id -> x delta
    var shift = {};

    // Mapping of node id -> predecessor node id (or null)
    var pred = {};

    // Calculated X positions
    var xs = {};

    layering.forEach(function(layer) {
      layer.forEach(function(u, i) {
        sink[u.id()] = u;
        shift[u.id()] = Number.POSITIVE_INFINITY;
        pred[u.id()] = i > 0 ? layer[i - 1].id() : null;
      });
    });

    function placeBlock(v) {
      var vId = v.id();
      if (xs[vId] === undefined) {
        xs[vId] = 0;
        var wId = vId;
        do {
          if (pos[wId] > 0) {
            var u = root[pred[wId]];
            placeBlock(u);
            if (sink[vId].id() === vId) {
              sink[vId] = sink[u.id()];
            }
            var delta = deltaX(u, nodeSep, edgeSep) + deltaX(v, nodeSep, edgeSep);
            if (sink[vId] !== sink[u.id()]) {
              shift[sink[u.id()]] = Math.min(shift[sink[u.id()]], v.attrs.x - u.attrs.x - delta);
            } else {
              xs[vId] = Math.max(xs[vId], xs[u.id()] + delta);
            }
          }
          wId = align[wId].id();
        } while (wId !== vId);
      }
    }

    // Root coordinates relative to sink
    Object.keys(root).forEach(function(uId) {
      if (root[uId].id() === uId) {
        placeBlock(root[uId]);
      }
    });

    // Absolute coordinates
    concat(layering).forEach(function(u) {
      xs[u.id()] = xs[root[u.id()].id()];
      var xDelta = shift[sink[root[u.id()].id()]];
      if (xDelta < Number.POSITIVE_INFINITY) {
        xs[u.id()] += xDelta;
      }
    });

    return xs;
  }

  function findMinCoord(layering, xs) {
    return min(layering.map(function(layer) {
      var u = layer[0];
      return xs[u.id()] - actualNodeWidth(u) / 2;
    }));
  }

  function findMaxCoord(layering, xs) {
    return max(layering.map(function(layer) {
      var u = layer[layer.length - 1];
      return xs[u.id()] - actualNodeWidth(u) / 2;
    }));
  }

  function shiftX(delta, xs) {
    Object.keys(xs).forEach(function(x) {
      xs[x] += delta;
    });
  }

  function alignToSmallest(layering, xss) {
    // First find the smallest width
    var smallestWidthMinCoord;
    var smallestWidthMaxCoord;
    var smallestWidth = Number.POSITIVE_INFINITY;
    values(xss).forEach(function(xs) {
      var minCoord = findMinCoord(layering, xs);
      var maxCoord = findMaxCoord(layering, xs);
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
      var delta = smallestWidthMinCoord - findMinCoord(layering, xs);
      if (delta) {
        shiftX(delta, xs);
      }
    });

    ["up", "down"].forEach(function(vertDir) {
      var xs = xss[vertDir + "-right"];
      var delta = smallestWidthMaxCoord - findMaxCoord(layering, xs);
      if (delta) {
        shiftX(delta, xs);
      }
    });
  }

  function flipHorizontally(layering, xs) {
    var maxCenter = max(values(xs));
    Object.keys(xs).forEach(function(uId) {
      xs[uId] = maxCenter - xs[uId];
    });
  }

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }

  return function(g, layering) {
    markType1Conflicts(layering);

    var xss = {};
    ["up", "down"].forEach(function(vertDir) {
      if (vertDir === "down") { layering.reverse(); }

      ["left", "right"].forEach(function(horizDir) {
        if (horizDir === "right") { reverseInnerOrder(layering); }

        var align = verticalAlignment(layering, vertDir === "up" ? "predecessors" : "successors");
        var dir = vertDir + "-" + horizDir;
        xss[dir]= horizontalCompaction(layering, align.pos, align.root, align.align, g.attrs.nodeSep, g.attrs.edgeSep);
        if (horizDir === "right") { flipHorizontally(layering, xss[dir]); }

        if (horizDir === "right") { reverseInnerOrder(layering); }
      });
    });

    alignToSmallest(layering, xss);

    g.nodes().forEach(function(u) {
      var xs = values(xss).map(function(xs) { return xs[u.id()]; }).sort();
      u.attrs.x = (xs[1] + xs[2]) / 2;
    });

    var minX = min(g.nodes().map(function(u) { return u.attrs.x; }));
    g.nodes().forEach(function(u) {
      u.attrs.x -= minX;
    });

    /*
    g.nodes().forEach(function(u) {
      u.attrs.x = xss["up-right"][u.id()];
    });
    */
  };
})();
