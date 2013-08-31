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
