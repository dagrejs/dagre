"use strict";

import { Edge, Graph } from "@dagrejs/graphlib";

// @ts-ignore
import { slack } from "./util.js";

module.exports = feasibleTree;

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
function feasibleTree(g: Graph): Graph {
  const t = new Graph({ directed: false });

  // Choose arbitrary node from which to start our tree
  const start = g.nodes()[0];
  const size = g.nodeCount();
  t.setNode(start, {});

  while (tightTree(t, g) < size) {
    const edge = findMinSlackEdge(t, g);
    if (edge === null) {
      throw new Error(
        "failed to find min-slack edge to form rank-tight spanning tree"
      );
    }
    const delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
    shiftRanks(t, g, delta);
  }

  return t;
}

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
function tightTree(t: Graph, g: Graph) {
  function dfs(v: string) {
    g.nodeEdges(v)!.forEach((e) => {
      const edgeV = e.v;
      const w = v === edgeV ? e.w : edgeV;
      if (!t.hasNode(w) && !slack(g, e)) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  }

  t.nodes().forEach(dfs);
  return t.nodeCount();
}

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
function findMinSlackEdge(t: Graph, g: Graph): Edge | null {
  const edges = g.edges();

  return edges.reduce(
    (acc: [number, null | Edge], edge: Edge): [number, null | Edge] => {
      let edgeSlack = Number.POSITIVE_INFINITY;
      if (t.hasNode(edge.v) !== t.hasNode(edge.w)) {
        edgeSlack = slack(g, edge);
      }

      if (edgeSlack < acc[0]) {
        return [edgeSlack, edge];
      }

      return acc;
    },
    [Number.POSITIVE_INFINITY, null]
  )[1];
}

function shiftRanks(t: Graph, g: Graph, delta: number) {
  t.nodes().forEach((v) => (g.node(v).rank += delta));
}
