var _ = require("lodash"),
    util = require("../util"),
    positionX = require("./bk").positionX;

module.exports = {
  run: position
};

var DEFAULT_RANK_SEP = 20;

function position(g) {
  positionY(g);
  _.each(positionX(g), function(x, v) {
    g.getNode(v).x = x;
  });
  translate(g);
}

function positionY(g) {
  var layering = util.buildLayerMatrix(g),
      rankSep = _.has(g.getGraph(), "ranksep") ? g.getGraph().ranksep : DEFAULT_RANK_SEP,
      prevY = 0,
      nextY;
  _.each(layering, function(layer) {
    nextY = prevY;
    _.each(layer, function(v) {
      var node = g.getNode(v);
      node.y = prevY + node.height / 2;
      nextY = Math.max(nextY, prevY + node.height);
    });
    prevY = nextY + rankSep;
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

  _.each(g.nodes(), function(node) {
    var x = node.label.x,
        y = node.label.y,
        w = node.label.width,
        h = node.label.height;
    minX = Math.min(minX, x - w / 2);
    maxX = Math.max(maxX, x + w / 2);
    minY = Math.min(minY, y - h / 2);
    maxY = Math.max(maxY, y + h / 2);
  });

  minX -= marginX;
  minY -= marginY;

  _.each(g.nodes(), function(node) {
    node.label.x -= minX;
    node.label.y -= minY;
  });

  graphLabel.width = maxX - minX + marginX;
  graphLabel.height = maxY - minY + marginY;
}
