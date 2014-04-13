var util = require('../util'),
    Digraph = require('graphlib').Digraph,
    nodesFromList = require('graphlib').filter.nodesFromList,
    topsort = require('graphlib').alg.topsort;

module.exports = sortLayer;

function sortLayer(g, cg, weights) {
  if (!cg) { cg = new Digraph(); }

  // Filter the input constraint graph to only those nodes in this layer.
  var layerCG = cg.filterNodes(nodesFromList(g.nodes()));

  // Adjust the weights of nodes so that we can try to preserve the position of
  // nodes with no weights (i.e. nodes with no incoming edges).
  weights = adjustWeights(g, weights);

  // Start descending through the layers subgraphs.
  var result = sortLayerSubgraph(g, null, layerCG, weights);

  // Now iterate through the final list of sorted nodes. We use this info to
  // set the `order` attribute.
  result.list.forEach(function(u, i) {
    g.node(u).order = i;
  });

  // Merge the updates with the original constraint graph.
  return mergeDigraphs(cg, result.cg);
}

function sortLayerSubgraph(g, sg, layerCG, weights) {
  var subgraphCG = layerCG.filterNodes(function(u) { return g.parent(u) === sg; }),
      idGen = util.idGen('_omn'),
      nodeData = {};

  // Calculate the barycenter for each child of this subgraph, descending
  // recursively into subgraphs, as needed.
  g.children(sg).forEach(function(u) {
    if (g.children(u).length) {
      var result = nodeData[u] = sortLayerSubgraph(g, u, layerCG, weights);
      result.firstSG = u;
      result.lastSG = u;
    } else {
      var ws = weights[u];
      nodeData[u] = {
        degree: ws.length,
        barycenter: util.sum(ws) / ws.length,
        list: [u],
        origOrder: g.node(u).order,
        origOrderCount: 1
      };
    }
  });

  // Resolve any constraint violations that would come about from naively using
  // the calculated barycenters. We do this by rearranging conflicting nodes
  // and merging them into a larger node to preserve their order.
  resolveViolatedConstraints(g, subgraphCG, nodeData, idGen);

  // Sort all of the children per the adjusted barycenters.
  var keys = Object.keys(nodeData);
  keys.sort(function(x, y) {
    return nodeData[x].barycenter - nodeData[y].barycenter ||
           nodeData[x].origOrder - nodeData[y].origOrder;
  });

  // Join up all of the nodes in this layer into a single node.
  var result = keys.map(function(u) { return nodeData[u]; })
                   .reduce(function(lhs, rhs) { return mergeNodeData(g, lhs, rhs); });

  return result;
}

function mergeNodeData(g, lhs, rhs) {
  var cg = mergeDigraphs(lhs.cg, rhs.cg);

  if (lhs.lastSG !== undefined && rhs.firstSG !== undefined) {
    if (cg === undefined) {
      cg = new Digraph();
    }

    if (!cg.hasNode(lhs.lastSG)) { cg.addNode(lhs.lastSG); }
    if (!cg.hasNode(rhs.firstSG)) { cg.addNode(rhs.firstSG); }
    cg.addEdge(null, lhs.lastSG, rhs.firstSG);
  }

  return {
    degree: lhs.degree + rhs.degree,
    barycenter: (lhs.barycenter * lhs.degree + rhs.barycenter * rhs.degree) /
                (lhs.degree + rhs.degree),
    list: lhs.list.concat(rhs.list),
    origOrder: (lhs.origOrder * lhs.origOrderCount + rhs.origOrder * rhs.origOrderCount) /
           (lhs.origOrderCount + rhs.origOrderCount),
    origOrderCount: lhs.origOrderCount + rhs.origOrderCount,
    firstSG: lhs.firstSG !== undefined ? lhs.firstSG : rhs.firstSG,
    lastSG: rhs.lastSG !== undefined ? rhs.lastSG : lhs.lastSG,
    cg: cg
  };
}

function mergeDigraphs(lhs, rhs) {
  if (lhs === undefined) return rhs;
  if (rhs === undefined) return lhs;

  var dest = lhs.copy();
  rhs.eachNode(function(u) { if (!dest.hasNode(u)) dest.addNode(u); });
  rhs.eachEdge(function(e, u, v) { dest.addEdge(null, u, v); });
  return dest;
}

function resolveViolatedConstraints(g, cg, nodeData, idGen) {
  // Removes nodes `u` and `v` from `cg` and makes any edges incident on them
  // incident on `w` instead.
  function collapseNodes(u, v, w) {
    cg.inEdges(u).forEach(function(e) {
      cg.addEdge(null, cg.source(e), w);
      cg.delEdge(e);
    });

    cg.inEdges(v).forEach(function(e) {
      cg.addEdge(null, cg.source(e), w);
      cg.delEdge(e);
    });

    cg.outEdges(u).forEach(function(e) {
      cg.addEdge(null, w, cg.target(e));
      cg.delEdge(e);
    });

    cg.outEdges(v).forEach(function(e) {
      cg.addEdge(null, w, cg.target(e));
      cg.delEdge(e);
    });

    cg.outEdges(w, w).forEach(function(e) {
      cg.delEdge(e);
    });

    cg.delNode(u);
    cg.delNode(v);
  }

  var violated;
  while ((violated = findViolatedConstraint(cg, nodeData)) !== undefined) {
    var source = cg.source(violated),
        target = cg.target(violated);

    var v = cg.addNode(idGen());

    // Collapse barycenter and list
    nodeData[v] = mergeNodeData(g, nodeData[source], nodeData[target]);
    delete nodeData[source];
    delete nodeData[target];

    collapseNodes(source, target, v);
    if (cg.incidentEdges(v).length === 0) { cg.delNode(v); }
  }
}

function findViolatedConstraint(cg, nodeData) {
  var us = topsort(cg);
  for (var i = 0; i < us.length; ++i) {
    var u = us[i];
    var inEdges = cg.inEdges(u);
    for (var j = 0; j < inEdges.length; ++j) {
      var e = inEdges[j];
      if (nodeData[cg.source(e)].barycenter >= nodeData[u].barycenter) {
        return e;
      }
    }
  }
}

// Adjust weights so that they fall in the range of 0..|N|-1. If a node has no
// weight assigned then set its adjusted weight to its current position. This
// allows us to better retain the origiinal position of nodes without neighbors.
function adjustWeights(g, weights) {
  var minW = Number.MAX_VALUE,
      maxW = 0,
      adjusted = {};
  g.eachNode(function(u) {
    if (g.children(u).length) return;

    var ws = weights[u];
    if (ws.length) {
      minW = Math.min(minW, util.min(ws));
      maxW = Math.max(maxW, util.max(ws));
    }
  });

  var rangeW = (maxW - minW);
  g.eachNode(function(u) {
    if (g.children(u).length) return;

    var ws = weights[u];
    if (!ws.length) {
      adjusted[u] = [g.node(u).order];
    } else {
      adjusted[u] = ws.map(function(w) {
        if (rangeW) {
          return (w - minW) * (g.order() - 1) / rangeW;
        } else {
          return g.order() - 1 / 2;
        }
      });
    }
  });

  return adjusted;
}
