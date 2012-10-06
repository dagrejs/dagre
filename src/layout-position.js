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

  return function(g, layering) {
    markType1Conflicts(layering);
  };
})();
