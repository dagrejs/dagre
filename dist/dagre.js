"use strict";
var dagre = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // index.ts
  var index_exports = {};
  __export(index_exports, {
    Graph: () => import_graphlib2.Graph,
    debug: () => debugOrdering,
    default: () => index_default,
    graphlib: () => graphlib,
    layout: () => layout,
    util: () => util,
    version: () => version
  });
  var graphlib = __toESM(__require("@dagrejs/graphlib"));

  // lib/graph-lib.ts
  var import_graphlib = __require("@dagrejs/graphlib");

  // lib/util.ts
  function addDummyNode(graph, type, attrs, name) {
    let v = name;
    while (graph.hasNode(v)) {
      v = uniqueId(name);
    }
    attrs.dummy = type;
    graph.setNode(v, attrs);
    return v;
  }
  function simplify(graph) {
    const simplified = new import_graphlib.Graph().setGraph(graph.graph());
    graph.nodes().forEach((v) => simplified.setNode(v, graph.node(v)));
    graph.edges().forEach((e) => {
      const simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
      const label = graph.edge(e);
      simplified.setEdge(e.v, e.w, {
        weight: simpleLabel.weight + label.weight,
        minlen: Math.max(simpleLabel.minlen, label.minlen)
      });
    });
    return simplified;
  }
  function asNonCompoundGraph(graph) {
    const simplified = new import_graphlib.Graph({ multigraph: graph.isMultigraph() }).setGraph(graph.graph());
    graph.nodes().forEach((v) => {
      if (!graph.children(v).length) {
        simplified.setNode(v, graph.node(v));
      }
    });
    graph.edges().forEach((e) => {
      simplified.setEdge(e, graph.edge(e));
    });
    return simplified;
  }
  function intersectRect(rect, point) {
    const x = rect.x;
    const y = rect.y;
    const dx = point.x - x;
    const dy = point.y - y;
    let w = rect.width / 2;
    let h = rect.height / 2;
    if (!dx && !dy) {
      throw new Error("Not possible to find intersection inside of the rectangle");
    }
    let sx, sy;
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      if (dy < 0) {
        h = -h;
      }
      sx = h * dx / dy;
      sy = h;
    } else {
      if (dx < 0) {
        w = -w;
      }
      sx = w;
      sy = w * dy / dx;
    }
    return { x: x + sx, y: y + sy };
  }
  function buildLayerMatrix(graph) {
    const layering = range(maxRank(graph) + 1).map(() => []);
    graph.nodes().forEach((v) => {
      const node = graph.node(v);
      const rank2 = node.rank;
      if (rank2 !== void 0) {
        if (!layering[rank2]) {
          layering[rank2] = [];
        }
        layering[rank2][node.order] = v;
      }
    });
    return layering;
  }
  function normalizeRanks(graph) {
    const nodeRanks = graph.nodes().map((v) => {
      const rank2 = graph.node(v).rank;
      if (rank2 === void 0) {
        return Number.MAX_VALUE;
      }
      return rank2;
    });
    const min = applyWithChunking(Math.min, nodeRanks);
    graph.nodes().forEach((v) => {
      const node = graph.node(v);
      if (Object.hasOwn(node, "rank")) {
        node.rank -= min;
      }
    });
  }
  function removeEmptyRanks(graph) {
    const nodeRanks = graph.nodes().map((v) => graph.node(v).rank).filter((rank2) => rank2 !== void 0);
    const offset = applyWithChunking(Math.min, nodeRanks);
    const layers = [];
    graph.nodes().forEach((v) => {
      const rank2 = graph.node(v).rank - offset;
      if (!layers[rank2]) {
        layers[rank2] = [];
      }
      layers[rank2].push(v);
    });
    let delta = 0;
    const nodeRankFactor = graph.graph().nodeRankFactor;
    Array.from(layers).forEach((vs, i) => {
      if (vs === void 0 && i % nodeRankFactor !== 0) {
        --delta;
      } else if (vs !== void 0 && delta) {
        vs.forEach((v) => graph.node(v).rank += delta);
      }
    });
  }
  function addBorderNode(graph, prefix, rank2, order2) {
    const node = {
      width: 0,
      height: 0
    };
    if (arguments.length >= 4) {
      node.rank = rank2;
      node.order = order2;
    }
    return addDummyNode(graph, "border", node, prefix);
  }
  function splitToChunks(array, chunkSize = CHUNKING_THRESHOLD) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      chunks.push(chunk);
    }
    return chunks;
  }
  var CHUNKING_THRESHOLD = 65535;
  function applyWithChunking(fn, argsArray) {
    if (argsArray.length > CHUNKING_THRESHOLD) {
      const chunks = splitToChunks(argsArray);
      return fn(...chunks.map((chunk) => fn(...chunk)));
    } else {
      return fn(...argsArray);
    }
  }
  function maxRank(graph) {
    const nodes = graph.nodes();
    const nodeRanks = nodes.map((v) => {
      const rank2 = graph.node(v).rank;
      if (rank2 === void 0) {
        return Number.MIN_VALUE;
      }
      return rank2;
    });
    return applyWithChunking(Math.max, nodeRanks);
  }
  function partition(collection, fn) {
    const result = { lhs: [], rhs: [] };
    collection.forEach((value) => {
      if (fn(value)) {
        result.lhs.push(value);
      } else {
        result.rhs.push(value);
      }
    });
    return result;
  }
  function time(name, fn) {
    const start = Date.now();
    try {
      return fn();
    } finally {
      console.log(name + " time: " + (Date.now() - start) + "ms");
    }
  }
  function notime(name, fn) {
    return fn();
  }
  var idCounter = 0;
  function uniqueId(prefix) {
    const id = ++idCounter;
    return prefix + ("" + id);
  }
  function range(start, limit, step = 1) {
    if (limit == null) {
      limit = start;
      start = 0;
    }
    let endCon = (i) => i < limit;
    if (step < 0) {
      endCon = (i) => limit < i;
    }
    const range3 = [];
    for (let i = start; endCon(i); i += step) {
      range3.push(i);
    }
    return range3;
  }
  function pick(source, keys) {
    const dest = {};
    for (const key of keys) {
      if (source[key] !== void 0) {
        dest[key] = source[key];
      }
    }
    return dest;
  }
  function mapValues(obj, funcOrProp) {
    let func;
    if (typeof funcOrProp === "string") {
      func = (val) => val[funcOrProp];
    } else {
      func = funcOrProp;
    }
    return Object.entries(obj).reduce((acc, [k, v]) => {
      acc[k] = func(v, k);
      return acc;
    }, {});
  }
  function zipObject(props, values) {
    return props.reduce((acc, key, i) => {
      acc[key] = values[i];
      return acc;
    }, {});
  }
  var GRAPH_NODE = "\0";

  // lib/version.ts
  var version = "3.0.0-pre";

  // lib/data/list.ts
  var List = class {
    constructor() {
      __publicField(this, "_sentinel");
      const sentinel = {};
      sentinel._next = sentinel._prev = sentinel;
      this._sentinel = sentinel;
    }
    dequeue() {
      const sentinel = this._sentinel;
      const entry = sentinel._prev;
      if (entry !== sentinel) {
        unlink(entry);
        return entry;
      }
      return void 0;
    }
    enqueue(entry) {
      const sentinel = this._sentinel;
      if (entry._prev && entry._next) {
        unlink(entry);
      }
      entry._next = sentinel._next;
      sentinel._next._prev = entry;
      sentinel._next = entry;
      entry._prev = sentinel;
    }
    toString() {
      const strs = [];
      const sentinel = this._sentinel;
      let curr = sentinel._prev;
      while (curr !== sentinel) {
        strs.push(JSON.stringify(curr, filterOutLinks));
        curr = curr._prev;
      }
      return "[" + strs.join(", ") + "]";
    }
  };
  function unlink(entry) {
    entry._prev._next = entry._next;
    entry._next._prev = entry._prev;
    delete entry._next;
    delete entry._prev;
  }
  function filterOutLinks(k, v) {
    if (k !== "_next" && k !== "_prev") {
      return v;
    }
    return void 0;
  }
  var list_default = List;

  // lib/greedy-fas.ts
  var DEFAULT_WEIGHT_FN = () => 1;
  function greedyFAS(graph, weightFn) {
    if (graph.nodeCount() <= 1) {
      return [];
    }
    const state = buildState(graph, weightFn || DEFAULT_WEIGHT_FN);
    const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);
    return results.flatMap((edge) => graph.outEdges(edge.v, edge.w) || []);
  }
  function doGreedyFAS(g, buckets, zeroIdx) {
    var _a;
    let results = [];
    const sources = buckets[buckets.length - 1];
    const sinks = buckets[0];
    let entry;
    while (g.nodeCount()) {
      while (entry = sinks.dequeue()) {
        removeNode(g, buckets, zeroIdx, entry);
      }
      while (entry = sources.dequeue()) {
        removeNode(g, buckets, zeroIdx, entry);
      }
      if (g.nodeCount()) {
        for (let i = buckets.length - 2; i > 0; --i) {
          entry = (_a = buckets[i]) == null ? void 0 : _a.dequeue();
          if (entry) {
            results = results.concat(removeNode(g, buckets, zeroIdx, entry, true) || []);
            break;
          }
        }
      }
    }
    return results;
  }
  function removeNode(graph, buckets, zeroIdx, entry, collectPredecessors) {
    const collected = [];
    const results = collectPredecessors ? collected : void 0;
    (graph.inEdges(entry.v) || []).forEach((edge) => {
      const weight = graph.edge(edge);
      const uEntry = graph.node(edge.v);
      if (collectPredecessors) {
        collected.push({ v: edge.v, w: edge.w });
      }
      uEntry.out -= weight;
      assignBucket(buckets, zeroIdx, uEntry);
    });
    (graph.outEdges(entry.v) || []).forEach((edge) => {
      const weight = graph.edge(edge);
      const w = edge.w;
      const wEntry = graph.node(w);
      wEntry.in -= weight;
      assignBucket(buckets, zeroIdx, wEntry);
    });
    graph.removeNode(entry.v);
    return results;
  }
  function buildState(graph, weightFn) {
    const fasGraph = new import_graphlib.Graph();
    let maxIn = 0;
    let maxOut = 0;
    graph.nodes().forEach((v) => {
      fasGraph.setNode(v, { v, in: 0, out: 0 });
    });
    graph.edges().forEach((edge) => {
      const prevWeight = fasGraph.edge(edge.v, edge.w) || 0;
      const weight = weightFn(edge);
      const edgeWeight = prevWeight + weight;
      fasGraph.setEdge(edge.v, edge.w, edgeWeight);
      const vNode = fasGraph.node(edge.v);
      const wNode = fasGraph.node(edge.w);
      maxOut = Math.max(maxOut, vNode.out += weight);
      maxIn = Math.max(maxIn, wNode.in += weight);
    });
    const buckets = range2(maxOut + maxIn + 3).map(() => new list_default());
    const zeroIdx = maxIn + 1;
    fasGraph.nodes().forEach((v) => {
      assignBucket(buckets, zeroIdx, fasGraph.node(v));
    });
    return { graph: fasGraph, buckets, zeroIdx };
  }
  function assignBucket(buckets, zeroIdx, entry) {
    var _a, _b, _c;
    if (!entry.out) {
      (_a = buckets[0]) == null ? void 0 : _a.enqueue(entry);
    } else if (!entry.in) {
      (_b = buckets[buckets.length - 1]) == null ? void 0 : _b.enqueue(entry);
    } else {
      (_c = buckets[entry.out - entry.in + zeroIdx]) == null ? void 0 : _c.enqueue(entry);
    }
  }
  function range2(limit) {
    const range3 = [];
    for (let i = 0; i < limit; i++) {
      range3.push(i);
    }
    return range3;
  }

  // lib/acyclic.ts
  function run(graph) {
    const fas = graph.graph().acyclicer === "greedy" ? greedyFAS(graph, weightFn(graph)) : dfsFAS(graph);
    fas.forEach((e) => {
      const label = graph.edge(e);
      graph.removeEdge(e);
      label.forwardName = e.name;
      label.reversed = true;
      graph.setEdge(e.w, e.v, label, uniqueId("rev"));
    });
    function weightFn(g) {
      return (e) => {
        return g.edge(e).weight;
      };
    }
  }
  function dfsFAS(graph) {
    const fas = [];
    const stack = {};
    const visited = {};
    function dfs2(v) {
      if (Object.hasOwn(visited, v)) {
        return;
      }
      visited[v] = true;
      stack[v] = true;
      graph.outEdges(v).forEach((e) => {
        if (Object.hasOwn(stack, e.w)) {
          fas.push(e);
        } else {
          dfs2(e.w);
        }
      });
      delete stack[v];
    }
    graph.nodes().forEach(dfs2);
    return fas;
  }
  function undo(graph) {
    graph.edges().forEach((e) => {
      const label = graph.edge(e);
      if (label.reversed) {
        graph.removeEdge(e);
        const forwardName = label.forwardName;
        delete label.reversed;
        delete label.forwardName;
        graph.setEdge(e.w, e.v, label, forwardName);
      }
    });
  }

  // lib/normalize.ts
  function run2(graph) {
    graph.graph().dummyChains = [];
    graph.edges().forEach((edge) => normalizeEdge(graph, edge));
  }
  function normalizeEdge(graph, e) {
    let v = e.v;
    let vRank = graph.node(v).rank;
    const w = e.w;
    const wRank = graph.node(w).rank;
    const name = e.name;
    const edgeLabel = graph.edge(e);
    const labelRank = edgeLabel.labelRank;
    if (wRank === vRank + 1) return;
    graph.removeEdge(e);
    let dummy;
    let attrs;
    let i;
    for (i = 0, ++vRank; vRank < wRank; ++i, ++vRank) {
      edgeLabel.points = [];
      attrs = {
        width: 0,
        height: 0,
        edgeLabel,
        edgeObj: e,
        rank: vRank
      };
      dummy = addDummyNode(graph, "edge", attrs, "_d");
      if (vRank === labelRank) {
        attrs.width = edgeLabel.width;
        attrs.height = edgeLabel.height;
        attrs.dummy = "edge-label";
        attrs.labelpos = edgeLabel.labelpos;
      }
      graph.setEdge(v, dummy, { weight: edgeLabel.weight }, name);
      if (i === 0) {
        graph.graph().dummyChains.push(dummy);
      }
      v = dummy;
    }
    graph.setEdge(v, w, { weight: edgeLabel.weight }, name);
  }
  function undo2(graph) {
    graph.graph().dummyChains.forEach((v) => {
      let node = graph.node(v);
      const origLabel = node.edgeLabel;
      let w;
      graph.setEdge(node.edgeObj, origLabel);
      while (node.dummy) {
        w = graph.successors(v)[0];
        graph.removeNode(v);
        origLabel.points.push({ x: node.x, y: node.y });
        if (node.dummy === "edge-label") {
          origLabel.x = node.x;
          origLabel.y = node.y;
          origLabel.width = node.width;
          origLabel.height = node.height;
        }
        v = w;
        node = graph.node(v);
      }
    });
  }

  // lib/rank/util.ts
  function longestPath(graph) {
    const visited = {};
    function dfs2(v) {
      const label = graph.node(v);
      if (Object.hasOwn(visited, v)) {
        return label.rank;
      }
      visited[v] = true;
      const outEdges = graph.outEdges(v);
      const outEdgesMinLens = outEdges ? outEdges.map((e) => {
        if (e == null) {
          return Number.POSITIVE_INFINITY;
        }
        return dfs2(e.w) - graph.edge(e).minlen;
      }) : [];
      let rank2 = applyWithChunking(Math.min, outEdgesMinLens);
      if (rank2 === Number.POSITIVE_INFINITY) {
        rank2 = 0;
      }
      return label.rank = rank2;
    }
    graph.sources().forEach(dfs2);
  }
  function slack(graph, edge) {
    return graph.node(edge.w).rank - graph.node(edge.v).rank - graph.edge(edge).minlen;
  }

  // lib/rank/feasible-tree.ts
  var feasible_tree_default = feasibleTree;
  function feasibleTree(graph) {
    const tree = new import_graphlib.Graph({ directed: false });
    const nodes = graph.nodes();
    if (nodes.length === 0) {
      throw new Error("Graph must have at least one node");
    }
    const start = nodes[0];
    const size = graph.nodeCount();
    tree.setNode(start, {});
    let edge;
    let delta;
    while (tightTree(tree, graph) < size) {
      edge = findMinSlackEdge(tree, graph);
      if (!edge) break;
      delta = tree.hasNode(edge.v) ? slack(graph, edge) : -slack(graph, edge);
      shiftRanks(tree, graph, delta);
    }
    return tree;
  }
  function tightTree(tree, graph) {
    function dfs2(v) {
      const nodeEdges = graph.nodeEdges(v);
      if (nodeEdges) {
        nodeEdges.forEach((e) => {
          const edgeV = e.v;
          const w = v === edgeV ? e.w : edgeV;
          if (!tree.hasNode(w) && !slack(graph, e)) {
            tree.setNode(w, {});
            tree.setEdge(v, w, {});
            dfs2(w);
          }
        });
      }
    }
    tree.nodes().forEach(dfs2);
    return tree.nodeCount();
  }
  function findMinSlackEdge(tree, graph) {
    const edges = graph.edges();
    return edges.reduce((acc, edge) => {
      let edgeSlack = Number.POSITIVE_INFINITY;
      if (tree.hasNode(edge.v) !== tree.hasNode(edge.w)) {
        edgeSlack = slack(graph, edge);
      }
      if (edgeSlack < acc[0]) {
        return [edgeSlack, edge];
      }
      return acc;
    }, [Number.POSITIVE_INFINITY, null])[1];
  }
  function shiftRanks(tree, graph, delta) {
    tree.nodes().forEach((v) => graph.node(v).rank += delta);
  }

  // lib/rank/network-simplex.ts
  var { preorder, postorder } = import_graphlib.alg;
  var network_simplex_default = networkSimplex;
  networkSimplex.initLowLimValues = initLowLimValues;
  networkSimplex.initCutValues = initCutValues;
  networkSimplex.calcCutValue = calcCutValue;
  networkSimplex.leaveEdge = leaveEdge;
  networkSimplex.enterEdge = enterEdge;
  networkSimplex.exchangeEdges = exchangeEdges;
  function networkSimplex(graph) {
    graph = simplify(graph);
    longestPath(graph);
    const t = feasible_tree_default(graph);
    initLowLimValues(t);
    initCutValues(t, graph);
    let e;
    let f;
    while (e = leaveEdge(t)) {
      f = enterEdge(t, graph, e);
      exchangeEdges(t, graph, e, f);
    }
  }
  function initCutValues(tree, graph) {
    let visitedNodes = postorder(tree, tree.nodes());
    visitedNodes = visitedNodes.slice(0, visitedNodes.length - 1);
    visitedNodes.forEach((v) => assignCutValue(tree, graph, v));
  }
  function assignCutValue(tree, graph, child) {
    const childLab = tree.node(child);
    const parent = childLab.parent;
    const edge = tree.edge(child, parent);
    edge.cutvalue = calcCutValue(tree, graph, child);
  }
  function calcCutValue(tree, graph, child) {
    const childLab = tree.node(child);
    const parent = childLab.parent;
    let childIsTail = true;
    let graphEdge = graph.edge(child, parent);
    let cutValue = 0;
    if (!graphEdge) {
      childIsTail = false;
      graphEdge = graph.edge(parent, child);
    }
    cutValue = graphEdge.weight;
    const nodeEdges = graph.nodeEdges(child);
    if (nodeEdges) {
      nodeEdges.forEach((edge) => {
        const isOutEdge = edge.v === child;
        const other = isOutEdge ? edge.w : edge.v;
        if (other !== parent) {
          const pointsToHead = isOutEdge === childIsTail;
          const otherWeight = graph.edge(edge).weight;
          cutValue += pointsToHead ? otherWeight : -otherWeight;
          if (isTreeEdge(tree, child, other)) {
            const treeEdge = tree.edge(child, other);
            const otherCutValue = treeEdge.cutvalue;
            cutValue += pointsToHead ? -otherCutValue : otherCutValue;
          }
        }
      });
    }
    return cutValue;
  }
  function initLowLimValues(tree, root) {
    if (arguments.length < 2) {
      root = tree.nodes()[0];
    }
    dfsAssignLowLim(tree, {}, 1, root);
  }
  function dfsAssignLowLim(tree, visited, nextLim, v, parent) {
    const low = nextLim;
    const label = tree.node(v);
    visited[v] = true;
    const neighbors = tree.neighbors(v);
    if (neighbors) {
      neighbors.forEach((w) => {
        if (!Object.hasOwn(visited, w)) {
          nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
        }
      });
    }
    label.low = low;
    label.lim = nextLim++;
    if (parent) {
      label.parent = parent;
    } else {
      delete label.parent;
    }
    return nextLim;
  }
  function leaveEdge(tree) {
    return tree.edges().find((e) => {
      const edge = tree.edge(e);
      return edge.cutvalue < 0;
    });
  }
  function enterEdge(tree, graph, edge) {
    let v = edge.v;
    let w = edge.w;
    if (!graph.hasEdge(v, w)) {
      v = edge.w;
      w = edge.v;
    }
    const vLabel = tree.node(v);
    const wLabel = tree.node(w);
    let tailLabel = vLabel;
    let flip = false;
    if (vLabel.lim > wLabel.lim) {
      tailLabel = wLabel;
      flip = true;
    }
    const candidates = graph.edges().filter((edge2) => {
      return flip === isDescendant(tree, tree.node(edge2.v), tailLabel) && flip !== isDescendant(tree, tree.node(edge2.w), tailLabel);
    });
    return candidates.reduce((acc, edge2) => {
      if (slack(graph, edge2) < slack(graph, acc)) {
        return edge2;
      }
      return acc;
    });
  }
  function exchangeEdges(t, g, e, f) {
    const v = e.v;
    const w = e.w;
    t.removeEdge(v, w);
    t.setEdge(f.v, f.w, {});
    initLowLimValues(t);
    initCutValues(t, g);
    updateRanks(t, g);
  }
  function updateRanks(t, g) {
    const root = t.nodes().find((v) => {
      const node = t.node(v);
      return !node.parent;
    });
    if (!root) return;
    let vs = preorder(t, [root]);
    vs = vs.slice(1);
    vs.forEach((v) => {
      const treeNode = t.node(v);
      const parent = treeNode.parent;
      let edge = g.edge(v, parent);
      let flipped = false;
      if (!edge) {
        edge = g.edge(parent, v);
        flipped = true;
      }
      g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
    });
  }
  function isTreeEdge(tree, u, v) {
    return tree.hasEdge(u, v);
  }
  function isDescendant(tree, vLabel, rootLabel) {
    return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
  }

  // lib/rank/index.ts
  var rank_default = rank;
  function rank(graph) {
    const ranker = graph.graph().ranker;
    if (typeof ranker === "function") {
      return ranker(graph);
    }
    switch (ranker) {
      case "network-simplex":
        networkSimplexRanker(graph);
        break;
      case "tight-tree":
        tightTreeRanker(graph);
        break;
      case "longest-path":
        longestPathRanker(graph);
        break;
      case "none":
        break;
      default:
        networkSimplexRanker(graph);
    }
  }
  var longestPathRanker = longestPath;
  function tightTreeRanker(g) {
    longestPath(g);
    feasible_tree_default(g);
  }
  function networkSimplexRanker(g) {
    network_simplex_default(g);
  }

  // lib/parent-dummy-chains.ts
  var parent_dummy_chains_default = parentDummyChains;
  function parentDummyChains(graph) {
    const postorderNums = postorder2(graph);
    graph.graph().dummyChains.forEach((v) => {
      let node = graph.node(v);
      const edgeObj = node.edgeObj;
      const pathData = findPath(graph, postorderNums, edgeObj.v, edgeObj.w);
      const path = pathData.path;
      const lca = pathData.lca;
      let pathIdx = 0;
      let pathV = path[pathIdx];
      let ascending = true;
      while (v !== edgeObj.w) {
        node = graph.node(v);
        if (ascending) {
          while ((pathV = path[pathIdx]) !== lca && graph.node(pathV).maxRank < node.rank) {
            pathIdx++;
          }
          if (pathV === lca) {
            ascending = false;
          }
        }
        if (!ascending) {
          while (pathIdx < path.length - 1 && graph.node(path[pathIdx + 1]).minRank <= node.rank) {
            pathIdx++;
          }
          pathV = path[pathIdx];
        }
        if (pathV !== void 0) {
          graph.setParent(v, pathV);
        }
        v = graph.successors(v)[0];
      }
    });
  }
  function findPath(graph, postorderNums, v, w) {
    const vPath = [];
    const wPath = [];
    const low = Math.min(postorderNums[v].low, postorderNums[w].low);
    const lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
    let parent;
    parent = v;
    do {
      parent = graph.parent(parent);
      vPath.push(parent);
    } while (parent && (postorderNums[parent].low > low || lim > postorderNums[parent].lim));
    const lca = parent;
    let wParent = w;
    while ((wParent = graph.parent(wParent)) !== lca) {
      wPath.push(wParent);
    }
    return { path: vPath.concat(wPath.reverse()), lca };
  }
  function postorder2(graph) {
    const result = {};
    let lim = 0;
    function dfs2(v) {
      const low = lim;
      graph.children(v).forEach(dfs2);
      result[v] = { low, lim: lim++ };
    }
    graph.children(GRAPH_NODE).forEach(dfs2);
    return result;
  }

  // lib/nesting-graph.ts
  function run3(graph) {
    const root = addDummyNode(graph, "root", {}, "_root");
    const depths = treeDepths(graph);
    const depthsArr = Object.values(depths);
    const height = applyWithChunking(Math.max, depthsArr) - 1;
    const nodeSep = 2 * height + 1;
    graph.graph().nestingRoot = root;
    graph.edges().forEach((e) => graph.edge(e).minlen *= nodeSep);
    const weight = sumWeights(graph) + 1;
    graph.children(GRAPH_NODE).forEach((child) => dfs(graph, root, nodeSep, weight, height, depths, child));
    graph.graph().nodeRankFactor = nodeSep;
  }
  function dfs(graph, root, nodeSep, weight, height, depths, v) {
    var _a;
    const children = graph.children(v);
    if (!children.length) {
      if (v !== root) {
        graph.setEdge(root, v, { weight: 0, minlen: nodeSep });
      }
      return;
    }
    const top = addBorderNode(graph, "_bt");
    const bottom = addBorderNode(graph, "_bb");
    const label = graph.node(v);
    graph.setParent(top, v);
    label.borderTop = top;
    graph.setParent(bottom, v);
    label.borderBottom = bottom;
    children.forEach((child) => {
      var _a2;
      dfs(graph, root, nodeSep, weight, height, depths, child);
      const childNode = graph.node(child);
      const childTop = childNode.borderTop ? childNode.borderTop : child;
      const childBottom = childNode.borderBottom ? childNode.borderBottom : child;
      const thisWeight = childNode.borderTop ? weight : 2 * weight;
      const minlen = childTop !== childBottom ? 1 : height - ((_a2 = depths[v]) != null ? _a2 : 0) + 1;
      graph.setEdge(top, childTop, {
        weight: thisWeight,
        minlen,
        nestingEdge: true
      });
      graph.setEdge(childBottom, bottom, {
        weight: thisWeight,
        minlen,
        nestingEdge: true
      });
    });
    if (!graph.parent(v)) {
      graph.setEdge(root, top, { weight: 0, minlen: height + ((_a = depths[v]) != null ? _a : 0) });
    }
  }
  function treeDepths(graph) {
    const depths = {};
    function dfs2(v, depth) {
      const children = graph.children(v);
      if (children && children.length) {
        children.forEach((child) => dfs2(child, depth + 1));
      }
      depths[v] = depth;
    }
    graph.children(GRAPH_NODE).forEach((v) => dfs2(v, 1));
    return depths;
  }
  function sumWeights(graph) {
    return graph.edges().reduce((acc, e) => acc + graph.edge(e).weight, 0);
  }
  function cleanup(graph) {
    const graphLabel = graph.graph();
    graph.removeNode(graphLabel.nestingRoot);
    delete graphLabel.nestingRoot;
    graph.edges().forEach((e) => {
      const edge = graph.edge(e);
      if (edge.nestingEdge) {
        graph.removeEdge(e);
      }
    });
  }

  // lib/add-border-segments.ts
  var add_border_segments_default = addBorderSegments;
  function addBorderSegments(graph) {
    function dfs2(v) {
      const children = graph.children(v);
      const node = graph.node(v);
      if (children.length) {
        children.forEach(dfs2);
      }
      if (Object.hasOwn(node, "minRank")) {
        node.borderLeft = [];
        node.borderRight = [];
        for (let rank2 = node.minRank, maxRank2 = node.maxRank + 1; rank2 < maxRank2; ++rank2) {
          addBorderNode2(graph, "borderLeft", "_bl", v, node, rank2);
          addBorderNode2(graph, "borderRight", "_br", v, node, rank2);
        }
      }
    }
    graph.children(GRAPH_NODE).forEach(dfs2);
  }
  function addBorderNode2(graph, prop, prefix, sg, sgNode, rank2) {
    const label = { width: 0, height: 0, rank: rank2, borderType: prop };
    const prev = sgNode[prop][rank2 - 1];
    const curr = addDummyNode(graph, "border", label, prefix);
    sgNode[prop][rank2] = curr;
    graph.setParent(curr, sg);
    if (prev) {
      graph.setEdge(prev, curr, { weight: 1 });
    }
  }

  // lib/coordinate-system.ts
  function adjust(graph) {
    var _a;
    const rankDir = (_a = graph.graph().rankdir) == null ? void 0 : _a.toLowerCase();
    if (rankDir === "lr" || rankDir === "rl") {
      swapWidthHeight(graph);
    }
  }
  function undo3(graph) {
    var _a;
    const rankDir = (_a = graph.graph().rankdir) == null ? void 0 : _a.toLowerCase();
    if (rankDir === "bt" || rankDir === "rl") {
      reverseY(graph);
    }
    if (rankDir === "lr" || rankDir === "rl") {
      swapXY(graph);
      swapWidthHeight(graph);
    }
  }
  function swapWidthHeight(graph) {
    graph.nodes().forEach((node) => swapWidthHeightOne(graph.node(node)));
    graph.edges().forEach((edge) => swapWidthHeightOne(graph.edge(edge)));
  }
  function swapWidthHeightOne(attrs) {
    const w = attrs.width;
    attrs.width = attrs.height;
    attrs.height = w;
  }
  function reverseY(graph) {
    graph.nodes().forEach((node) => reverseYOne(graph.node(node)));
    graph.edges().forEach((edge) => {
      var _a;
      const edgeLabel = graph.edge(edge);
      (_a = edgeLabel.points) == null ? void 0 : _a.forEach(reverseYOne);
      if (Object.hasOwn(edgeLabel, "y")) {
        reverseYOne(edgeLabel);
      }
    });
  }
  function reverseYOne(attrs) {
    attrs.y = -attrs.y;
  }
  function swapXY(graph) {
    graph.nodes().forEach((node) => swapXYOne(graph.node(node)));
    graph.edges().forEach((edge) => {
      var _a;
      const edgeLabel = graph.edge(edge);
      (_a = edgeLabel.points) == null ? void 0 : _a.forEach(swapXYOne);
      if (Object.hasOwn(edgeLabel, "x")) {
        swapXYOne(edgeLabel);
      }
    });
  }
  function swapXYOne(attrs) {
    const x = attrs.x;
    attrs.x = attrs.y;
    attrs.y = x;
  }

  // lib/order/init-order.ts
  function initOrder(graph) {
    const visited = {};
    const simpleNodes = graph.nodes().filter((v) => !graph.children(v).length);
    const simpleNodesRanks = simpleNodes.map((v) => graph.node(v).rank);
    const maxRank2 = applyWithChunking(Math.max, simpleNodesRanks);
    const layers = range(maxRank2 + 1).map(() => []);
    function dfs2(v) {
      if (visited[v]) return;
      visited[v] = true;
      const node = graph.node(v);
      layers[node.rank].push(v);
      const successors = graph.successors(v);
      if (successors) {
        successors.forEach(dfs2);
      }
    }
    const orderedVs = simpleNodes.sort((a, b) => graph.node(a).rank - graph.node(b).rank);
    orderedVs.forEach(dfs2);
    return layers;
  }

  // lib/order/cross-count.ts
  function crossCount(graph, layering) {
    let cc = 0;
    for (let i = 1; i < layering.length; ++i) {
      cc += twoLayerCrossCount(graph, layering[i - 1], layering[i]);
    }
    return cc;
  }
  function twoLayerCrossCount(graph, northLayer, southLayer) {
    const southPos = zipObject(southLayer, southLayer.map((v, i) => i));
    const southEntries = northLayer.flatMap((v) => {
      const edges = graph.outEdges(v);
      if (!edges) return [];
      return edges.map((e) => {
        return { pos: southPos[e.w], weight: graph.edge(e).weight };
      }).sort((a, b) => a.pos - b.pos);
    });
    let firstIndex = 1;
    while (firstIndex < southLayer.length) firstIndex <<= 1;
    const treeSize = 2 * firstIndex - 1;
    firstIndex -= 1;
    const tree = new Array(treeSize).fill(0);
    let cc = 0;
    southEntries.forEach((entry) => {
      let index = entry.pos + firstIndex;
      tree[index] += entry.weight;
      let weightSum = 0;
      while (index > 0) {
        if (index % 2) {
          weightSum += tree[index + 1];
        }
        index = index - 1 >> 1;
        tree[index] += entry.weight;
      }
      cc += entry.weight * weightSum;
    });
    return cc;
  }

  // lib/order/barycenter.ts
  function barycenter(graph, movable = []) {
    return movable.map((v) => {
      const inV = graph.inEdges(v);
      if (!inV || !inV.length) {
        return { v };
      } else {
        const result = inV.reduce((acc, e) => {
          const edge = graph.edge(e);
          const nodeU = graph.node(e.v);
          return {
            sum: acc.sum + edge.weight * nodeU.order,
            weight: acc.weight + edge.weight
          };
        }, { sum: 0, weight: 0 });
        return {
          v,
          barycenter: result.sum / result.weight,
          weight: result.weight
        };
      }
    });
  }

  // lib/order/resolve-conflicts.ts
  function resolveConflicts(entries, constraintGraph) {
    const mappedEntries = {};
    entries.forEach((entry, i) => {
      const tmp = {
        indegree: 0,
        "in": [],
        out: [],
        vs: [entry.v],
        i
      };
      if (entry.barycenter !== void 0) {
        tmp.barycenter = entry.barycenter;
        tmp.weight = entry.weight;
      }
      mappedEntries[entry.v] = tmp;
    });
    constraintGraph.edges().forEach((e) => {
      const entryV = mappedEntries[e.v];
      const entryW = mappedEntries[e.w];
      if (entryV !== void 0 && entryW !== void 0) {
        entryW.indegree++;
        entryV.out.push(entryW);
      }
    });
    const sourceSet = Object.values(mappedEntries).filter((entry) => !entry.indegree);
    return doResolveConflicts(sourceSet);
  }
  function doResolveConflicts(sourceSet) {
    const entries = [];
    function handleIn(vEntry) {
      return (uEntry) => {
        if (uEntry.merged) {
          return;
        }
        if (uEntry.barycenter === void 0 || vEntry.barycenter === void 0 || uEntry.barycenter >= vEntry.barycenter) {
          mergeEntries(vEntry, uEntry);
        }
      };
    }
    function handleOut(vEntry) {
      return (wEntry) => {
        wEntry["in"].push(vEntry);
        if (--wEntry.indegree === 0) {
          sourceSet.push(wEntry);
        }
      };
    }
    while (sourceSet.length) {
      const entry = sourceSet.pop();
      entries.push(entry);
      entry["in"].reverse().forEach(handleIn(entry));
      entry.out.forEach(handleOut(entry));
    }
    return entries.filter((entry) => !entry.merged).map((entry) => {
      return pick(entry, ["vs", "i", "barycenter", "weight"]);
    });
  }
  function mergeEntries(target, source) {
    let sum = 0;
    let weight = 0;
    if (target.weight) {
      sum += target.barycenter * target.weight;
      weight += target.weight;
    }
    if (source.weight) {
      sum += source.barycenter * source.weight;
      weight += source.weight;
    }
    target.vs = source.vs.concat(target.vs);
    target.barycenter = sum / weight;
    target.weight = weight;
    target.i = Math.min(source.i, target.i);
    source.merged = true;
  }

  // lib/order/sort.ts
  function sort(entries, biasRight) {
    const parts = partition(entries, (entry) => {
      return Object.hasOwn(entry, "barycenter");
    });
    const sortable = parts.lhs;
    const unsortable = parts.rhs.sort((a, b) => b.i - a.i);
    const vs = [];
    let sum = 0;
    let weight = 0;
    let vsIndex = 0;
    sortable.sort(compareWithBias(!!biasRight));
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    sortable.forEach((entry) => {
      vsIndex += entry.vs.length;
      vs.push(entry.vs);
      sum += entry.barycenter * entry.weight;
      weight += entry.weight;
      vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
    });
    const result = { vs: vs.flat(1) };
    if (weight) {
      result.barycenter = sum / weight;
      result.weight = weight;
    }
    return result;
  }
  function consumeUnsortable(vs, unsortable, index) {
    let last;
    while (unsortable.length && (last = unsortable[unsortable.length - 1]).i <= index) {
      unsortable.pop();
      vs.push(last.vs);
      index++;
    }
    return index;
  }
  function compareWithBias(bias) {
    return (entryV, entryW) => {
      if (entryV.barycenter < entryW.barycenter) {
        return -1;
      } else if (entryV.barycenter > entryW.barycenter) {
        return 1;
      }
      return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
    };
  }

  // lib/order/sort-subgraph.ts
  function sortSubgraph(graph, v, constraintGraph, biasRight) {
    let movable = graph.children(v);
    const node = graph.node(v);
    const bl = node ? node.borderLeft : void 0;
    const br = node ? node.borderRight : void 0;
    const subgraphs = {};
    if (bl) {
      movable = movable.filter((w) => w !== bl && w !== br);
    }
    const barycenters = barycenter(graph, movable);
    barycenters.forEach((entry) => {
      if (graph.children(entry.v).length) {
        const subgraphResult = sortSubgraph(graph, entry.v, constraintGraph, biasRight);
        subgraphs[entry.v] = subgraphResult;
        if (Object.hasOwn(subgraphResult, "barycenter")) {
          mergeBarycenters(entry, subgraphResult);
        }
      }
    });
    const entries = resolveConflicts(barycenters, constraintGraph);
    expandSubgraphs(entries, subgraphs);
    const result = sort(entries, biasRight);
    if (bl && br) {
      result.vs = [bl, result.vs, br].flat(1);
      const blPredecessors = graph.predecessors(bl);
      if (blPredecessors && blPredecessors.length) {
        const blPred = graph.node(blPredecessors[0]);
        const brPredecessors = graph.predecessors(br);
        const brPred = graph.node(brPredecessors[0]);
        if (!Object.hasOwn(result, "barycenter")) {
          result.barycenter = 0;
          result.weight = 0;
        }
        result.barycenter = (result.barycenter * result.weight + blPred.order + brPred.order) / (result.weight + 2);
        result.weight += 2;
      }
    }
    return result;
  }
  function expandSubgraphs(entries, subgraphs) {
    entries.forEach((entry) => {
      entry.vs = entry.vs.flatMap((v) => {
        if (subgraphs[v]) {
          return subgraphs[v].vs;
        }
        return v;
      });
    });
  }
  function mergeBarycenters(target, other) {
    if (target.barycenter !== void 0) {
      target.barycenter = (target.barycenter * target.weight + other.barycenter * other.weight) / (target.weight + other.weight);
      target.weight += other.weight;
    } else {
      target.barycenter = other.barycenter;
      target.weight = other.weight;
    }
  }

  // lib/order/build-layer-graph.ts
  function buildLayerGraph(graph, rank2, relationship, nodesWithRank) {
    if (!nodesWithRank) {
      nodesWithRank = graph.nodes();
    }
    const root = createRootNode(graph);
    const result = new import_graphlib.Graph({ compound: true }).setGraph({ root }).setDefaultNodeLabel((v) => graph.node(v));
    nodesWithRank.forEach((v) => {
      const node = graph.node(v);
      const parent = graph.parent(v);
      if (node.rank === rank2 || node.minRank <= rank2 && rank2 <= node.maxRank) {
        result.setNode(v);
        result.setParent(v, parent || root);
        const edges = graph[relationship](v);
        if (edges) {
          edges.forEach((e) => {
            const u = e.v === v ? e.w : e.v;
            const edge = result.edge(u, v);
            const weight = edge !== void 0 ? edge.weight : 0;
            result.setEdge(u, v, { weight: graph.edge(e).weight + weight });
          });
        }
        if (Object.hasOwn(node, "minRank")) {
          result.setNode(v, {
            borderLeft: node.borderLeft[rank2],
            borderRight: node.borderRight[rank2]
          });
        }
      }
    });
    return result;
  }
  function createRootNode(graph) {
    let v;
    while (graph.hasNode(v = uniqueId("_root"))) ;
    return v;
  }

  // lib/order/add-subgraph-constraints.ts
  function addSubgraphConstraints(graph, constraintGraph, vs) {
    const prev = {};
    let rootPrev;
    vs.forEach((v) => {
      let child = graph.parent(v);
      let parent;
      let prevChild;
      while (child) {
        parent = graph.parent(child);
        if (parent) {
          prevChild = prev[parent];
          prev[parent] = child;
        } else {
          prevChild = rootPrev;
          rootPrev = child;
        }
        if (prevChild && prevChild !== child) {
          constraintGraph.setEdge(prevChild, child);
          return;
        }
        child = parent;
      }
    });
  }

  // lib/order/index.ts
  function order(graph, opts = {}) {
    if (typeof opts.customOrder === "function") {
      opts.customOrder(graph, order);
      return;
    }
    const maxRank2 = maxRank(graph);
    const downLayerGraphs = buildLayerGraphs(graph, range(1, maxRank2 + 1), "inEdges");
    const upLayerGraphs = buildLayerGraphs(graph, range(maxRank2 - 1, -1, -1), "outEdges");
    let layering = initOrder(graph);
    assignOrder(graph, layering);
    if (opts.disableOptimalOrderHeuristic) {
      return;
    }
    let bestCC = Number.POSITIVE_INFINITY;
    let best;
    const constraints = opts.constraints || [];
    for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
      sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2, constraints);
      layering = buildLayerMatrix(graph);
      const cc = crossCount(graph, layering);
      if (cc < bestCC) {
        lastBest = 0;
        best = Object.assign({}, layering);
        bestCC = cc;
      } else if (cc === bestCC) {
        best = structuredClone(layering);
      }
    }
    assignOrder(graph, best);
  }
  function buildLayerGraphs(graph, ranks, relationship) {
    const nodesByRank = /* @__PURE__ */ new Map();
    const addNodeToRank = (rank2, node) => {
      if (!nodesByRank.has(rank2)) {
        nodesByRank.set(rank2, []);
      }
      nodesByRank.get(rank2).push(node);
    };
    for (const v of graph.nodes()) {
      const node = graph.node(v);
      if (typeof node.rank === "number") {
        addNodeToRank(node.rank, v);
      }
      if (typeof node.minRank === "number" && typeof node.maxRank === "number") {
        for (let r = node.minRank; r <= node.maxRank; r++) {
          if (r !== node.rank) {
            addNodeToRank(r, v);
          }
        }
      }
    }
    return ranks.map(function(rank2) {
      return buildLayerGraph(graph, rank2, relationship, nodesByRank.get(rank2) || []);
    });
  }
  function sweepLayerGraphs(layerGraphs, biasRight, constraints) {
    const cg = new import_graphlib.Graph();
    layerGraphs.forEach(function(lg) {
      constraints.forEach((con) => cg.setEdge(con.left, con.right));
      const root = lg.graph().root;
      const sorted = sortSubgraph(lg, root, cg, biasRight);
      sorted.vs.forEach((v, i) => lg.node(v).order = i);
      addSubgraphConstraints(lg, cg, sorted.vs);
    });
  }
  function assignOrder(graph, layering) {
    Object.values(layering).forEach((layer) => layer.forEach((v, i) => graph.node(v).order = i));
  }

  // lib/position/bk.ts
  function findType1Conflicts(graph, layering) {
    const conflicts = {};
    function visitLayer(prevLayer, layer) {
      let k0 = 0, scanPos = 0;
      const prevLayerLength = prevLayer.length, lastNode = layer[layer.length - 1];
      layer.forEach((v, i) => {
        const w = findOtherInnerSegmentNode(graph, v);
        const k1 = w ? graph.node(w).order : prevLayerLength;
        if (w || v === lastNode) {
          layer.slice(scanPos, i + 1).forEach((scanNode) => {
            const preds = graph.predecessors(scanNode);
            if (preds) {
              preds.forEach((u) => {
                const uLabel = graph.node(u);
                const uPos = uLabel.order;
                if ((uPos < k0 || k1 < uPos) && !(uLabel.dummy && graph.node(scanNode).dummy)) {
                  addConflict(conflicts, u, scanNode);
                }
              });
            }
          });
          scanPos = i + 1;
          k0 = k1;
        }
      });
      return layer;
    }
    if (layering.length) {
      layering.reduce(visitLayer);
    }
    return conflicts;
  }
  function findType2Conflicts(graph, layering) {
    const conflicts = {};
    function scan(south, southPos, southEnd, prevNorthBorder, nextNorthBorder) {
      range(southPos, southEnd).forEach((i) => {
        const v = south[i];
        if (v === void 0) return;
        if (graph.node(v).dummy) {
          const preds = graph.predecessors(v);
          if (preds) {
            preds.forEach((u) => {
              if (u === void 0) return;
              const uNode = graph.node(u);
              if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
                addConflict(conflicts, u, v);
              }
            });
          }
        }
      });
    }
    function visitLayer(north, south) {
      let prevNorthPos = -1;
      let nextNorthPos = -1;
      let southPos = 0;
      south.forEach((v, southLookahead) => {
        if (graph.node(v).dummy === "border") {
          const predecessors = graph.predecessors(v);
          if (predecessors && predecessors.length) {
            const firstPred = predecessors[0];
            if (firstPred === void 0) return;
            nextNorthPos = graph.node(firstPred).order;
            scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
            southPos = southLookahead;
            prevNorthPos = nextNorthPos;
          }
        }
        scan(south, southPos, south.length, nextNorthPos, north.length);
      });
      return south;
    }
    if (layering.length) {
      layering.reduce(visitLayer);
    }
    return conflicts;
  }
  function findOtherInnerSegmentNode(graph, v) {
    if (graph.node(v).dummy) {
      const preds = graph.predecessors(v);
      if (preds) {
        return preds.find((u) => graph.node(u).dummy);
      }
    }
    return void 0;
  }
  function addConflict(conflicts, v, w) {
    if (v > w) {
      const tmp = v;
      v = w;
      w = tmp;
    }
    let conflictsV = conflicts[v];
    if (!conflictsV) {
      conflicts[v] = conflictsV = {};
    }
    conflictsV[w] = true;
  }
  function hasConflict(conflicts, v, w) {
    if (v > w) {
      const tmp = v;
      v = w;
      w = tmp;
    }
    const conflictsV = conflicts[v];
    return conflictsV !== void 0 && Object.hasOwn(conflictsV, w);
  }
  function verticalAlignment(graph, layering, conflicts, neighborFn) {
    const root = {};
    const align = {};
    const pos = {};
    layering.forEach((layer) => {
      layer.forEach((v, order2) => {
        root[v] = v;
        align[v] = v;
        pos[v] = order2;
      });
    });
    layering.forEach((layer) => {
      let prevIdx = -1;
      layer.forEach((v) => {
        const wsRaw = neighborFn(v);
        if (wsRaw && wsRaw.length) {
          const ws = wsRaw.sort((a, b) => {
            const posA = pos[a];
            const posB = pos[b];
            return (posA !== void 0 ? posA : 0) - (posB !== void 0 ? posB : 0);
          });
          const mp = (ws.length - 1) / 2;
          for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
            const w = ws[i];
            if (w === void 0) continue;
            const posW = pos[w];
            if (posW !== void 0 && align[v] === v && prevIdx < posW && !hasConflict(conflicts, v, w)) {
              const rootW = root[w];
              if (rootW !== void 0) {
                align[w] = v;
                align[v] = root[v] = rootW;
                prevIdx = posW;
              }
            }
          }
        }
      });
    });
    return { root, align };
  }
  function horizontalCompaction(graph, layering, root, align, reverseSep = false) {
    const xs = {};
    const blockG = buildBlockGraph(graph, layering, root, reverseSep);
    const borderType = reverseSep ? "borderLeft" : "borderRight";
    function iterate(setXsFunc, nextNodesFunc) {
      const stack = blockG.nodes().slice();
      const visited = {};
      let elem = stack.pop();
      while (elem) {
        if (visited[elem]) {
          setXsFunc(elem);
        } else {
          visited[elem] = true;
          stack.push(elem);
          for (const nextElem of nextNodesFunc(elem)) {
            stack.push(nextElem);
          }
        }
        elem = stack.pop();
      }
    }
    function pass1(elem) {
      const inEdges = blockG.inEdges(elem);
      if (inEdges) {
        xs[elem] = inEdges.reduce((acc, e) => {
          var _a;
          const xsV = (_a = xs[e.v]) != null ? _a : 0;
          const edgeWeight = blockG.edge(e);
          return Math.max(acc, xsV + (edgeWeight !== void 0 ? edgeWeight : 0));
        }, 0);
      } else {
        xs[elem] = 0;
      }
    }
    function pass2(elem) {
      const outEdges = blockG.outEdges(elem);
      let min = Number.POSITIVE_INFINITY;
      if (outEdges) {
        min = outEdges.reduce((acc, e) => {
          const xsW = xs[e.w];
          const edgeWeight = blockG.edge(e);
          return Math.min(acc, (xsW !== void 0 ? xsW : 0) - (edgeWeight !== void 0 ? edgeWeight : 0));
        }, Number.POSITIVE_INFINITY);
      }
      const node = graph.node(elem);
      if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
        xs[elem] = Math.max(xs[elem] !== void 0 ? xs[elem] : 0, min);
      }
    }
    function predecessorsWrapper(elem) {
      return blockG.predecessors(elem) || [];
    }
    function successorsWrapper(elem) {
      return blockG.successors(elem) || [];
    }
    iterate(pass1, predecessorsWrapper);
    iterate(pass2, successorsWrapper);
    Object.keys(align).forEach((v) => {
      var _a;
      const rootV = root[v];
      if (rootV !== void 0) {
        xs[v] = (_a = xs[rootV]) != null ? _a : 0;
      }
    });
    return xs;
  }
  function buildBlockGraph(graph, layering, root, reverseSep) {
    const blockGraph = new import_graphlib.Graph();
    const graphLabel = graph.graph();
    const sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);
    layering.forEach((layer) => {
      let u;
      layer.forEach((v) => {
        const vRoot = root[v];
        if (vRoot !== void 0) {
          blockGraph.setNode(vRoot);
          if (u !== void 0) {
            const uRoot = root[u];
            if (uRoot !== void 0) {
              const prevMax = blockGraph.edge(uRoot, vRoot);
              blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(graph, v, u), prevMax || 0));
            }
          }
          u = v;
        }
      });
    });
    return blockGraph;
  }
  function findSmallestWidthAlignment(graph, xss) {
    return Object.values(xss).reduce((currentMinAndXs, xs) => {
      let max = Number.NEGATIVE_INFINITY;
      let min = Number.POSITIVE_INFINITY;
      Object.entries(xs).forEach(([v, x]) => {
        const halfWidth = width(graph, v) / 2;
        max = Math.max(x + halfWidth, max);
        min = Math.min(x - halfWidth, min);
      });
      const newMin = max - min;
      if (newMin < currentMinAndXs[0]) {
        currentMinAndXs = [newMin, xs];
      }
      return currentMinAndXs;
    }, [Number.POSITIVE_INFINITY, null])[1];
  }
  function alignCoordinates(xss, alignTo) {
    const alignToVals = Object.values(alignTo);
    const alignToMin = applyWithChunking(Math.min, alignToVals);
    const alignToMax = applyWithChunking(Math.max, alignToVals);
    ["u", "d"].forEach((vert) => {
      ["l", "r"].forEach((horiz) => {
        const alignment = vert + horiz;
        const xs = xss[alignment];
        if (!xs || xs === alignTo) return;
        const xsVals = Object.values(xs);
        let delta = alignToMin - applyWithChunking(Math.min, xsVals);
        if (horiz !== "l") {
          delta = alignToMax - applyWithChunking(Math.max, xsVals);
        }
        if (delta) {
          xss[alignment] = mapValues(xs, (x) => x + delta);
        }
      });
    });
  }
  function balance(xss, align = void 0) {
    const ulMap = xss.ul;
    if (!ulMap) {
      return {};
    }
    return mapValues(ulMap, (num, v) => {
      var _a, _b;
      if (align) {
        const alignmentKey = align.toLowerCase();
        const alignment = xss[alignmentKey];
        if (alignment && alignment[v] !== void 0) {
          return alignment[v];
        }
      }
      const xs = Object.values(xss).map((xs2) => {
        const val = xs2[v];
        return val !== void 0 ? val : 0;
      }).sort((a, b) => a - b);
      return (((_a = xs[1]) != null ? _a : 0) + ((_b = xs[2]) != null ? _b : 0)) / 2;
    });
  }
  function positionX(graph) {
    const layering = buildLayerMatrix(graph);
    const conflicts = Object.assign(
      findType1Conflicts(graph, layering),
      findType2Conflicts(graph, layering)
    );
    const xss = {};
    let adjustedLayering;
    ["u", "d"].forEach((vert) => {
      adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
      ["l", "r"].forEach((horiz) => {
        if (horiz === "r") {
          adjustedLayering = adjustedLayering.map((inner) => {
            return Object.values(inner).reverse();
          });
        }
        const neighborFn = (v) => {
          const result = vert === "u" ? graph.predecessors(v) : graph.successors(v);
          return result || [];
        };
        const align = verticalAlignment(graph, adjustedLayering, conflicts, neighborFn);
        let xs = horizontalCompaction(
          graph,
          adjustedLayering,
          align.root,
          align.align,
          horiz === "r"
        );
        if (horiz === "r") {
          xs = mapValues(xs, (x) => -x);
        }
        xss[vert + horiz] = xs;
      });
    });
    const smallestWidth = findSmallestWidthAlignment(graph, xss);
    alignCoordinates(xss, smallestWidth);
    return balance(xss, graph.graph().align);
  }
  function sep(nodeSep, edgeSep, reverseSep) {
    return (g, v, w) => {
      const vLabel = g.node(v);
      const wLabel = g.node(w);
      let sum = 0;
      let delta;
      sum += vLabel.width / 2;
      if (Object.hasOwn(vLabel, "labelpos")) {
        switch (vLabel.labelpos.toLowerCase()) {
          case "l":
            delta = -vLabel.width / 2;
            break;
          case "r":
            delta = vLabel.width / 2;
            break;
        }
      }
      if (delta) {
        sum += reverseSep ? delta : -delta;
      }
      delta = void 0;
      sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
      sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;
      sum += wLabel.width / 2;
      if (Object.hasOwn(wLabel, "labelpos")) {
        switch (wLabel.labelpos.toLowerCase()) {
          case "l":
            delta = wLabel.width / 2;
            break;
          case "r":
            delta = -wLabel.width / 2;
            break;
        }
      }
      if (delta) {
        sum += reverseSep ? delta : -delta;
      }
      return sum;
    };
  }
  function width(graph, v) {
    return graph.node(v).width;
  }

  // lib/position/index.ts
  function position(graph) {
    graph = asNonCompoundGraph(graph);
    positionY(graph);
    Object.entries(positionX(graph)).forEach(([v, x]) => graph.node(v).x = x);
  }
  function positionY(graph) {
    const layering = buildLayerMatrix(graph);
    const graphLabel = graph.graph();
    const rankSep = graphLabel.ranksep;
    const rankAlign = graphLabel.rankalign;
    let prevY = 0;
    layering.forEach((layer) => {
      const maxHeight = layer.reduce((acc, v) => {
        var _a;
        const height = (_a = graph.node(v).height) != null ? _a : 0;
        if (acc > height) {
          return acc;
        } else {
          return height;
        }
      }, 0);
      layer.forEach((v) => {
        const node = graph.node(v);
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

  // lib/layout.ts
  function layout(g, opts = {}) {
    const time2 = opts.debugTiming ? time : notime;
    return time2("layout", () => {
      const layoutGraph = time2("  buildLayoutGraph", () => buildLayoutGraph(g));
      time2("  runLayout", () => runLayout(layoutGraph, time2, opts));
      time2("  updateInputGraph", () => updateInputGraph(g, layoutGraph));
      return layoutGraph;
    });
  }
  function runLayout(g, time2, opts) {
    time2("    makeSpaceForEdgeLabels", () => makeSpaceForEdgeLabels(g));
    time2("    removeSelfEdges", () => removeSelfEdges(g));
    time2("    acyclic", () => run(g));
    time2("    nestingGraph.run", () => run3(g));
    time2("    rank", () => rank_default(asNonCompoundGraph(g)));
    time2("    injectEdgeLabelProxies", () => injectEdgeLabelProxies(g));
    time2("    removeEmptyRanks", () => removeEmptyRanks(g));
    time2("    nestingGraph.cleanup", () => cleanup(g));
    time2("    normalizeRanks", () => normalizeRanks(g));
    time2("    assignRankMinMax", () => assignRankMinMax(g));
    time2("    removeEdgeLabelProxies", () => removeEdgeLabelProxies(g));
    time2("    normalize.run", () => run2(g));
    time2("    parentDummyChains", () => parent_dummy_chains_default(g));
    time2("    addBorderSegments", () => add_border_segments_default(g));
    time2("    order", () => order(g, opts));
    time2("    insertSelfEdges", () => insertSelfEdges(g));
    time2("    adjustCoordinateSystem", () => adjust(g));
    time2("    position", () => position(g));
    time2("    positionSelfEdges", () => positionSelfEdges(g));
    time2("    removeBorderNodes", () => removeBorderNodes(g));
    time2("    normalize.undo", () => undo2(g));
    time2("    fixupEdgeLabelCoords", () => fixupEdgeLabelCoords(g));
    time2("    undoCoordinateSystem", () => undo3(g));
    time2("    translateGraph", () => translateGraph(g));
    time2("    assignNodeIntersects", () => assignNodeIntersects(g));
    time2("    reversePoints", () => reversePointsForReversedEdges(g));
    time2("    acyclic.undo", () => undo(g));
  }
  function updateInputGraph(inputGraph, layoutGraph) {
    inputGraph.nodes().forEach((v) => {
      const inputLabel = inputGraph.node(v);
      const layoutLabel = layoutGraph.node(v);
      if (inputLabel) {
        inputLabel.x = layoutLabel.x;
        inputLabel.y = layoutLabel.y;
        inputLabel.order = layoutLabel.order;
        inputLabel.rank = layoutLabel.rank;
        if (layoutGraph.children(v).length) {
          inputLabel.width = layoutLabel.width;
          inputLabel.height = layoutLabel.height;
        }
      }
    });
    inputGraph.edges().forEach((e) => {
      const inputLabel = inputGraph.edge(e);
      const layoutLabel = layoutGraph.edge(e);
      inputLabel.points = layoutLabel.points;
      if (Object.hasOwn(layoutLabel, "x")) {
        inputLabel.x = layoutLabel.x;
        inputLabel.y = layoutLabel.y;
      }
    });
    inputGraph.graph().width = layoutGraph.graph().width;
    inputGraph.graph().height = layoutGraph.graph().height;
  }
  var graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
  var graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "TB", rankalign: "center" };
  var graphAttrs = ["acyclicer", "ranker", "rankdir", "align", "rankalign"];
  var nodeNumAttrs = ["width", "height", "rank"];
  var nodeDefaults = { width: 0, height: 0 };
  var edgeNumAttrs = ["minlen", "weight", "width", "height", "labeloffset"];
  var edgeDefaults = {
    minlen: 1,
    weight: 1,
    width: 0,
    height: 0,
    labeloffset: 10,
    labelpos: "r"
  };
  var edgeAttrs = ["labelpos"];
  function buildLayoutGraph(inputGraph) {
    const g = new import_graphlib.Graph({ multigraph: true, compound: true });
    const graph = canonicalize(inputGraph.graph());
    g.setGraph(Object.assign(
      {},
      graphDefaults,
      selectNumberAttrs(graph, graphNumAttrs),
      pick(graph, graphAttrs)
    ));
    inputGraph.nodes().forEach((v) => {
      const node = canonicalize(inputGraph.node(v));
      const newNode = selectNumberAttrs(node, nodeNumAttrs);
      Object.keys(nodeDefaults).forEach((k) => {
        if (newNode[k] === void 0) {
          newNode[k] = nodeDefaults[k];
        }
      });
      g.setNode(v, newNode);
      const parent = inputGraph.parent(v);
      if (parent !== void 0) {
        g.setParent(v, parent);
      }
    });
    inputGraph.edges().forEach((e) => {
      const edge = canonicalize(inputGraph.edge(e));
      g.setEdge(e, Object.assign(
        {},
        edgeDefaults,
        selectNumberAttrs(edge, edgeNumAttrs),
        pick(edge, edgeAttrs)
      ));
    });
    return g;
  }
  function makeSpaceForEdgeLabels(g) {
    const graph = g.graph();
    graph.ranksep /= 2;
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      edge.minlen *= 2;
      if (edge.labelpos.toLowerCase() !== "c") {
        if (graph.rankdir === "TB" || graph.rankdir === "BT") {
          edge.width += edge.labeloffset;
        } else {
          edge.height += edge.labeloffset;
        }
      }
    });
  }
  function injectEdgeLabelProxies(g) {
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      if (edge.width && edge.height) {
        const v = g.node(e.v);
        const w = g.node(e.w);
        const label = { rank: (w.rank - v.rank) / 2 + v.rank, e };
        addDummyNode(g, "edge-proxy", label, "_ep");
      }
    });
  }
  function assignRankMinMax(g) {
    let maxRank2 = 0;
    g.nodes().forEach((v) => {
      const node = g.node(v);
      if (node.borderTop) {
        node.minRank = g.node(node.borderTop).rank;
        node.maxRank = g.node(node.borderBottom).rank;
        maxRank2 = Math.max(maxRank2, node.maxRank);
      }
    });
    g.graph().maxRank = maxRank2;
  }
  function removeEdgeLabelProxies(g) {
    g.nodes().forEach((v) => {
      const node = g.node(v);
      if (node.dummy === "edge-proxy") {
        const proxyNode = node;
        g.edge(proxyNode.e).labelRank = node.rank;
        g.removeNode(v);
      }
    });
  }
  function translateGraph(g) {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = 0;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = 0;
    const graphLabel = g.graph();
    const marginX = graphLabel.marginx || 0;
    const marginY = graphLabel.marginy || 0;
    function getExtremes(attrs) {
      const x = attrs.x;
      const y = attrs.y;
      const w = attrs.width;
      const h = attrs.height;
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      minY = Math.min(minY, y - h / 2);
      maxY = Math.max(maxY, y + h / 2);
    }
    g.nodes().forEach((v) => getExtremes(g.node(v)));
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      if (Object.hasOwn(edge, "x")) {
        getExtremes(edge);
      }
    });
    minX -= marginX;
    minY -= marginY;
    g.nodes().forEach((v) => {
      const node = g.node(v);
      node.x -= minX;
      node.y -= minY;
    });
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      edge.points.forEach((p) => {
        p.x -= minX;
        p.y -= minY;
      });
      if (Object.hasOwn(edge, "x")) {
        edge.x -= minX;
      }
      if (Object.hasOwn(edge, "y")) {
        edge.y -= minY;
      }
    });
    graphLabel.width = maxX - minX + marginX;
    graphLabel.height = maxY - minY + marginY;
  }
  function assignNodeIntersects(g) {
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      const nodeV = g.node(e.v);
      const nodeW = g.node(e.w);
      let p1, p2;
      if (!edge.points) {
        edge.points = [];
        p1 = nodeW;
        p2 = nodeV;
      } else {
        p1 = edge.points[0];
        p2 = edge.points[edge.points.length - 1];
      }
      edge.points.unshift(intersectRect(nodeV, p1));
      edge.points.push(intersectRect(nodeW, p2));
    });
  }
  function fixupEdgeLabelCoords(g) {
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      if (Object.hasOwn(edge, "x")) {
        if (edge.labelpos === "l" || edge.labelpos === "r") {
          edge.width -= edge.labeloffset;
        }
        switch (edge.labelpos) {
          case "l":
            edge.x -= edge.width / 2 + edge.labeloffset;
            break;
          case "r":
            edge.x += edge.width / 2 + edge.labeloffset;
            break;
        }
      }
    });
  }
  function reversePointsForReversedEdges(g) {
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      if (edge.reversed) {
        edge.points.reverse();
      }
    });
  }
  function removeBorderNodes(g) {
    g.nodes().forEach((v) => {
      if (g.children(v).length) {
        const node = g.node(v);
        const t = g.node(node.borderTop);
        const b = g.node(node.borderBottom);
        const l = g.node(node.borderLeft[node.borderLeft.length - 1]);
        const r = g.node(node.borderRight[node.borderRight.length - 1]);
        node.width = Math.abs(r.x - l.x);
        node.height = Math.abs(b.y - t.y);
        node.x = l.x + node.width / 2;
        node.y = t.y + node.height / 2;
      }
    });
    g.nodes().forEach((v) => {
      if (g.node(v).dummy === "border") {
        g.removeNode(v);
      }
    });
  }
  function removeSelfEdges(g) {
    g.edges().forEach((e) => {
      if (e.v === e.w) {
        const node = g.node(e.v);
        if (!node.selfEdges) {
          node.selfEdges = [];
        }
        node.selfEdges.push({ e, label: g.edge(e) });
        g.removeEdge(e);
      }
    });
  }
  function insertSelfEdges(g) {
    const layers = buildLayerMatrix(g);
    layers.forEach((layer) => {
      let orderShift = 0;
      layer.forEach((v, i) => {
        const node = g.node(v);
        node.order = i + orderShift;
        (node.selfEdges || []).forEach((selfEdge) => {
          addDummyNode(g, "selfedge", {
            width: selfEdge.label.width,
            height: selfEdge.label.height,
            rank: node.rank,
            order: i + ++orderShift,
            e: selfEdge.e,
            label: selfEdge.label
          }, "_se");
        });
        delete node.selfEdges;
      });
    });
  }
  function positionSelfEdges(g) {
    g.nodes().forEach((v) => {
      const node = g.node(v);
      if (node.dummy === "selfedge") {
        const selfEdgeNode = node;
        const selfNode = g.node(selfEdgeNode.e.v);
        const x = selfNode.x + selfNode.width / 2;
        const y = selfNode.y;
        const dx = node.x - x;
        const dy = selfNode.height / 2;
        g.setEdge(selfEdgeNode.e, selfEdgeNode.label);
        g.removeNode(v);
        selfEdgeNode.label.points = [
          { x: x + 2 * dx / 3, y: y - dy },
          { x: x + 5 * dx / 6, y: y - dy },
          { x: x + dx, y },
          { x: x + 5 * dx / 6, y: y + dy },
          { x: x + 2 * dx / 3, y: y + dy }
        ];
        selfEdgeNode.label.x = node.x;
        selfEdgeNode.label.y = node.y;
      }
    });
  }
  function selectNumberAttrs(obj, attrs) {
    return mapValues(pick(obj, attrs), Number);
  }
  function canonicalize(attrs) {
    const newAttrs = {};
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (typeof k === "string") {
          k = k.toLowerCase();
        }
        newAttrs[k] = v;
      });
    }
    return newAttrs;
  }

  // lib/debug.ts
  function debugOrdering(graph) {
    const layerMatrix = buildLayerMatrix(graph);
    const h = new import_graphlib.Graph({ compound: true, multigraph: true }).setGraph({});
    graph.nodes().forEach((node) => {
      h.setNode(node, { label: node });
      h.setParent(node, "layer" + graph.node(node).rank);
    });
    graph.edges().forEach((edge) => h.setEdge(edge.v, edge.w, {}, edge.name));
    layerMatrix.forEach((layer, i) => {
      const layerV = "layer" + i;
      h.setNode(layerV, { rank: "same" });
      layer.reduce((u, v) => {
        h.setEdge(u, v, { style: "invis" });
        return v;
      });
    });
    return h;
  }

  // index.ts
  var import_graphlib2 = __require("@dagrejs/graphlib");
  var util = { time, notime };
  var dagre = {
    graphlib,
    version,
    layout,
    debug: debugOrdering,
    util: { time, notime }
  };
  var index_default = dagre;
  return __toCommonJS(index_exports);
})();
/*! For license information please see dagre.js.LEGAL.txt */
//# sourceMappingURL=dagre.js.map
