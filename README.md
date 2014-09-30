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

For more details, including examples and configuration options, please see our [wiki](https://github.com/cpettitt/dagre/wiki).

## License

dagre is licensed under the terms of the MIT License. See the LICENSE file
for details.
