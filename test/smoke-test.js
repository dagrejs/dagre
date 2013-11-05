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
    var file = fs.readFileSync(fileName, { encoding: 'utf-8' }),
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

      it('has valid dimensions', function() {
        var bbox = layout().run(g).graph().bbox;
        assert.property(bbox, 'width');
        assert.property(bbox, 'height');
        assert.isFalse(Number.isNaN(bbox.width));
        assert.isFalse(Number.isNaN(bbox.height));
      });
    });
  });
});
