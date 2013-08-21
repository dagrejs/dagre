# dagre - Directed graph rendering

[![Build Status](https://secure.travis-ci.org/cpettitt/dagre.png)](http://travis-ci.org/cpettitt/dagre)

[![browser support](https://ci.testling.com/cpettitt/dagre.png)](https://ci.testling.com/cpettitt/dagre)

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
   whatever technology you prefer. We use [D3](https://github.com/mbostock/d3)
   in some of our examples and highly recommend it if you plan to render using
   CSS and SVG.

## Demo

Try our [interactive demo](http://cpettitt.github.com/project/dagre/latest/demo/demo.html)!

If you've checked out the project, you can build the Dagre library and then try
out the demo by opening `demo.html` in your browser. There is no need to use a
web server for the demo.

## Building

Before building this library you need to install the [npm package manager].

Then follow these steps in this directory:

    $ make

If you want to verify the integrity of the library, use:

    $ make test

## Contact

We've been manging bugs and enhancement request through our [issue
tracker](https://github.com/cpettitt/dagre/issues).

We also have a [google group](https://groups.google.com/group/dagre) for
questions and discussion.

## Third Party Examples

Dagre has been included as a part of some very cool projects. Here are just a
couple that stand out:

[JointJS](http://www.daviddurman.com/automatic-graph-layout-with-jointjs-and-dagre.html)
has a plugin that uses dagre for layout. JointJS focuses on rendering and
interaction with diagrams, which synergizes well with Dagre. If you want the
ability to move nodes and manipulate edges interactively, this is a good place
to start!

Jonathan Mace has a
[demo](http://cs.brown.edu/people/jcmace/d3/graph.html?id=small.json) that
makes it possible to interactively explore graphs. In his demo, you can
highlight paths, collapse subgraphs, via detailed node information, and more!

## References

This work was produced by taking advantage of many papers and books. Here we
summarize the sources used to develop Dagre.

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

## License

dagre is licensed under the terms of the MIT License. See the LICENSE file
for details.

[npm package manager]: http://npmjs.org/
