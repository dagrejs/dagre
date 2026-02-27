"use strict";
var dagre = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // index.ts
  var index_exports = {};
  __export(index_exports, {
    Graph: () => p,
    debug: () => debugOrdering,
    default: () => index_default,
    graphlib: () => graphlib_esm_exports,
    layout: () => layout,
    util: () => util,
    version: () => version
  });

  // node_modules/@dagrejs/graphlib/dist/graphlib.esm.js
  var graphlib_esm_exports = {};
  __export(graphlib_esm_exports, {
    Graph: () => p,
    alg: () => v,
    json: () => G,
    version: () => H
  });
  var V = Object.defineProperty;
  var F = (s, e) => {
    for (var t in e) V(s, t, { get: e[t], enumerable: true });
  };
  var p = class {
    constructor(e) {
      this._isDirected = true;
      this._isMultigraph = false;
      this._isCompound = false;
      this._nodes = {};
      this._in = {};
      this._preds = {};
      this._out = {};
      this._sucs = {};
      this._edgeObjs = {};
      this._edgeLabels = {};
      this._nodeCount = 0;
      this._edgeCount = 0;
      this._defaultNodeLabelFn = () => {
      };
      this._defaultEdgeLabelFn = () => {
      };
      e && (this._isDirected = "directed" in e ? e.directed : true, this._isMultigraph = "multigraph" in e ? e.multigraph : false, this._isCompound = "compound" in e ? e.compound : false), this._isCompound && (this._parent = {}, this._children = {}, this._children["\0"] = {});
    }
    isDirected() {
      return this._isDirected;
    }
    isMultigraph() {
      return this._isMultigraph;
    }
    isCompound() {
      return this._isCompound;
    }
    setGraph(e) {
      return this._label = e, this;
    }
    graph() {
      return this._label;
    }
    setDefaultNodeLabel(e) {
      return typeof e != "function" ? this._defaultNodeLabelFn = () => e : this._defaultNodeLabelFn = e, this;
    }
    nodeCount() {
      return this._nodeCount;
    }
    nodes() {
      return Object.keys(this._nodes);
    }
    sources() {
      return this.nodes().filter((e) => Object.keys(this._in[e]).length === 0);
    }
    sinks() {
      return this.nodes().filter((e) => Object.keys(this._out[e]).length === 0);
    }
    setNodes(e, t) {
      return e.forEach((n) => {
        t !== void 0 ? this.setNode(n, t) : this.setNode(n);
      }), this;
    }
    setNode(e, t) {
      return e in this._nodes ? (arguments.length > 1 && (this._nodes[e] = t), this) : (this._nodes[e] = arguments.length > 1 ? t : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = "\0", this._children[e] = {}, this._children["\0"][e] = true), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
    }
    node(e) {
      return this._nodes[e];
    }
    hasNode(e) {
      return e in this._nodes;
    }
    removeNode(e) {
      if (e in this._nodes) {
        let t = (n) => this.removeEdge(this._edgeObjs[n]);
        delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], this.children(e).forEach((n) => {
          this.setParent(n);
        }), delete this._children[e]), Object.keys(this._in[e]).forEach(t), delete this._in[e], delete this._preds[e], Object.keys(this._out[e]).forEach(t), delete this._out[e], delete this._sucs[e], --this._nodeCount;
      }
      return this;
    }
    setParent(e, t) {
      if (!this._isCompound) throw new Error("Cannot set parent in a non-compound graph");
      if (t === void 0) t = "\0";
      else {
        t += "";
        for (let n = t; n !== void 0; n = this.parent(n)) if (n === e) throw new Error("Setting " + t + " as parent of " + e + " would create a cycle");
        this.setNode(t);
      }
      return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = t, this._children[t][e] = true, this;
    }
    parent(e) {
      if (this._isCompound) {
        let t = this._parent[e];
        if (t !== "\0") return t;
      }
    }
    children(e = "\0") {
      if (this._isCompound) {
        let t = this._children[e];
        if (t) return Object.keys(t);
      } else {
        if (e === "\0") return this.nodes();
        if (this.hasNode(e)) return [];
      }
      return [];
    }
    predecessors(e) {
      let t = this._preds[e];
      if (t) return Object.keys(t);
    }
    successors(e) {
      let t = this._sucs[e];
      if (t) return Object.keys(t);
    }
    neighbors(e) {
      let t = this.predecessors(e);
      if (t) {
        let n = new Set(t);
        for (let i of this.successors(e)) n.add(i);
        return Array.from(n.values());
      }
    }
    isLeaf(e) {
      let t;
      return this.isDirected() ? t = this.successors(e) : t = this.neighbors(e), t.length === 0;
    }
    filterNodes(e) {
      let t = new this.constructor({ directed: this._isDirected, multigraph: this._isMultigraph, compound: this._isCompound });
      t.setGraph(this.graph()), Object.entries(this._nodes).forEach(([r, o]) => {
        e(r) && t.setNode(r, o);
      }), Object.values(this._edgeObjs).forEach((r) => {
        t.hasNode(r.v) && t.hasNode(r.w) && t.setEdge(r, this.edge(r));
      });
      let n = {}, i = (r) => {
        let o = this.parent(r);
        return !o || t.hasNode(o) ? (n[r] = o != null ? o : void 0, o != null ? o : void 0) : o in n ? n[o] : i(o);
      };
      return this._isCompound && t.nodes().forEach((r) => t.setParent(r, i(r))), t;
    }
    setDefaultEdgeLabel(e) {
      return typeof e != "function" ? this._defaultEdgeLabelFn = () => e : this._defaultEdgeLabelFn = e, this;
    }
    edgeCount() {
      return this._edgeCount;
    }
    edges() {
      return Object.values(this._edgeObjs);
    }
    setPath(e, t) {
      return e.reduce((n, i) => (t !== void 0 ? this.setEdge(n, i, t) : this.setEdge(n, i), i)), this;
    }
    setEdge(e, t, n, i) {
      let r, o, d, a, c = false;
      typeof e == "object" && e !== null && "v" in e ? (r = e.v, o = e.w, d = e.name, arguments.length === 2 && (a = t, c = true)) : (r = e, o = t, d = i, arguments.length > 2 && (a = n, c = true)), r = "" + r, o = "" + o, d !== void 0 && (d = "" + d);
      let h = b(this._isDirected, r, o, d);
      if (h in this._edgeLabels) return c && (this._edgeLabels[h] = a), this;
      if (d !== void 0 && !this._isMultigraph) throw new Error("Cannot set a named edge when isMultigraph = false");
      this.setNode(r), this.setNode(o), this._edgeLabels[h] = c ? a : this._defaultEdgeLabelFn(r, o, d);
      let u = J(this._isDirected, r, o, d);
      return r = u.v, o = u.w, Object.freeze(u), this._edgeObjs[h] = u, k(this._preds[o], r), k(this._sucs[r], o), this._in[o][h] = u, this._out[r][h] = u, this._edgeCount++, this;
    }
    edge(e, t, n) {
      let i = arguments.length === 1 ? N(this._isDirected, e) : b(this._isDirected, e, t, n);
      return this._edgeLabels[i];
    }
    edgeAsObj(e, t, n) {
      let i = arguments.length === 1 ? this.edge(e) : this.edge(e, t, n);
      return typeof i != "object" ? { label: i } : i;
    }
    hasEdge(e, t, n) {
      return (arguments.length === 1 ? N(this._isDirected, e) : b(this._isDirected, e, t, n)) in this._edgeLabels;
    }
    removeEdge(e, t, n) {
      let i = arguments.length === 1 ? N(this._isDirected, e) : b(this._isDirected, e, t, n), r = this._edgeObjs[i];
      if (r) {
        let o = r.v, d = r.w;
        delete this._edgeLabels[i], delete this._edgeObjs[i], x(this._preds[d], o), x(this._sucs[o], d), delete this._in[d][i], delete this._out[o][i], this._edgeCount--;
      }
      return this;
    }
    inEdges(e, t) {
      return this.isDirected() ? this.filterEdges(this._in[e], e, t) : this.nodeEdges(e, t);
    }
    outEdges(e, t) {
      return this.isDirected() ? this.filterEdges(this._out[e], e, t) : this.nodeEdges(e, t);
    }
    nodeEdges(e, t) {
      if (e in this._nodes) return this.filterEdges({ ...this._in[e], ...this._out[e] }, e, t);
    }
    _removeFromParentsChildList(e) {
      delete this._children[this._parent[e]][e];
    }
    filterEdges(e, t, n) {
      if (!e) return;
      let i = Object.values(e);
      return n ? i.filter((r) => r.v === t && r.w === n || r.v === n && r.w === t) : i;
    }
  };
  function k(s, e) {
    s[e] ? s[e]++ : s[e] = 1;
  }
  function x(s, e) {
    s[e] !== void 0 && !--s[e] && delete s[e];
  }
  function b(s, e, t, n) {
    let i = "" + e, r = "" + t;
    if (!s && i > r) {
      let o = i;
      i = r, r = o;
    }
    return i + "" + r + "" + (n === void 0 ? "\0" : n);
  }
  function J(s, e, t, n) {
    let i = "" + e, r = "" + t;
    if (!s && i > r) {
      let d = i;
      i = r, r = d;
    }
    let o = { v: i, w: r };
    return n && (o.name = n), o;
  }
  function N(s, e) {
    return b(s, e.v, e.w, e.name);
  }
  var H = "4.0.0-pre";
  var G = {};
  F(G, { read: () => z, write: () => U });
  function U(s) {
    let e = { options: { directed: s.isDirected(), multigraph: s.isMultigraph(), compound: s.isCompound() }, nodes: Y(s), edges: K(s) }, t = s.graph();
    return t !== void 0 && (e.value = structuredClone(t)), e;
  }
  function Y(s) {
    return s.nodes().map((e) => {
      let t = s.node(e), n = s.parent(e), i = { v: e };
      return t !== void 0 && (i.value = t), n !== void 0 && (i.parent = n), i;
    });
  }
  function K(s) {
    return s.edges().map((e) => {
      let t = s.edge(e), n = { v: e.v, w: e.w };
      return e.name !== void 0 && (n.name = e.name), t !== void 0 && (n.value = t), n;
    });
  }
  function z(s) {
    let e = new p(s.options);
    return s.value !== void 0 && e.setGraph(s.value), s.nodes.forEach((t) => {
      e.setNode(t.v, t.value), t.parent && e.setParent(t.v, t.parent);
    }), s.edges.forEach((t) => {
      e.setEdge({ v: t.v, w: t.w, name: t.name }, t.value);
    }), e;
  }
  var v = {};
  F(v, { CycleException: () => l, bellmanFord: () => m, components: () => R, dijkstra: () => E, dijkstraAll: () => P, findCycles: () => I, floydWarshall: () => D, isAcyclic: () => O, postorder: () => T, preorder: () => A, prim: () => W, shortestPaths: () => S, tarjan: () => y, topsort: () => L });
  var Q = () => 1;
  function m(s, e, t, n) {
    return $(s, String(e), t || Q, n || function(i) {
      return s.outEdges(i);
    });
  }
  function $(s, e, t, n) {
    let i = {}, r, o = 0, d = s.nodes(), a = function(u) {
      let g = t(u);
      i[u.v].distance + g < i[u.w].distance && (i[u.w] = { distance: i[u.v].distance + g, predecessor: u.v }, r = true);
    }, c = function() {
      d.forEach(function(u) {
        n(u).forEach(function(g) {
          let f = g.v === u ? g.v : g.w, M = f === g.v ? g.w : g.v;
          a({ v: f, w: M });
        });
      });
    };
    d.forEach(function(u) {
      let g = u === e ? 0 : Number.POSITIVE_INFINITY;
      i[u] = { distance: g, predecessor: "" };
    });
    let h = d.length;
    for (let u = 1; u < h && (r = false, o++, c(), !!r); u++) ;
    if (o === h - 1 && (r = false, c(), r)) throw new Error("The graph contains a negative weight cycle");
    return i;
  }
  function R(s) {
    let e = {}, t = [], n;
    function i(r) {
      r in e || (e[r] = true, n.push(r), s.successors(r).forEach(i), s.predecessors(r).forEach(i));
    }
    return s.nodes().forEach(function(r) {
      n = [], i(r), n.length && t.push(n);
    }), t;
  }
  var _ = class {
    constructor() {
      this._arr = [];
      this._keyIndices = {};
    }
    size() {
      return this._arr.length;
    }
    keys() {
      return this._arr.map((e) => e.key);
    }
    has(e) {
      return e in this._keyIndices;
    }
    priority(e) {
      let t = this._keyIndices[e];
      if (t !== void 0) return this._arr[t].priority;
    }
    min() {
      if (this.size() === 0) throw new Error("Queue underflow");
      return this._arr[0].key;
    }
    add(e, t) {
      let n = this._keyIndices, i = String(e);
      if (!(i in n)) {
        let r = this._arr, o = r.length;
        return n[i] = o, r.push({ key: i, priority: t }), this._decrease(o), true;
      }
      return false;
    }
    removeMin() {
      this._swap(0, this._arr.length - 1);
      let e = this._arr.pop();
      return delete this._keyIndices[e.key], this._heapify(0), e.key;
    }
    decrease(e, t) {
      let n = this._keyIndices[e];
      if (n === void 0) throw new Error(`Key not found: ${e}`);
      let i = this._arr[n].priority;
      if (t > i) throw new Error(`New priority is greater than current priority. Key: ${e} Old: ${i} New: ${t}`);
      this._arr[n].priority = t, this._decrease(n);
    }
    _heapify(e) {
      let t = this._arr, n = 2 * e, i = n + 1, r = e;
      n < t.length && (r = t[n].priority < t[r].priority ? n : r, i < t.length && (r = t[i].priority < t[r].priority ? i : r), r !== e && (this._swap(e, r), this._heapify(r)));
    }
    _decrease(e) {
      let t = this._arr, n = t[e].priority, i;
      for (; e !== 0 && (i = e >> 1, !(t[i].priority < n)); ) this._swap(e, i), e = i;
    }
    _swap(e, t) {
      let n = this._arr, i = this._keyIndices, r = n[e], o = n[t];
      n[e] = o, n[t] = r, i[o.key] = e, i[r.key] = t;
    }
  };
  var q = () => 1;
  function E(s, e, t, n) {
    let i = function(r) {
      return s.outEdges(r);
    };
    return B(s, String(e), t || q, n || i);
  }
  function B(s, e, t, n) {
    let i = {}, r = new _(), o, d, a = function(c) {
      let h = c.v !== o ? c.v : c.w, u = i[h], g = t(c), f = d.distance + g;
      if (g < 0) throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + c + " Weight: " + g);
      f < u.distance && (u.distance = f, u.predecessor = o, r.decrease(h, f));
    };
    for (s.nodes().forEach(function(c) {
      let h = c === e ? 0 : Number.POSITIVE_INFINITY;
      i[c] = { distance: h, predecessor: "" }, r.add(c, h);
    }); r.size() > 0 && (o = r.removeMin(), d = i[o], d.distance !== Number.POSITIVE_INFINITY); ) n(o).forEach(a);
    return i;
  }
  function P(s, e, t) {
    return s.nodes().reduce(function(n, i) {
      return n[i] = E(s, i, e, t), n;
    }, {});
  }
  function y(s) {
    let e = 0, t = [], n = {}, i = [];
    function r(o) {
      let d = n[o] = { onStack: true, lowlink: e, index: e++ };
      if (t.push(o), s.successors(o).forEach(function(a) {
        a in n ? n[a].onStack && (d.lowlink = Math.min(d.lowlink, n[a].index)) : (r(a), d.lowlink = Math.min(d.lowlink, n[a].lowlink));
      }), d.lowlink === d.index) {
        let a = [], c;
        do
          c = t.pop(), n[c].onStack = false, a.push(c);
        while (o !== c);
        i.push(a);
      }
    }
    return s.nodes().forEach(function(o) {
      o in n || r(o);
    }), i;
  }
  function I(s) {
    return y(s).filter(function(e) {
      return e.length > 1 || e.length === 1 && s.hasEdge(e[0], e[0]);
    });
  }
  var X = () => 1;
  function D(s, e, t) {
    return Z(s, e || X, t || function(n) {
      return s.outEdges(n);
    });
  }
  function Z(s, e, t) {
    let n = {}, i = s.nodes();
    return i.forEach(function(r) {
      n[r] = {}, n[r][r] = { distance: 0, predecessor: "" }, i.forEach(function(o) {
        r !== o && (n[r][o] = { distance: Number.POSITIVE_INFINITY, predecessor: "" });
      }), t(r).forEach(function(o) {
        let d = o.v === r ? o.w : o.v, a = e(o);
        n[r][d] = { distance: a, predecessor: r };
      });
    }), i.forEach(function(r) {
      let o = n[r];
      i.forEach(function(d) {
        let a = n[d];
        i.forEach(function(c) {
          let h = a[r], u = o[c], g = a[c], f = h.distance + u.distance;
          f < g.distance && (g.distance = f, g.predecessor = u.predecessor);
        });
      });
    }), n;
  }
  var l = class extends Error {
    constructor(...e) {
      super(...e);
    }
  };
  function L(s) {
    let e = {}, t = {}, n = [];
    function i(r) {
      if (r in t) throw new l();
      r in e || (t[r] = true, e[r] = true, s.predecessors(r).forEach(i), delete t[r], n.push(r));
    }
    if (s.sinks().forEach(i), Object.keys(e).length !== s.nodeCount()) throw new l();
    return n;
  }
  function O(s) {
    try {
      L(s);
    } catch (e) {
      if (e instanceof l) return false;
      throw e;
    }
    return true;
  }
  function j(s, e, t, n, i) {
    Array.isArray(e) || (e = [e]);
    let r = ((d) => {
      var a;
      return (a = s.isDirected() ? s.successors(d) : s.neighbors(d)) != null ? a : [];
    }), o = {};
    return e.forEach(function(d) {
      if (!s.hasNode(d)) throw new Error("Graph does not have node: " + d);
      i = C(s, d, t === "post", o, r, n, i);
    }), i;
  }
  function C(s, e, t, n, i, r, o) {
    return e in n || (n[e] = true, t || (o = r(o, e)), i(e).forEach(function(d) {
      o = C(s, d, t, n, i, r, o);
    }), t && (o = r(o, e))), o;
  }
  function w(s, e, t) {
    return j(s, e, t, function(n, i) {
      return n.push(i), n;
    }, []);
  }
  function T(s, e) {
    return w(s, e, "post");
  }
  function A(s, e) {
    return w(s, e, "pre");
  }
  function W(s, e) {
    let t = new p(), n = {}, i = new _(), r;
    function o(a) {
      let c = a.v === r ? a.w : a.v, h = i.priority(c);
      if (h !== void 0) {
        let u = e(a);
        u < h && (n[c] = r, i.decrease(c, u));
      }
    }
    if (s.nodeCount() === 0) return t;
    s.nodes().forEach(function(a) {
      i.add(a, Number.POSITIVE_INFINITY), t.setNode(a);
    }), i.decrease(s.nodes()[0], 0);
    let d = false;
    for (; i.size() > 0; ) {
      if (r = i.removeMin(), r in n) t.setEdge(r, n[r]);
      else {
        if (d) throw new Error("Input graph is not connected: " + s);
        d = true;
      }
      s.nodeEdges(r).forEach(o);
    }
    return t;
  }
  function S(s, e, t, n) {
    return ee(s, e, t, n != null ? n : ((i) => {
      let r = s.outEdges(i);
      return r != null ? r : [];
    }));
  }
  function ee(s, e, t, n) {
    if (t === void 0) return E(s, e, t, n);
    let i = false, r = s.nodes();
    for (let o = 0; o < r.length; o++) {
      let d = n(r[o]);
      for (let a = 0; a < d.length; a++) {
        let c = d[a], h = c.v === r[o] ? c.v : c.w, u = h === c.v ? c.w : c.v;
        t({ v: h, w: u }) < 0 && (i = true);
      }
      if (i) return m(s, e, t, n);
    }
    return E(s, e, t, n);
  }

  // lib/util.ts
  function addDummyNode(graph, type, attrs, name) {
    let v2 = name;
    while (graph.hasNode(v2)) {
      v2 = uniqueId(name);
    }
    attrs.dummy = type;
    graph.setNode(v2, attrs);
    return v2;
  }
  function simplify(graph) {
    const simplified = new p().setGraph(graph.graph());
    graph.nodes().forEach((v2) => simplified.setNode(v2, graph.node(v2)));
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
    const simplified = new p({ multigraph: graph.isMultigraph() }).setGraph(graph.graph());
    graph.nodes().forEach((v2) => {
      if (!graph.children(v2).length) {
        simplified.setNode(v2, graph.node(v2));
      }
    });
    graph.edges().forEach((e) => {
      simplified.setEdge(e, graph.edge(e));
    });
    return simplified;
  }
  function intersectRect(rect, point) {
    const x2 = rect.x;
    const y2 = rect.y;
    const dx = point.x - x2;
    const dy = point.y - y2;
    let w2 = rect.width / 2;
    let h = rect.height / 2;
    if (!dx && !dy) {
      throw new Error("Not possible to find intersection inside of the rectangle");
    }
    let sx, sy;
    if (Math.abs(dy) * w2 > Math.abs(dx) * h) {
      if (dy < 0) {
        h = -h;
      }
      sx = h * dx / dy;
      sy = h;
    } else {
      if (dx < 0) {
        w2 = -w2;
      }
      sx = w2;
      sy = w2 * dy / dx;
    }
    return { x: x2 + sx, y: y2 + sy };
  }
  function buildLayerMatrix(graph) {
    const layering = range(maxRank(graph) + 1).map(() => []);
    graph.nodes().forEach((v2) => {
      const node = graph.node(v2);
      const rank2 = node.rank;
      if (rank2 !== void 0) {
        if (!layering[rank2]) {
          layering[rank2] = [];
        }
        layering[rank2][node.order] = v2;
      }
    });
    return layering;
  }
  function normalizeRanks(graph) {
    const nodeRanks = graph.nodes().map((v2) => {
      const rank2 = graph.node(v2).rank;
      if (rank2 === void 0) {
        return Number.MAX_VALUE;
      }
      return rank2;
    });
    const min = applyWithChunking(Math.min, nodeRanks);
    graph.nodes().forEach((v2) => {
      const node = graph.node(v2);
      if (Object.hasOwn(node, "rank")) {
        node.rank -= min;
      }
    });
  }
  function removeEmptyRanks(graph) {
    const nodeRanks = graph.nodes().map((v2) => graph.node(v2).rank).filter((rank2) => rank2 !== void 0);
    const offset = applyWithChunking(Math.min, nodeRanks);
    const layers = [];
    graph.nodes().forEach((v2) => {
      const rank2 = graph.node(v2).rank - offset;
      if (!layers[rank2]) {
        layers[rank2] = [];
      }
      layers[rank2].push(v2);
    });
    let delta = 0;
    const nodeRankFactor = graph.graph().nodeRankFactor;
    Array.from(layers).forEach((vs, i) => {
      if (vs === void 0 && i % nodeRankFactor !== 0) {
        --delta;
      } else if (vs !== void 0 && delta) {
        vs.forEach((v2) => graph.node(v2).rank += delta);
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
    const nodeRanks = nodes.map((v2) => {
      const rank2 = graph.node(v2).rank;
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
    return Object.entries(obj).reduce((acc, [k2, v2]) => {
      acc[k2] = func(v2, k2);
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
  function filterOutLinks(k2, v2) {
    if (k2 !== "_next" && k2 !== "_prev") {
      return v2;
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
      const w2 = edge.w;
      const wEntry = graph.node(w2);
      wEntry.in -= weight;
      assignBucket(buckets, zeroIdx, wEntry);
    });
    graph.removeNode(entry.v);
    return results;
  }
  function buildState(graph, weightFn) {
    const fasGraph = new p();
    let maxIn = 0;
    let maxOut = 0;
    graph.nodes().forEach((v2) => {
      fasGraph.setNode(v2, { v: v2, in: 0, out: 0 });
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
    fasGraph.nodes().forEach((v2) => {
      assignBucket(buckets, zeroIdx, fasGraph.node(v2));
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
    function dfs2(v2) {
      if (Object.hasOwn(visited, v2)) {
        return;
      }
      visited[v2] = true;
      stack[v2] = true;
      graph.outEdges(v2).forEach((e) => {
        if (Object.hasOwn(stack, e.w)) {
          fas.push(e);
        } else {
          dfs2(e.w);
        }
      });
      delete stack[v2];
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
    let v2 = e.v;
    let vRank = graph.node(v2).rank;
    const w2 = e.w;
    const wRank = graph.node(w2).rank;
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
      graph.setEdge(v2, dummy, { weight: edgeLabel.weight }, name);
      if (i === 0) {
        graph.graph().dummyChains.push(dummy);
      }
      v2 = dummy;
    }
    graph.setEdge(v2, w2, { weight: edgeLabel.weight }, name);
  }
  function undo2(graph) {
    graph.graph().dummyChains.forEach((v2) => {
      let node = graph.node(v2);
      const origLabel = node.edgeLabel;
      let w2;
      graph.setEdge(node.edgeObj, origLabel);
      while (node.dummy) {
        w2 = graph.successors(v2)[0];
        graph.removeNode(v2);
        origLabel.points.push({ x: node.x, y: node.y });
        if (node.dummy === "edge-label") {
          origLabel.x = node.x;
          origLabel.y = node.y;
          origLabel.width = node.width;
          origLabel.height = node.height;
        }
        v2 = w2;
        node = graph.node(v2);
      }
    });
  }

  // lib/rank/util.ts
  function longestPath(graph) {
    const visited = {};
    function dfs2(v2) {
      const label = graph.node(v2);
      if (Object.hasOwn(visited, v2)) {
        return label.rank;
      }
      visited[v2] = true;
      const outEdges = graph.outEdges(v2);
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
    const tree = new p({ directed: false });
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
    function dfs2(v2) {
      const nodeEdges = graph.nodeEdges(v2);
      if (nodeEdges) {
        nodeEdges.forEach((e) => {
          const edgeV = e.v;
          const w2 = v2 === edgeV ? e.w : edgeV;
          if (!tree.hasNode(w2) && !slack(graph, e)) {
            tree.setNode(w2, {});
            tree.setEdge(v2, w2, {});
            dfs2(w2);
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
    tree.nodes().forEach((v2) => graph.node(v2).rank += delta);
  }

  // lib/rank/network-simplex.ts
  var { preorder, postorder } = v;
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
    visitedNodes.forEach((v2) => assignCutValue(tree, graph, v2));
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
  function dfsAssignLowLim(tree, visited, nextLim, v2, parent) {
    const low = nextLim;
    const label = tree.node(v2);
    visited[v2] = true;
    const neighbors = tree.neighbors(v2);
    if (neighbors) {
      neighbors.forEach((w2) => {
        if (!Object.hasOwn(visited, w2)) {
          nextLim = dfsAssignLowLim(tree, visited, nextLim, w2, v2);
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
    let v2 = edge.v;
    let w2 = edge.w;
    if (!graph.hasEdge(v2, w2)) {
      v2 = edge.w;
      w2 = edge.v;
    }
    const vLabel = tree.node(v2);
    const wLabel = tree.node(w2);
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
    const v2 = e.v;
    const w2 = e.w;
    t.removeEdge(v2, w2);
    t.setEdge(f.v, f.w, {});
    initLowLimValues(t);
    initCutValues(t, g);
    updateRanks(t, g);
  }
  function updateRanks(t, g) {
    const root = t.nodes().find((v2) => {
      const node = t.node(v2);
      return !node.parent;
    });
    if (!root) return;
    let vs = preorder(t, [root]);
    vs = vs.slice(1);
    vs.forEach((v2) => {
      const treeNode = t.node(v2);
      const parent = treeNode.parent;
      let edge = g.edge(v2, parent);
      let flipped = false;
      if (!edge) {
        edge = g.edge(parent, v2);
        flipped = true;
      }
      g.node(v2).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
    });
  }
  function isTreeEdge(tree, u, v2) {
    return tree.hasEdge(u, v2);
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
    graph.graph().dummyChains.forEach((v2) => {
      let node = graph.node(v2);
      const edgeObj = node.edgeObj;
      const pathData = findPath(graph, postorderNums, edgeObj.v, edgeObj.w);
      const path = pathData.path;
      const lca = pathData.lca;
      let pathIdx = 0;
      let pathV = path[pathIdx];
      let ascending = true;
      while (v2 !== edgeObj.w) {
        node = graph.node(v2);
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
          graph.setParent(v2, pathV);
        }
        v2 = graph.successors(v2)[0];
      }
    });
  }
  function findPath(graph, postorderNums, v2, w2) {
    const vPath = [];
    const wPath = [];
    const low = Math.min(postorderNums[v2].low, postorderNums[w2].low);
    const lim = Math.max(postorderNums[v2].lim, postorderNums[w2].lim);
    let parent;
    parent = v2;
    do {
      parent = graph.parent(parent);
      vPath.push(parent);
    } while (parent && (postorderNums[parent].low > low || lim > postorderNums[parent].lim));
    const lca = parent;
    let wParent = w2;
    while ((wParent = graph.parent(wParent)) !== lca) {
      wPath.push(wParent);
    }
    return { path: vPath.concat(wPath.reverse()), lca };
  }
  function postorder2(graph) {
    const result = {};
    let lim = 0;
    function dfs2(v2) {
      const low = lim;
      graph.children(v2).forEach(dfs2);
      result[v2] = { low, lim: lim++ };
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
  function dfs(graph, root, nodeSep, weight, height, depths, v2) {
    var _a;
    const children = graph.children(v2);
    if (!children.length) {
      if (v2 !== root) {
        graph.setEdge(root, v2, { weight: 0, minlen: nodeSep });
      }
      return;
    }
    const top = addBorderNode(graph, "_bt");
    const bottom = addBorderNode(graph, "_bb");
    const label = graph.node(v2);
    graph.setParent(top, v2);
    label.borderTop = top;
    graph.setParent(bottom, v2);
    label.borderBottom = bottom;
    children.forEach((child) => {
      var _a2;
      dfs(graph, root, nodeSep, weight, height, depths, child);
      const childNode = graph.node(child);
      const childTop = childNode.borderTop ? childNode.borderTop : child;
      const childBottom = childNode.borderBottom ? childNode.borderBottom : child;
      const thisWeight = childNode.borderTop ? weight : 2 * weight;
      const minlen = childTop !== childBottom ? 1 : height - ((_a2 = depths[v2]) != null ? _a2 : 0) + 1;
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
    if (!graph.parent(v2)) {
      graph.setEdge(root, top, { weight: 0, minlen: height + ((_a = depths[v2]) != null ? _a : 0) });
    }
  }
  function treeDepths(graph) {
    const depths = {};
    function dfs2(v2, depth) {
      const children = graph.children(v2);
      if (children && children.length) {
        children.forEach((child) => dfs2(child, depth + 1));
      }
      depths[v2] = depth;
    }
    graph.children(GRAPH_NODE).forEach((v2) => dfs2(v2, 1));
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
    function dfs2(v2) {
      const children = graph.children(v2);
      const node = graph.node(v2);
      if (children.length) {
        children.forEach(dfs2);
      }
      if (Object.hasOwn(node, "minRank")) {
        node.borderLeft = [];
        node.borderRight = [];
        for (let rank2 = node.minRank, maxRank2 = node.maxRank + 1; rank2 < maxRank2; ++rank2) {
          addBorderNode2(graph, "borderLeft", "_bl", v2, node, rank2);
          addBorderNode2(graph, "borderRight", "_br", v2, node, rank2);
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
    const w2 = attrs.width;
    attrs.width = attrs.height;
    attrs.height = w2;
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
    const x2 = attrs.x;
    attrs.x = attrs.y;
    attrs.y = x2;
  }

  // lib/order/init-order.ts
  function initOrder(graph) {
    const visited = {};
    const simpleNodes = graph.nodes().filter((v2) => !graph.children(v2).length);
    const simpleNodesRanks = simpleNodes.map((v2) => graph.node(v2).rank);
    const maxRank2 = applyWithChunking(Math.max, simpleNodesRanks);
    const layers = range(maxRank2 + 1).map(() => []);
    function dfs2(v2) {
      if (visited[v2]) return;
      visited[v2] = true;
      const node = graph.node(v2);
      layers[node.rank].push(v2);
      const successors = graph.successors(v2);
      if (successors) {
        successors.forEach(dfs2);
      }
    }
    const orderedVs = simpleNodes.sort((a, b2) => graph.node(a).rank - graph.node(b2).rank);
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
    const southPos = zipObject(southLayer, southLayer.map((v2, i) => i));
    const southEntries = northLayer.flatMap((v2) => {
      const edges = graph.outEdges(v2);
      if (!edges) return [];
      return edges.map((e) => {
        return { pos: southPos[e.w], weight: graph.edge(e).weight };
      }).sort((a, b2) => a.pos - b2.pos);
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
    return movable.map((v2) => {
      const inV = graph.inEdges(v2);
      if (!inV || !inV.length) {
        return { v: v2 };
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
          v: v2,
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
    const unsortable = parts.rhs.sort((a, b2) => b2.i - a.i);
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
  function sortSubgraph(graph, v2, constraintGraph, biasRight) {
    let movable = graph.children(v2);
    const node = graph.node(v2);
    const bl = node ? node.borderLeft : void 0;
    const br = node ? node.borderRight : void 0;
    const subgraphs = {};
    if (bl) {
      movable = movable.filter((w2) => w2 !== bl && w2 !== br);
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
      entry.vs = entry.vs.flatMap((v2) => {
        if (subgraphs[v2]) {
          return subgraphs[v2].vs;
        }
        return v2;
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
    const result = new p({ compound: true }).setGraph({ root }).setDefaultNodeLabel((v2) => graph.node(v2));
    nodesWithRank.forEach((v2) => {
      const node = graph.node(v2);
      const parent = graph.parent(v2);
      if (node.rank === rank2 || node.minRank <= rank2 && rank2 <= node.maxRank) {
        result.setNode(v2);
        result.setParent(v2, parent || root);
        const edges = graph[relationship](v2);
        if (edges) {
          edges.forEach((e) => {
            const u = e.v === v2 ? e.w : e.v;
            const edge = result.edge(u, v2);
            const weight = edge !== void 0 ? edge.weight : 0;
            result.setEdge(u, v2, { weight: graph.edge(e).weight + weight });
          });
        }
        if (Object.hasOwn(node, "minRank")) {
          result.setNode(v2, {
            borderLeft: node.borderLeft[rank2],
            borderRight: node.borderRight[rank2]
          });
        }
      }
    });
    return result;
  }
  function createRootNode(graph) {
    let v2;
    while (graph.hasNode(v2 = uniqueId("_root"))) ;
    return v2;
  }

  // lib/order/add-subgraph-constraints.ts
  function addSubgraphConstraints(graph, constraintGraph, vs) {
    const prev = {};
    let rootPrev;
    vs.forEach((v2) => {
      let child = graph.parent(v2);
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
    for (const v2 of graph.nodes()) {
      const node = graph.node(v2);
      if (typeof node.rank === "number") {
        addNodeToRank(node.rank, v2);
      }
      if (typeof node.minRank === "number" && typeof node.maxRank === "number") {
        for (let r = node.minRank; r <= node.maxRank; r++) {
          if (r !== node.rank) {
            addNodeToRank(r, v2);
          }
        }
      }
    }
    return ranks.map(function(rank2) {
      return buildLayerGraph(graph, rank2, relationship, nodesByRank.get(rank2) || []);
    });
  }
  function sweepLayerGraphs(layerGraphs, biasRight, constraints) {
    const cg = new p();
    layerGraphs.forEach(function(lg) {
      constraints.forEach((con) => cg.setEdge(con.left, con.right));
      const root = lg.graph().root;
      const sorted = sortSubgraph(lg, root, cg, biasRight);
      sorted.vs.forEach((v2, i) => lg.node(v2).order = i);
      addSubgraphConstraints(lg, cg, sorted.vs);
    });
  }
  function assignOrder(graph, layering) {
    Object.values(layering).forEach((layer) => layer.forEach((v2, i) => graph.node(v2).order = i));
  }

  // lib/position/bk.ts
  function findType1Conflicts(graph, layering) {
    const conflicts = {};
    function visitLayer(prevLayer, layer) {
      let k0 = 0, scanPos = 0;
      const prevLayerLength = prevLayer.length, lastNode = layer[layer.length - 1];
      layer.forEach((v2, i) => {
        const w2 = findOtherInnerSegmentNode(graph, v2);
        const k1 = w2 ? graph.node(w2).order : prevLayerLength;
        if (w2 || v2 === lastNode) {
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
        const v2 = south[i];
        if (v2 === void 0) return;
        if (graph.node(v2).dummy) {
          const preds = graph.predecessors(v2);
          if (preds) {
            preds.forEach((u) => {
              if (u === void 0) return;
              const uNode = graph.node(u);
              if (uNode.dummy && (uNode.order < prevNorthBorder || uNode.order > nextNorthBorder)) {
                addConflict(conflicts, u, v2);
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
      south.forEach((v2, southLookahead) => {
        if (graph.node(v2).dummy === "border") {
          const predecessors = graph.predecessors(v2);
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
  function findOtherInnerSegmentNode(graph, v2) {
    if (graph.node(v2).dummy) {
      const preds = graph.predecessors(v2);
      if (preds) {
        return preds.find((u) => graph.node(u).dummy);
      }
    }
    return void 0;
  }
  function addConflict(conflicts, v2, w2) {
    if (v2 > w2) {
      const tmp = v2;
      v2 = w2;
      w2 = tmp;
    }
    let conflictsV = conflicts[v2];
    if (!conflictsV) {
      conflicts[v2] = conflictsV = {};
    }
    conflictsV[w2] = true;
  }
  function hasConflict(conflicts, v2, w2) {
    if (v2 > w2) {
      const tmp = v2;
      v2 = w2;
      w2 = tmp;
    }
    const conflictsV = conflicts[v2];
    return conflictsV !== void 0 && Object.hasOwn(conflictsV, w2);
  }
  function verticalAlignment(graph, layering, conflicts, neighborFn) {
    const root = {};
    const align = {};
    const pos = {};
    layering.forEach((layer) => {
      layer.forEach((v2, order2) => {
        root[v2] = v2;
        align[v2] = v2;
        pos[v2] = order2;
      });
    });
    layering.forEach((layer) => {
      let prevIdx = -1;
      layer.forEach((v2) => {
        const wsRaw = neighborFn(v2);
        if (wsRaw && wsRaw.length) {
          const ws = wsRaw.sort((a, b2) => {
            const posA = pos[a];
            const posB = pos[b2];
            return (posA !== void 0 ? posA : 0) - (posB !== void 0 ? posB : 0);
          });
          const mp = (ws.length - 1) / 2;
          for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
            const w2 = ws[i];
            if (w2 === void 0) continue;
            const posW = pos[w2];
            if (posW !== void 0 && align[v2] === v2 && prevIdx < posW && !hasConflict(conflicts, v2, w2)) {
              const rootW = root[w2];
              if (rootW !== void 0) {
                align[w2] = v2;
                align[v2] = root[v2] = rootW;
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
    Object.keys(align).forEach((v2) => {
      var _a;
      const rootV = root[v2];
      if (rootV !== void 0) {
        xs[v2] = (_a = xs[rootV]) != null ? _a : 0;
      }
    });
    return xs;
  }
  function buildBlockGraph(graph, layering, root, reverseSep) {
    const blockGraph = new p();
    const graphLabel = graph.graph();
    const sepFn = sep(graphLabel.nodesep, graphLabel.edgesep, reverseSep);
    layering.forEach((layer) => {
      let u;
      layer.forEach((v2) => {
        const vRoot = root[v2];
        if (vRoot !== void 0) {
          blockGraph.setNode(vRoot);
          if (u !== void 0) {
            const uRoot = root[u];
            if (uRoot !== void 0) {
              const prevMax = blockGraph.edge(uRoot, vRoot);
              blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(graph, v2, u), prevMax || 0));
            }
          }
          u = v2;
        }
      });
    });
    return blockGraph;
  }
  function findSmallestWidthAlignment(graph, xss) {
    return Object.values(xss).reduce((currentMinAndXs, xs) => {
      let max = Number.NEGATIVE_INFINITY;
      let min = Number.POSITIVE_INFINITY;
      Object.entries(xs).forEach(([v2, x2]) => {
        const halfWidth = width(graph, v2) / 2;
        max = Math.max(x2 + halfWidth, max);
        min = Math.min(x2 - halfWidth, min);
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
          xss[alignment] = mapValues(xs, (x2) => x2 + delta);
        }
      });
    });
  }
  function balance(xss, align = void 0) {
    const ulMap = xss.ul;
    if (!ulMap) {
      return {};
    }
    return mapValues(ulMap, (num, v2) => {
      var _a, _b;
      if (align) {
        const alignmentKey = align.toLowerCase();
        const alignment = xss[alignmentKey];
        if (alignment && alignment[v2] !== void 0) {
          return alignment[v2];
        }
      }
      const xs = Object.values(xss).map((xs2) => {
        const val = xs2[v2];
        return val !== void 0 ? val : 0;
      }).sort((a, b2) => a - b2);
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
        const neighborFn = (v2) => {
          const result = vert === "u" ? graph.predecessors(v2) : graph.successors(v2);
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
          xs = mapValues(xs, (x2) => -x2);
        }
        xss[vert + horiz] = xs;
      });
    });
    const smallestWidth = findSmallestWidthAlignment(graph, xss);
    alignCoordinates(xss, smallestWidth);
    return balance(xss, graph.graph().align);
  }
  function sep(nodeSep, edgeSep, reverseSep) {
    return (g, v2, w2) => {
      const vLabel = g.node(v2);
      const wLabel = g.node(w2);
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
  function width(graph, v2) {
    return graph.node(v2).width;
  }

  // lib/position/index.ts
  function position(graph) {
    graph = asNonCompoundGraph(graph);
    positionY(graph);
    Object.entries(positionX(graph)).forEach(([v2, x2]) => graph.node(v2).x = x2);
  }
  function positionY(graph) {
    const layering = buildLayerMatrix(graph);
    const graphLabel = graph.graph();
    const rankSep = graphLabel.ranksep;
    const rankAlign = graphLabel.rankalign;
    let prevY = 0;
    layering.forEach((layer) => {
      const maxHeight = layer.reduce((acc, v2) => {
        var _a;
        const height = (_a = graph.node(v2).height) != null ? _a : 0;
        if (acc > height) {
          return acc;
        } else {
          return height;
        }
      }, 0);
      layer.forEach((v2) => {
        const node = graph.node(v2);
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
    inputGraph.nodes().forEach((v2) => {
      const inputLabel = inputGraph.node(v2);
      const layoutLabel = layoutGraph.node(v2);
      if (inputLabel) {
        inputLabel.x = layoutLabel.x;
        inputLabel.y = layoutLabel.y;
        inputLabel.order = layoutLabel.order;
        inputLabel.rank = layoutLabel.rank;
        if (layoutGraph.children(v2).length) {
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
    const g = new p({ multigraph: true, compound: true });
    const graph = canonicalize(inputGraph.graph());
    g.setGraph(Object.assign(
      {},
      graphDefaults,
      selectNumberAttrs(graph, graphNumAttrs),
      pick(graph, graphAttrs)
    ));
    inputGraph.nodes().forEach((v2) => {
      const node = canonicalize(inputGraph.node(v2));
      const newNode = selectNumberAttrs(node, nodeNumAttrs);
      Object.keys(nodeDefaults).forEach((k2) => {
        if (newNode[k2] === void 0) {
          newNode[k2] = nodeDefaults[k2];
        }
      });
      g.setNode(v2, newNode);
      const parent = inputGraph.parent(v2);
      if (parent !== void 0) {
        g.setParent(v2, parent);
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
        const v2 = g.node(e.v);
        const w2 = g.node(e.w);
        const label = { rank: (w2.rank - v2.rank) / 2 + v2.rank, e };
        addDummyNode(g, "edge-proxy", label, "_ep");
      }
    });
  }
  function assignRankMinMax(g) {
    let maxRank2 = 0;
    g.nodes().forEach((v2) => {
      const node = g.node(v2);
      if (node.borderTop) {
        node.minRank = g.node(node.borderTop).rank;
        node.maxRank = g.node(node.borderBottom).rank;
        maxRank2 = Math.max(maxRank2, node.maxRank);
      }
    });
    g.graph().maxRank = maxRank2;
  }
  function removeEdgeLabelProxies(g) {
    g.nodes().forEach((v2) => {
      const node = g.node(v2);
      if (node.dummy === "edge-proxy") {
        const proxyNode = node;
        g.edge(proxyNode.e).labelRank = node.rank;
        g.removeNode(v2);
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
      const x2 = attrs.x;
      const y2 = attrs.y;
      const w2 = attrs.width;
      const h = attrs.height;
      minX = Math.min(minX, x2 - w2 / 2);
      maxX = Math.max(maxX, x2 + w2 / 2);
      minY = Math.min(minY, y2 - h / 2);
      maxY = Math.max(maxY, y2 + h / 2);
    }
    g.nodes().forEach((v2) => getExtremes(g.node(v2)));
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      if (Object.hasOwn(edge, "x")) {
        getExtremes(edge);
      }
    });
    minX -= marginX;
    minY -= marginY;
    g.nodes().forEach((v2) => {
      const node = g.node(v2);
      node.x -= minX;
      node.y -= minY;
    });
    g.edges().forEach((e) => {
      const edge = g.edge(e);
      edge.points.forEach((p2) => {
        p2.x -= minX;
        p2.y -= minY;
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
    g.nodes().forEach((v2) => {
      if (g.children(v2).length) {
        const node = g.node(v2);
        const t = g.node(node.borderTop);
        const b2 = g.node(node.borderBottom);
        const l2 = g.node(node.borderLeft[node.borderLeft.length - 1]);
        const r = g.node(node.borderRight[node.borderRight.length - 1]);
        node.width = Math.abs(r.x - l2.x);
        node.height = Math.abs(b2.y - t.y);
        node.x = l2.x + node.width / 2;
        node.y = t.y + node.height / 2;
      }
    });
    g.nodes().forEach((v2) => {
      if (g.node(v2).dummy === "border") {
        g.removeNode(v2);
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
      layer.forEach((v2, i) => {
        const node = g.node(v2);
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
    g.nodes().forEach((v2) => {
      const node = g.node(v2);
      if (node.dummy === "selfedge") {
        const selfEdgeNode = node;
        const selfNode = g.node(selfEdgeNode.e.v);
        const x2 = selfNode.x + selfNode.width / 2;
        const y2 = selfNode.y;
        const dx = node.x - x2;
        const dy = selfNode.height / 2;
        g.setEdge(selfEdgeNode.e, selfEdgeNode.label);
        g.removeNode(v2);
        selfEdgeNode.label.points = [
          { x: x2 + 2 * dx / 3, y: y2 - dy },
          { x: x2 + 5 * dx / 6, y: y2 - dy },
          { x: x2 + dx, y: y2 },
          { x: x2 + 5 * dx / 6, y: y2 + dy },
          { x: x2 + 2 * dx / 3, y: y2 + dy }
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
      Object.entries(attrs).forEach(([k2, v2]) => {
        if (typeof k2 === "string") {
          k2 = k2.toLowerCase();
        }
        newAttrs[k2] = v2;
      });
    }
    return newAttrs;
  }

  // lib/debug.ts
  function debugOrdering(graph) {
    const layerMatrix = buildLayerMatrix(graph);
    const h = new p({ compound: true, multigraph: true }).setGraph({});
    graph.nodes().forEach((node) => {
      h.setNode(node, { label: node });
      h.setParent(node, "layer" + graph.node(node).rank);
    });
    graph.edges().forEach((edge) => h.setEdge(edge.v, edge.w, {}, edge.name));
    layerMatrix.forEach((layer, i) => {
      const layerV = "layer" + i;
      h.setNode(layerV, { rank: "same" });
      layer.reduce((u, v2) => {
        h.setEdge(u, v2, { style: "invis" });
        return v2;
      });
    });
    return h;
  }

  // index.ts
  var util = { time, notime };
  var dagre = {
    graphlib: graphlib_esm_exports,
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
