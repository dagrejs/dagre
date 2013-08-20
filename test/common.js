var chai = require("chai");
chai.Assertion.includeStack = true;

exports.requireSrc = function(path) {
  return require(__dirname + "/../" + path);
};
