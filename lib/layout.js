var util = require('./util'),
    rank = require('./rank'),
    order = require('./order'),
    addBorderSegments = require('./addBorderSegments'),
    normalize = require('./normalize'),
    CGraph = require('graphlib').CGraph,
    CDigraph = require('graphlib').CDigraph;

module.exports = function() {
  // External configuration
  var config = {
    // How much debug information to include?
    debugLevel: 0,
    // Max number of sweeps to perform in order phase
    orderMaxSweeps: order.DEFAULT_MAX_SWEEPS,
    // Use network simplex algorithm in ranking
    rankSimplex: false,
    // Rank direction. Valid values are (TB, LR)
    rankDir: 'TB',
    // Rank separation
    rankSep: 30
  };

  // Phase functions
  var position = require('./position')();

  // This layout object
  var self = {};

  self.orderIters = util.propertyAccessor(self, config, 'orderMaxSweeps');

  self.rankSimplex = util.propertyAccessor(self, config, 'rankSimplex');

  self.nodeSep = delegateProperty(position.nodeSep);
  self.edgeSep = delegateProperty(position.edgeSep);
  self.universalSep = delegateProperty(position.universalSep);
  self.rankSep = util.propertyAccessor(self, config, 'rankSep');
  self.rankDir = util.propertyAccessor(self, config, 'rankDir');
  self.debugAlignment = delegateProperty(position.debugAlignment);

  self.debugLevel = util.propertyAccessor(self, config, 'debugLevel', function(x) {
    util.log.level = x;
    position.debugLevel(x);
  });

  self.run = util.time('Total layout', run);

  self._normalize = normalize;

  return self;

  /*
   * Constructs an adjacency graph using the nodes and edges specified through
   * config. For each node and edge we add a property `dagre` that contains an
   * object that will hold intermediate and final layout information. Some of
   * the contents include:
   *
   *  1) A generated ID that uniquely identifies the object.
   *  2) Dimension information for nodes (copied from the source node).
   *  3) Optional dimension information for edges.
   *
   * After the adjacency graph is constructed the code no longer needs to use
   * the original nodes and edges passed in via config.
   */
  function initLayoutGraph(inputGraph) {
    var g = new CDigraph();

    inputGraph.eachNode(function(u, value) {
      if (value === undefined) value = {};
      g.addNode(u, {
        width: value.width,
        height: value.height
      });
      if (value.hasOwnProperty('rank')) {
        g.node(u).prefRank = value.rank;
      }
    });

    // Set up subgraphs
    if (inputGraph.parent) {
      inputGraph.nodes().forEach(function(u) {
        g.parent(u, inputGraph.parent(u));
      });
    }

    inputGraph.eachEdge(function(e, u, v, value) {
      if (value === undefined) value = {};
      var newValue = {
        e: e,
        minLen: value.minLen || 1,
        width: value.width || 0,
        height: value.height || 0,
        points: []
      };

      g.addEdge(null, u, v, newValue);
    });

    // Initial graph attributes
    var graphValue = inputGraph.graph() || {};
    g.graph({
      rankDir: graphValue.rankDir || config.rankDir,
      orderRestarts: graphValue.orderRestarts
    });

    return g;
  }

  function run(inputGraph) {
    // Build internal graph
    var g = util.time('initLayoutGraph', initLayoutGraph)(inputGraph);

    if (g.order() === 0) {
      return g;
    }

    // Make space for edge labels
    g.eachEdge(function(e, s, t, a) {
      a.minLen *= 2;
    });

    // Determine the rank for each node. Nodes with a lower rank will appear
    // above nodes of higher rank.
    util.time('rank.run', rank.run)(g, config.rankSimplex);

    // Normalize the graph by ensuring that every edge is proper (each edge has
    // a length of 1). We achieve this by adding dummy nodes to long edges,
    // thus shortening them.
    util.time('normalize', normalize)(g);

    // Add border segments for clusters
    var cg = util.time('addBorderSegments', addBorderSegments)(g);

    // Order the nodes so that edge crossings are minimized.
    util.time('order', order)(g, config.orderMaxSweeps, cg);

    // Find the x and y coordinates for every node in the graph.
    util.time('position', position.run)(g, config.rankSep / 2);

    // De-normalize the graph by removing dummy nodes and augmenting the
    // original long edges with coordinate information.
    util.time('normalize.undo', normalize.undo)(g);

    // Reverses points for edges that are in a reversed state.
    util.time('fixupEdgePoints', fixupEdgePoints)(g);

    // Remove border nodes from subgraphs and save information on the
    // composite node.
    util.time('borderSubgraphs', borderSubgraphs)(g);

    // Restore delete edges and reverse edges that were reversed in the rank
    // phase.
    util.time('rank.restoreEdges', rank.restoreEdges)(g);

    // Construct final result graph and return it
    return util.time('createFinalGraph', createFinalGraph)(g, inputGraph.isDirected());
  }

  /*
   * For each edge that was reversed during the `acyclic` step, reverse its
   * array of points.
   */
  function fixupEdgePoints(g) {
    g.eachEdge(function(e, s, t, a) { if (a.reversed) a.points.reverse(); });
  }

  function borderSubgraphs(g) {
    function dfs(u) {
      if (g.children(u).length) {
        var value = g.node(u),
            leftBorderNodes = value.leftBorderSegments,
            rightBorderNodes = value.rightBorderSegments,
            upperLeft = g.node(leftBorderNodes[0]),
            lowerRight = g.node(rightBorderNodes[rightBorderNodes.length - 1]),
            topY = upperLeft.y,
            bottomY = lowerRight.y,
            leftX = upperLeft.x,
            rightX = lowerRight.x;

        g.delNode(value.borderNodeTop);
        delete value.borderNodeTop;
        g.delNode(value.borderNodeBottom);
        delete value.borderNodeBottom;

        leftBorderNodes.forEach(function(v) { g.delNode(v); });
        delete value.leftBorderSegments;
        rightBorderNodes.forEach(function(v) { g.delNode(v); });
        delete value.rightBorderSegments;

        value.height = Math.abs(topY - bottomY);
        value.y = value.height / 2 + Math.min(topY, bottomY);
        value.width = Math.abs(leftX - rightX);
        value.x = value.width / 2 + Math.min(leftX, rightX);

        g.children(u).forEach(dfs);
      }
    }
    g.children(null).forEach(dfs);
  }

  function createFinalGraph(g, isDirected) {
    var out = isDirected ? new CDigraph() : new CGraph();
    out.graph(g.graph());
    g.eachNode(function(u, value) { out.addNode(u, value); });
    g.eachNode(function(u) { out.parent(u, g.parent(u)); });
    g.eachEdge(function(e, u, v, value) {
      out.addEdge(value.e, u, v, value);
    });

    // Attach bounding box information
    var maxX = 0, maxY = 0;
    g.eachNode(function(u, value) {
      maxX = Math.max(maxX, value.x + value.width / 2);
      maxY = Math.max(maxY, value.y + value.height / 2);
    });
    g.eachEdge(function(e, u, v, value) {
      var maxXPoints = Math.max.apply(Math, value.points.map(function(p) { return p.x; }));
      var maxYPoints = Math.max.apply(Math, value.points.map(function(p) { return p.y; }));
      maxX = Math.max(maxX, maxXPoints + value.width / 2);
      maxY = Math.max(maxY, maxYPoints + value.height / 2);
    });
    out.graph().width = maxX;
    out.graph().height = maxY;

    return out;
  }

  /*
   * Given a function, a new function is returned that invokes the given
   * function. The return value from the function is always the `self` object.
   */
  function delegateProperty(f) {
    return function() {
      if (!arguments.length) return f();
      f.apply(null, arguments);
      return self;
    };
  }
};

