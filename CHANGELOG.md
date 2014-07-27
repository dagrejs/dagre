v0.4.6
======

* Bug fixes

v0.4.5
======

* Add initial support for self-loops and sideways edges

v0.4.4
======

* Pull in graphlib 0.7.4 / cp-data v1.1.3

v0.4.3
======

* Pull in graphlib v0.7.2 / cp-data v1.1.2

v0.4.2
======

* More fixes to ranker.
* Introduce experimental orderRestarts feature, which yields reduce crossing counts. See 72128a71d4ece45d4932da44e07ba692b0da5a1c for details.

v0.4.1
======

* Fixes to ranker.

v0.4.0
======

* Removed bbox on outputGraph.graph(). Instead dimensions are exposed as
  outputGraph.graph().width and outputGraph.graph().height.

v0.3.10
=======

* Add support for 'BT' and 'RL' rankDir values.

v0.3.9
======

* Some fixes to how self loops and sideways edges are handled.

v0.3.8
======

* Correctly preserve edge direction in cyclic graphs

v0.3.7
======

* Add bounding box information to output graph

v0.3.6
======

* Fix a bug where some dummy edges were leaked to the layout graph

v0.3.5
======

* Fix a bug where edge ids were lost during layout

v0.3.4
======

* Fix a bug in instrumentation that caused dagre to throw an exception when
  used with IE.
* Rank constraint values may be one of 'min', 'max', or a value that starts
  with 'same\_'. The latter groups all nodes with the same value into the same
  rank.

v0.3.3
======

* Temporarily disable cluster orderer, yielding much better ordering results.

v0.3.2
======

* Made cp-data a runtime dependency. It was incorrectly specified as a dev
  dependency, which could case result in the error `cannot find module
  cp-data`.

v0.3.1
======

* Added support for rank constraints.

v0.3.0
======

**Backwards incompatible** changes:

* Dagre now takes a `dagre.Digraph` or `dagre.Graph` as input for layout. See
  [README.md](README.md) for details.
* `util` is no longer exported from dagre.

Backwards compatible changes:

* Dagre can now perform layout for undirected graphs (dagre.Graph).

v0.2.0
======

This release removes the export of `Graph` from the `graphlib` library. If you
use `Graph`, please get it directly from `graphlib`.

v0.1.2
======

With this release you can use node ids instead of references in edges. Where
you used to do this:


```js
var nodes = [
    {width: w1, height: h1},
    {width: w2, height: h2}
];

var edges = [
    { source: nodes[0], target: nodes[1] }
];

dagre.layout()
     .nodes(nodes)
     .edges(edges)
     .run();
```

You can instead do this:

```js
var nodes = [
    {id: "n1", width: w1, height: h1},
    {id: "n2", width: w2, height: h2}
];

var edges = [
    { sourceId: "n1", targetId: "n2" }
];

dagre.layout()
     .nodes(nodes)
     .edges(edges)
     .run();
```

Use whichever is more convenient for your needs.


v0.1.1
======

* Initial CHANGELOG entry
