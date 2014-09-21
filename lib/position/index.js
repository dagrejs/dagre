"use strict";

var _ = require("lodash"),
    util = require("../util"),
    positionX = require("./bk").positionX;

module.exports = position;

function position(g) {
  g = util.asNonCompoundGraph(g);

  var rankDir = (g.getGraph().rankdir || "tb").toLowerCase();

  if (rankDir === "lr" || rankDir === "rl") {
    swapWidthHeight(g);
  }

  positionY(g);
  _.each(positionX(g), function(x, v) {
    g.getNode(v).x = x;
  });

  if (rankDir === "bt" || rankDir === "rl") {
    reverseY(g);
  }
  if (rankDir === "lr" || rankDir === "rl") {
    swapXY(g);
    swapWidthHeight(g);
  }

  translate(g);
}

function positionY(g) {
  var layering = util.buildLayerMatrix(g),
      rankSep = g.getGraph().ranksep,
      prevY = 0;
  _.each(layering, function(layer) {
    var maxHeight = _.max(_.map(layer, function(v) { return g.getNode(v).height; }));
    _.each(layer, function(v) {
      g.getNode(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
}

function translate(g) {
  var minX = Number.POSITIVE_INFINITY,
      maxX = 0,
      minY = Number.POSITIVE_INFINITY,
      maxY = 0,
      graphLabel = g.getGraph(),
      marginX = graphLabel.marginx || 0,
      marginY = graphLabel.marginy || 0;

  _.each(g.nodes(), function(v) {
    var node = g.getNode(v),
        x = node.x,
        y = node.y,
        w = node.width,
        h = node.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  });

  minX -= marginX;
  minY -= marginY;

  _.each(g.nodes(), function(v) {
    var node = g.getNode(v);
    node.x -= minX;
    node.y -= minY;
  });

  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}

function reverseY(g) {
  _.each(g.nodes(), function(v) {
    var node = g.getNode(v);
    node.y = -node.y;
  });
}

function swapWidthHeight(g) {
  _.each(g.nodes(), function(v) {
    var node = g.getNode(v),
        width = node.width,
        height = node.height;
    node.width = height;
    node.height = width;
  });
}

function swapXY(g) {
  _.each(g.nodes(), function(v) {
    var node = g.getNode(v),
        x = node.x,
        y = node.y;
    node.x = y;
    node.y = x;
  });
}
