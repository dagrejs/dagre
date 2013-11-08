var assert = require('./assert'),
    dot = require('graphlib-dot'),
    layout = require('..').layout,
    path = require('path'),
    fs = require('fs');

describe('smoke tests', function() {
  var smokeDir = path.join(__dirname, 'smoke');
  var fileNames = fs.readdirSync(smokeDir)
                    .filter(function(x) { return x.slice(-4) === '.dot'; })
                    .map(function(x) { return path.join(smokeDir, x); });
  fileNames.forEach(function(fileName) {
    var file = fs.readFileSync(fileName, 'utf8'),
        g = dot.parse(file);

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

        out.eachEdge(function(e, u, v) {
            if (u !== v) {
              var uY = out.node(u).y,
                  vY = out.node(v).y,
                  uHeight = Number(out.node(u).height),
                  vHeight = Number(out.node(v).height),
                  actualSep = Math.abs(vY - uY) - (uHeight + vHeight) / 2;
              assert.isTrue(actualSep >= sep,
                            'Distance between ' + u + ' and ' + v + ' should be ' + sep +
                            ' but was ' + actualSep);
            }
          });
      });

      it('has valid dimensions', function() {
        var bbox = layout().run(g).graph().bbox;
        assert.property(bbox, 'width');
        assert.property(bbox, 'height');
        assert.isFalse(Number.isNaN(bbox.width));
        assert.isFalse(Number.isNaN(bbox.height));
      });

      it('ensures nodes with rank=min have the smallest y value', function() {
        var out = layout().run(g);
        var minY = Math.min.apply(Math, out.nodes().map(function(u) { return out.node(u).y; }));
        g.eachNode(function(u, value) {
          if (value.rank === 'min') {
            assert.equal(out.node(u).y, minY, 'expected node ' + u + ' to have min Y value');
          }
        });
      });

      it('ensures nodes with rank=max have the greatest y value', function() {
        var out = layout().run(g);
        var maxY = Math.max.apply(Math, out.nodes().map(function(u) { return out.node(u).y; }));
        g.eachNode(function(u, value) {
          if (value.rank === 'max') {
            assert.equal(out.node(u).y, maxY, 'expected node ' + u + ' to have max Y value');
          }
        });
      });

      it('ensures nodes with the rank=same_x have the same y value', function() {
        var out = layout().run(g);
        var rankYs = {};
        g.eachNode(function(u, value) {
          if (value.rank && value.rank.slice(0, 5) === 'same_') {
            if (!(value.rank in rankYs)) {
              rankYs[value.rank] = out.node(u).y;
            } else {
              assert.equal(out.node(u).y, rankYs[value.rank],
                           'expected node ' + u + ' to have y=' + rankYs[value.rank]);
            }
          }
        });
      });
    });
  });
});
