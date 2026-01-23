"use strict";

let util = require("../util");
let positionX = require("./bk").positionX;

module.exports = position;

function position(g) {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  Object.entries(positionX(g)).forEach(([v, x]) => g.node(v).x = x);
}

function positionY(g) {
  let layering = util.buildLayerMatrix(g);
  let rankSep = g.graph().ranksep;
  let rankAlign = g.graph().rankalign;
  let prevY = 0;
  layering.forEach(layer => {
    const maxHeight = layer.reduce((acc, v) => {
      const height = g.node(v).height;
      if (acc > height) {
        return acc;
      } else {
        return height;
      }
    }, 0);
    layer.forEach(v => {
      let node = g.node(v);
      if (rankAlign === "top") {
        node.y = prevY + node.height / 2;
      } else if (rankAlign === "bottom") {
        node.y = prevY + maxHeight - node.height / 2;
      } else {
        node.y = prevY + maxHeight / 2;
      }
    });
    prevY += maxHeight + rankSep;
  });
}
