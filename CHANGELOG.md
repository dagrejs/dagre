# v0.0.6

* Added support for dragging nodes and edges in demo.html
* Now we only add control points to edges where bends occur. Previously we
  added more control points than strictly necessary.
* Added support for left-right drawing direction. Use
  `dagre.layout().rankDir("LR")` to use it.

# v0.0.5

* Initial support for edge labels
* Demo changes:
    * Edges are now wrapped in a <g>...</g> element. This will potentially
      impact CSS selectors. Where matching with `path.edge` previously now
      match with `.edge path`.

# v0.0.4

* We have significantly reduced the amount of graph based customization. Most
  customization now comes through standard CSS.

# v0.0.3

* Support for HTML node labels. To use an HTML node label, start the label with
  the `<` character.

# v0.0.2

* Documentation for configuration options added to `src/pre-layout.js`.
* Demo improvement: only redraw graph if it has changed.
* Fix to ordering phase that could result in suboptimal ordering.
* Improvement to positioning phase to produce more compact graphs (#11).
* Number of iterations in order phase are configurable via `orderIters` option.

# v0.0.1

Initial revision.
