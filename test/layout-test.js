var assert = require('./assert'),
    layout = require('..').layout,
    Digraph = require('graphlib').Digraph;

describe('layout', function() {
  it('lays out out a graph with undefined node values', function() {
    var inputGraph = new Digraph();
    inputGraph.addNode(1);
    var outputGraph = layout().run(inputGraph);
    assert.property(outputGraph.node(1), 'x');
    assert.property(outputGraph.node(1), 'y');
  });

  it('lays out out a graph with undefined edge values', function() {
    var inputGraph = new Digraph();
    inputGraph.addNode(1);
    inputGraph.addNode(2);
    inputGraph.addEdge('A', 1, 2);
    var outputGraph = layout().run(inputGraph);
    assert.property(outputGraph.edge('A'), 'points');
  });

  it('includes bounding box information', function() {
    var inputGraph = new Digraph();
    inputGraph.addNode(1, { width: 50, height: 20 });
    inputGraph.addNode(2, { width: 100, height: 30 });
    inputGraph.addEdge(null, 1, 2, {});

    var outputGraph = layout().run(inputGraph);

    assert.equal(outputGraph.graph().bbox.width, 100);
    assert.equal(outputGraph.graph().bbox.height, 20 + 30 + layout().rankSep());
  });

  it('ranks nodes left-to-right with rankDir=LR', function() {
    var inputGraph = new Digraph();
    inputGraph.addNode(1, { width: 1, height: 1 });
    inputGraph.addNode(2, { width: 1, height: 1 });
    inputGraph.graph({ rankDir: 'LR' });

    var outputGraph = layout().run(inputGraph);

    assert.equal(outputGraph.node(1).x, outputGraph.node(2).x);
    assert.notEqual(outputGraph.node(1).y, outputGraph.node(2).y);
  });

  // This test is necessary until we drop layout().rankDir(...)
  it('produces the same output for rankDir=LR input', function() {
    var inputGraph = new Digraph();
    inputGraph.addNode(1, { width: 1, height: 1 });
    inputGraph.addNode(2, { width: 1, height: 1 });
    var outputGraph1 = layout().rankDir('LR').run(inputGraph);

    inputGraph.graph({ rankDir: 'LR' });
    var outputGraph2 = layout().run(inputGraph);

    assert.equal(outputGraph1.node(1).x, outputGraph2.node(1).x);
    assert.equal(outputGraph1.node(2).x, outputGraph2.node(2).x);
    assert.equal(outputGraph1.node(1).y, outputGraph2.node(1).y);
    assert.equal(outputGraph1.node(2).y, outputGraph2.node(2).y);
  });

  describe('rank constraints', function() {
    var g;

    beforeEach(function() {
      g = new Digraph();
      g.addNode(1, { width: 1, height: 1 });
      g.addNode(2, { width: 1, height: 1, rank: 'same_1' });
      g.addNode(3, { width: 1, height: 1, rank: 'same_1' });
      g.addNode(4, { width: 1, height: 1 });
      g.addNode(5, { width: 1, height: 1, rank: 'min' });
      g.addNode(6, { width: 1, height: 1, rank: 'max' });

      g.addEdge(null, 1, 2);
      g.addEdge(null, 3, 4);
      g.addEdge(null, 6, 1);
    });
    
    it('ensures nodes with rank=min have the smallest y value', function() {
      var out = layout().run(g);
      var minY = Math.min.apply(Math, out.nodes().map(function(u) { return out.node(u).y; }));
      assert.propertyVal(out.node(5), 'y', minY);
    });

    it('ensures nodes with rank=max have the greatest y value', function() {
      var out = layout().run(g);
      var maxY = Math.max.apply(Math, out.nodes().map(function(u) { return out.node(u).y; }));
      assert.propertyVal(out.node(6), 'y', maxY);
    });

    it('ensures nodes with the rank=same_x have the same y value', function() {
      var out = layout().run(g);
      assert.equal(out.node(3).y, out.node(2).y);
    });
  });
});
