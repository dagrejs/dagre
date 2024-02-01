"use strict";

import  * as util from "../util.js";
import { positionX as positionX } from "./bk.js";

export default function position(g) {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  Object.entries(positionX(g)).forEach(([v, x]) => g.node(v).x = x);
}

function positionY(g) {
  let layering = util.buildLayerMatrix(g);
  let rankSep = g.graph().ranksep;
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
    layer.forEach(v => g.node(v).y = prevY + maxHeight / 2);
    prevY += maxHeight + rankSep;
  });
}

