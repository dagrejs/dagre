var _ = require("lodash");

module.exports = position;

function position(g) {
  // Temporarily simulate positioning...
  _.each(g.nodes(), function(node) {
    node.label.x = node.label.y = 0;
  });

  translate(g);
}

function translate(g) {
  var minX = Number.POSITIVE_INFINITY,
      maxX = 0,
      minY = Number.POSITIVE_INFINITY,
      maxY = 0,
      graphLabel = g.getGraph(),
      marginX = graphLabel.marginX || 0,
      marginY = graphLabel.marginY || 0;

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
