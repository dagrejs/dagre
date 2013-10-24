var assert = require('../../assert'),
    initCutValues = require('../../../lib/rank/simplex/initCutValues'),
    Digraph = require('graphlib').Digraph;

describe('initCutValues', function() {
  var g;

  beforeEach(function() {
    g = new Digraph();
    t = new Digraph();
  });

  it('does not throw for a single node graph', function() {
    addNode(1);
    setRoot(1);
    initCutValues(g, t);
  });

  it('sets cutValue to 1 for single edge graph', function() {
    addNode(1);
    addNode(2);
    setRoot(1);
    addTreeEdge('a', 1, 2);

    initCutValues(g, t);
    assertCutValue('a', 1);
  });

  it('sets correct cut values for graphviz example #1', function() {
    // This comes from the graphviz paper
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function(u) { addNode(u); });
    addTreeEdge(    'ab', 'a', 'b');
    addTreeEdge(    'bc', 'b', 'c');
    addTreeEdge(    'cd', 'c', 'd');
    addTreeEdge(    'dh', 'd', 'h');
    addRevTreeEdge( 'gh', 'g', 'h');
    addRevTreeEdge( 'eg', 'e', 'g');
    addRevTreeEdge( 'fg', 'f', 'g');
    addGraphEdge(   'ae', 'a', 'e');
    addGraphEdge(   'af', 'a', 'f');
    setRoot('a');

    initCutValues(g, t);
    assertCutValue('ab', 3);
    assertCutValue('bc', 3);
    assertCutValue('cd', 3);
    assertCutValue('dh', 3);
    assertCutValue('eg', 0);
    assertCutValue('fg', 0);
    assertCutValue('gh', -1);
  });

  it('sets correct cut values for graphviz example #2', function() {
    // This comes from the graphviz paper
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(function(u) { addNode(u); });
    addTreeEdge(    'ae', 'a', 'e');
    addTreeEdge(    'eg', 'e', 'g');
    addRevTreeEdge( 'fg', 'f', 'g');
    addTreeEdge(    'ab', 'a', 'b');
    addTreeEdge(    'bc', 'b', 'c');
    addTreeEdge(    'cd', 'c', 'd');
    addTreeEdge(    'dh', 'd', 'h');
    addGraphEdge(   'gh', 'g', 'h');
    addGraphEdge(   'af', 'a', 'f');
    setRoot('a');

    initCutValues(g, t);
    assertCutValue('ab', 2);
    assertCutValue('bc', 2);
    assertCutValue('cd', 2);
    assertCutValue('dh', 2);
    assertCutValue('ae', 1);
    assertCutValue('eg', 1);
    assertCutValue('fg', 0);
  });

  function addNode(u) {
    g.addNode(u, {});
    t.addNode(u, {});
  }

  function setRoot(u) {
    t.graph({ root: u });
  }

  function addTreeEdge(e, u, v) {
    t.addEdge(e, u, v, {});
    addGraphEdge(e, u, v);
  }

  function addRevTreeEdge(e, u, v) {
    t.addEdge(e, v, u, {});
    addGraphEdge(e, u, v);
  }

  function addGraphEdge(e, u, v) {
    g.addEdge(e, u, v, {});
  }

  function assertCutValue(e, val) {
    assert.propertyVal(t.edge(e), 'cutValue', val, 'Incorrect cut value for edge ' + e);
  }
});
