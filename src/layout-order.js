dagre.layout.order = (function() {
  function initOrder(g) {
    var layering = [];
    var visited = {};

    function dfs(u) {
      if (u.id() in visited) {
        return;
      }
      visited[u.id()] = true;

      var rank = u.attrs.rank;
      for (var i = layering.length; i <= rank; ++i) {
        layering[i] = [];
      }
      layering[rank].push(u);

      u.neighbors().forEach(function(v) {
        dfs(v);
      });
    }

    g.nodes().forEach(function(u) {
      if (u.attrs.rank === 0) {
        dfs(u);
      }
    });

    return layering;
  }

  return function(g) {
    return initOrder(g);
  }
})();
