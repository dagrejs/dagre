/*
 * The algorithms here are based on Brandes and Köpf, "Fast and Simple
 * Horizontal Coordinate Assignment".
 */
dagre.layout.position = (function() {
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

    concat(layering).forEach(function(u, i) {
      root[u.id()] = u;
      align[u.id()] = u;
      pos[u.id()] = i;
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

  function reverseInnerOrder(layering) {
    layering.forEach(function(layer) {
      layer.reverse();
    });
  }

  return function(g, layering) {
    markType1Conflicts(layering);

    ["up", "down"].forEach(function(vertDir) {
      if (vertDir === "down") { layering.reverse(); }

      ["left", "right"].forEach(function(horizDir) {
        if (horizDir === "right") { reverseInnerOrder(layering); }

        var alignment = verticalAlignment(layering, vertDir === "up" ? "predecessors" : "successors");

        if (horizDir === "right") { reverseInnerOrder(layering); }
      });
    });
  };
})();
