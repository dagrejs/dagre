# dagre - Directed graph rendering

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

Try our [interactive demo](http://cpettitt.github.com/project/dagre/latest/demo.html)! 

If you've checked out the project, you can build the Dagre library and then try
out the demo by opening `demo.html` in your browser. There is no need to use a
web server for the demo.

## Building

[![Build Status](https://secure.travis-ci.org/cpettitt/dagre.png)](http://travis-ci.org/cpettitt/dagre)

Before building this library you need to install the [npm package manager].

Then follow these steps in this directory:

    $ make

If you want to verify the integrity of the library, use:

    $ make test

## License

dagre is licensed under the terms of the MIT License. See the LICENSE file
for details.

[npm package manager]: http://npmjs.org/
