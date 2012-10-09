chai = require("chai"),
assert = chai.assert,
dagre = require("../index");

chai.Assertion.includeStack = true;

ids = function(objs) {
  return objs.map(function(obj) { return obj.id(); });
}

tails = function(es) {
  return es.map(function(e) { return e.tail(); });
}

heads = function(es) {
  return es.map(function(e) { return e.head(); });
}
