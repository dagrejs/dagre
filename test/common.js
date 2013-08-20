self = {};

chai = require("chai");
assert = chai.assert;
dagre = require("../dagre");
graph = require("../lib/graph");
dot = require("../lib/dot");

chai.Assertion.includeStack = true;
