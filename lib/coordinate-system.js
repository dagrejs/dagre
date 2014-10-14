"use strict";

var _ = require("lodash");

module.exports = {
  adjust: adjust,
  undo: undo
};

function adjust(g) {
  var rankDir = g.graph().rankdir.toLowerCase();
  if (rankDir === "lr" || rankDir === "rl") {
    swapWidthHeight(g);
  }
}

function undo(g) {
  var rankDir = g.graph().rankdir.toLowerCase();
  if (rankDir === "bt" || rankDir === "rl") {
    reverseY(g);
  }

  if (rankDir === "lr" || rankDir === "rl") {
    swapXY(g);
    swapWidthHeight(g);
  }
}

function swapWidthHeight(g) {
  _.each(g.nodes(), function(v) {
    if (g.children(v).length) return;
    var node = g.node(v),
        width = node.width,
        height = node.height;
    node.width = height;
    node.height = width;
  });
}

function reverseY(g) {
  _.each(g.nodes(), function(v) {
    if (g.children(v).length) return;
    var node = g.node(v);
    node.y = -node.y;
  });
}

function swapXY(g) {
  _.each(g.nodes(), function(v) {
    if (g.children(v).length) return;
    var node = g.node(v),
        x = node.x,
        y = node.y;
    node.x = y;
    node.y = x;
  });
}
