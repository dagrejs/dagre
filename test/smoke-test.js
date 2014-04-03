var assert = require('./assert'),
    util = require('../lib/util'),
    dot = require('graphlib-dot'),
    layout = require('..').layout,
    components = require('graphlib').alg.components,
    nodesFromList = require('graphlib').filter.nodesFromList,
    path = require('path'),
    fs = require('fs');

describe('smoke tests', function() {
  var fileNames;

  if ('SMOKE_TESTS' in process.env) {
    fileNames = process.env.SMOKE_TESTS.split(' ');
  } else {
    var smokeDir = path.join(__dirname, 'smoke');
    fileNames = fs.readdirSync(smokeDir)
                      .filter(function(x) { return x.slice(-4) === '.dot'; })
                      .map(function(x) { return path.join(smokeDir, x); });
  }

  fileNames.forEach(function(fileName) {
    var file = fs.readFileSync(fileName, 'utf8'),
        g = dot.parse(file);

    // Since dagre doesn't assign dimensions to nodes, we should do that here
    // for each node that doesn't already have dimensions assigned.
    g.eachNode(function(u, a) {
      if (g.children(u).length) return;
      if (a.width === undefined) a.width = 100;
      if (a.height === undefined) a.height = 50;
    });

    describe('layout for ' + fileName, function() {
      it('only includes nodes in the input graph', function() {
        var nodes = g.nodes();
        assert.sameMembers(layout().run(g).nodes(), nodes);
      });

      it('only includes edges in the input graph', function() {
        var edges = g.edges();
        assert.sameMembers(layout().run(g).edges(), edges);
      });

      it('has the same incident nodes for each edge', function() {
        function incidentNodes(g) {
          var edges = {};
          g.edges().forEach(function(e) {
            edges[e] = g.incidentNodes(e);
          });
          return edges;
        }

        var edges = incidentNodes(g);
        assert.deepEqual(incidentNodes(layout().run(g)), edges);
      });

      it('has valid control points for each edge', function() {
        layout().run(g).eachEdge(function(e, u, v, value) {
          assert.property(value, 'points');
          value.points.forEach(function(p) {
            assert.property(p, 'x');
            assert.property(p, 'y');
            assert.isFalse(Number.isNaN(p.x));
            assert.isFalse(Number.isNaN(p.y));
          });
        });
      });

      it('respects rankSep', function() {
        // For each edge we check that the difference between the y value for
        // incident nodes is equal to or greater than ranksep. We make an
        // exception for self edges.

        var sep = 50;
        var out = layout().rankSep(sep).run(g);

        function getY(u) {
          return (g.graph().rankDir === 'LR' || g.graph().rankDir === 'RL'
                    ? out.node(u).x
                    : out.node(u).y);
        }

        function getHeight(u) {
          return Number(g.graph().rankDir === 'LR' || g.graph().rankDir === 'RL'
                            ? out.node(u).width
                            : out.node(u).height);
        }

        out.eachEdge(function(e, u, v) {
            if (u !== v && g.node(u).rank !== undefined && g.node(u).rank !== g.node(v).rank) {
              var uY = getY(u),
                  vY = getY(v),
                  uHeight = getHeight(u),
                  vHeight = getHeight(v),
                  actualSep = Math.abs(vY - uY) - (uHeight + vHeight) / 2;
              assert.isTrue(actualSep >= sep,
                            'Distance between ' + u + ' and ' + v + ' should be ' + sep +
                            ' but was ' + actualSep);
            }
          });
      });

      it('has the origin at (0, 0)', function() {
        var out = layout().run(g);
        var nodes = out.nodes().filter(util.filterNonSubgraphs(out));

        var xs = nodes.map(function(u) {
          var value = out.node(u);
          return value.x - value.width / 2;
        });
        out.eachEdge(function(e, u, v, value) {
          xs = xs.concat(value.points.map(function(p) {
            return p.x - value.width / 2;
          }));
        });

        var ys = nodes.map(function(u) {
          var value = out.node(u);
          return value.y - value.height / 2;
        });
        out.eachEdge(function(e, u, v, value) {
          ys = ys.concat(value.points.map(function(p) {
            return p.y - value.height / 2;
          }));
        });

        assert.equal(util.min(xs), 0);
        assert.equal(util.min(ys), 0);
      });

      it('has valid dimensions', function() {
        var graphValue = layout().run(g).graph();
        assert.property(graphValue, 'width');
        assert.property(graphValue, 'height');
        assert.isFalse(Number.isNaN(graphValue.width));
        assert.isFalse(Number.isNaN(graphValue.height));
      });

      it('has no unnecessary edge slack', function() {
        // We want to be sure that each node is connected to the graph by at
        // least one tight edge. To do this we first break the graph into
        // connected components and then scan over all edges, preserving only
        // thoses that are tight. Our expectation is that each component will
        // still be connected after this transform. If not, it indicates that
        // at least one node in the component was not connected by a tight
        // edge.

        var layoutGraph = layout().run(g);
        components(layoutGraph).forEach(function(cmpt) {
          var subgraph = layoutGraph.filterNodes(nodesFromList(cmpt));
          subgraph.eachEdge(function(e, u, v, value) {
            if (value.minLen !== Math.abs(layoutGraph.node(u).rank - layoutGraph.node(v).rank) &&
                layoutGraph.node(u).prefRank !== layoutGraph.node(v).prefRank) {
              subgraph.delEdge(e);
            }
          });

          assert.lengthOf(components(subgraph), 1);
        });
      });
    });
  });
});
