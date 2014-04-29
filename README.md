# dagre - Graph layout for JavaScript

[![Build Status](https://secure.travis-ci.org/cpettitt/dagre.png?branch=master)](http://travis-ci.org/cpettitt/dagre)

Dagre is a JavaScript library that makes it easy to lay out directed graphs on
the client-side.

Key priorities for this library are:

1. **Completely client-side computed layout**. There are great, feature-rich
   alternatives, like [graphviz](http://www.graphviz.org), if client-side
   layout is not a requirement for you.

2. **Speed**. Dagre must be able to draw medium sized graphs quickly, potentially
   at the cost of not being able to adopt more optimal or exact algorithms.

3. **Rendering agnostic**. Dagre requires only very basic information to lay out
   graphs, such as the dimensions of nodes. You're free to render the graph using
   whatever technology you prefer. We use [D3][]
   in some of our examples and highly recommend it if you plan to render using
   CSS and SVG.

Note that dagre is current a pre-1.0.0 library. We will do our best to
maintain backwards compatibility for patch level increases (e.g. 0.0.1 to
0.0.2) but make no claim to backwards compatibility across minor releases (e.g.
0.0.1 to 0.1.0). Watch our [CHANGELOG](CHANGELOG.md) for details on changes.

## Getting Dagre

### Browser Scrips

You can get the latest browser-ready scripts:

* [dagre.js](http://cpettitt.github.io/project/dagre/latest/dagre.js)
* [dagre.min.js](http://cpettitt.github.io/project/dagre/latest/dagre.min.js)

### NPM Install

Before installing this library you need to install the [npm package manager].

To get dagre from npm, use:

    $ npm install dagre

### Build From Source

Before building this library you need to install the [npm package manager].

Check out this project and run this command from the root of the project:

    $ make dist

This will generate `dagre.js` and `dagre.min.js` in the `dist` directory
of the project.

## Using Dagre

### A Note on Rendering

As mentioned above, dagre's focus in on graph layout only. This means that you
need something to actually render the graphs with the layout information from
dagre.

There are a couple of options for rendering:

* [dagre-d3](https://github.com/cpettitt/dagre-d3) is a D3-based renderer for
  dagre.
* [JointJS][] is a renderer that provides facilities for editing a graph after
  it has been rendered.

### An Example Layout

First we need to load the dagre library. In an HTML page you do this by adding
the following snippet:

```html
<script src="http://PATH/TO/dagre.min.js"></script>
```

In node.js you use:

```js
var dagre = require("dagre");
```

We use [graphlib](https://github.com/cpettitt/graphlib) to create graphs in
dagre, so its probably worth taking a look at its
[API](http://cpettitt.github.io/project/graphlib/latest/doc/index.html).
Graphlib comes bundled with dagre. In this section, we'll show you how to
create a simple graph.

A node must be an object with the following properties:

* `width` - how wide the node should be in pixels
* `height` - how tall the node should be in pixels

The attributes would typically come from a rendering engine that has already
determined the space needed for a node.

Here's a quick example of how to set up nodes and edges:

```js
// Create a new directed graph
var g = new dagre.Digraph();

// Add nodes to the graph. The first argument is the node id. The second is
// metadata about the node. In this case we're going to add labels to each of
// our nodes.
g.addNode("kspacey",    { label: "Kevin Spacey",  width: 144, height: 100 });
g.addNode("swilliams",  { label: "Saul Williams", width: 160, height: 100 });
g.addNode("bpitt",      { label: "Brad Pitt",     width: 108, height: 100 });
g.addNode("hford",      { label: "Harrison Ford", width: 168, height: 100 });
g.addNode("lwilson",    { label: "Luke Wilson",   width: 144, height: 100 });
g.addNode("kbacon",     { label: "Kevin Bacon",   width: 121, height: 100 });

// Add edges to the graph. The first argument is the edge id. Here we use null
// to indicate that an arbitrary edge id can be assigned automatically. The
// second argument is the source of the edge. The third argument is the target
// of the edge.
g.addEdge(null, "kspacey",   "swilliams");
g.addEdge(null, "swilliams", "kbacon");
g.addEdge(null, "bpitt",     "kbacon");
g.addEdge(null, "hford",     "lwilson");
g.addEdge(null, "lwilson",   "kbacon");
```

Next we can ask dagre to do the layout for these nodes and edges. This is done
with the following code:

```js
var layout = dagre.layout().run(g);
```

An object with layout information will be attached to each node and edge under
the `dagre` property.

The node's `dagre` object has the following properties:

* **x** - the x-coordinate of the center of the node
* **y** - the y-coordinate of the center of the node

The edge's `dagre` object has a `points` property, which is an array of objects
with the following properties:

* **x** - the x-coordinate for the center of this bend in the edge
* **y** - the y-coordinate for the center of this bend in the edge

For example, the following layout information is generated for the above objects:

```js
layout.eachNode(function(u, value) {
    console.log("Node " + u + ": " + JSON.stringify(value));
});
layout.eachEdge(function(e, u, v, value) {
    console.log("Edge " + u + " -> " + v + ": " + JSON.stringify(value));
});
```

Prints:

```
Node kspacey: {"id":"kspacey","width":144,"height":100,"rank":0,"order":0,"ul":0,"ur":0,"dl":0,"dr":0,"x":84,"y":50}
Node swilliams: {"id":"swilliams","width":168,"height":100,"rank":2,"order":0,"ul":0,"ur":0,"dl":0,"dr":0,"x":84,"y":180}
Node bpitt: {"id":"bpitt","width":108,"height":100,"rank":2,"order":1,"ul":188,"ur":188,"dl":188,"dr":188,"x":272,"y":180}
Node hford: {"id":"hford","width":168,"height":100,"rank":0,"order":1,"ul":364,"ur":364,"dl":364,"dr":364,"x":448,"y":50}
Node lwilson: {"id":"lwilson","width":144,"height":100,"rank":2,"order":2,"ul":364,"ur":364,"dl":364,"dr":364,"x":448,"y":180}
Node kbacon: {"id":"kbacon","width":121,"height":100,"rank":4,"order":0,"ul":188,"ur":188,"dl":0,"dr":364,"x":272,"y":310}

Edge kspacey -> swilliams: {"points":[{"x":84,"y":115,"ul":0,"ur":0,"dl":0,"dr":0}],"id":"_E0","minLen":2,"width":0,"height":0}
Edge swilliams -> kbacon: {"points":[{"x":84,"y":245,"ul":0,"ur":0,"dl":0,"dr":0}],"id":"_E1","minLen":2,"width":0,"height":0}
Edge bpitt -> kbacon: {"points":[{"x":272,"y":245,"ul":188,"ur":188,"dl":188,"dr":188}],"id":"_E2","minLen":2,"width":0,"height":0}
Edge hford -> lwilson: {"points":[{"x":448,"y":115,"ul":364,"ur":364,"dl":364,"dr":364}],"id":"_E3","minLen":2,"width":0,"height":0}
Edge lwilson -> kbacon: {"points":[{"x":448,"y":245,"ul":364,"ur":364,"dl":364,"dr":364}],"id":"_E4","minLen":2,"width":0,"height":0}
```

Besides just the `x` and `y` coordinates there are other debug attributes that
are not guaranteed to be present.

### Configuring the Layout

Here are a few methods you can call on the layout object to change layout behavior:

* `debugLevel(x)` sets the level of logging verbosity to the number `x`. Currently 4 is th max.
* `nodeSep(x)` sets the separation between adjacent nodes in the same rank to `x` pixels.
* `edgeSep(x)` sets the separation between adjacent edges in the same rank to `x` pixels.
* `rankSep(x)` sets the sepration between ranks in the layout to `x` pixels.
* `rankDir(x)` sets the direction of the layout.
    * Defaults to `"TB"` for top-to-bottom layout
    * `"LR"` sets layout to left-to-right

For example, to set node separation to 20 pixels and the rank direction to left-to-right:

```js
var layout = dagre.layout()
                  .nodeSep(20)
                  .rankDir("LR")
                  .run(g);
```

### Input Graph

The input graph supplied for layout can have the following attributes:

Object | Attribute | Default | Description
------ | --------- | ------- | -----------
graph  | rankDir   | TB      | Direction for rank nodes. Can be `TB`, `BT`, `LR`, or `RL`, where T = top, B = bottom, L = left, and R = right.
node   | height    |         | The height of the node.
node   | width     |         | The width of the node.
edge   | minLen    | 1       | The number of ranks to keep between the source and target of the edge.


### Output Graph

The output graph has the following attributes:

Object | Attribute | Description
------ | --------- | -----------
graph  | height    | The height of the entire graph.
graph  | width     | The width of the entire graph.
node   | x         | The x-coordinate for the center of the node.
node   | y         | The y-coordinate for the center of the node.
edge   | points    | An array of { x, y } pairs for the control points of the edge.

## Resources

* [Issue tracker](https://github.com/cpettitt/dagre/issues)
* [Mailing list](https://groups.google.com/group/dagre)

### Recommend Reading

This work was produced by taking advantage of many papers and books. If you're
interested in how dagre works internally here are some of the most important
papers to read.

The general skeleton for Dagre comes from *Gansner, et al., "A Technique for
Drawing Directed Graphs"*, which gives both an excellent high level overview of
the phases involved in layered drawing as well as diving into the details and
problems of each of the phases. Besides the basic skeleton, we specifically
used the technique described in the paper to produce an acyclic graph, and we
use the idea of a minimum spanning tree for ranking.  We do not currently use
the network simplex algorithm for ranking. If there is one paper to start with
when learning about layered graph drawing, this seems to be it!

For crossing minimization we used *Jünger and Mutzel, "2-Layer Straightline
Crossing Minimization"*, which provides a comparison of the performance of
various heuristics and exact algorithms for crossing minimization.

For counting the number of edge crossings between two layers we use the `O(|E|
log |V_small|)` algorithm described in *Barth, et al., "Simple and Efficient
Bilayer Cross Counting"*.

For positioning (or coordinate assignment), we derived our algorithm from
*Brandes and Köpf, "Fast and Simple Horizontal Coordinate Assignment"*. We made
some some adjustments to get tighter graphs when node and edges sizes vary
greatly.

## Third Party Examples

Dagre has been included as a part of some very cool projects. Here are just a
few that stand out:

[JointJS][] has a plugin that uses dagre for layout. JointJS focuses on
rendering and interaction with diagrams, which synergizes well with Dagre. If
you want the ability to move nodes and manipulate edges interactively, this is
a good place to start!

Jonathan Mace has a
[demo](http://cs.brown.edu/people/jcmace/d3/graph.html?id=small.json) that
makes it possible to interactively explore graphs. In his demo, you can
highlight paths, collapse subgraphs, via detailed node information, and more!

[nomnoml](http://www.nomnoml.com/) is a tool for drawing UML diagrams in a
browser. It uses a custom renderer with dagre to draw the diagrams in an
HTML5 canvas.

## License

dagre is licensed under the terms of the MIT License. See the LICENSE file
for details.

[npm package manager]: http://npmjs.org/
[D3]: https://github.com/mbostock/d3
[JointJS]: http://www.daviddurman.com/automatic-graph-layout-with-jointjs-and-dagre.html
