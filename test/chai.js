var chai = require("chai");

module.exports = chai;

chai.config.includeStack = true;

/*
 * Fix Chai"s `notProperty` which passes when an object has a property but its
 * value is undefined.
 */
chai.assert.notProperty = function(obj, prop) {
  chai.assert(!(prop in obj), "Found prop " + prop + " in " + obj + " with value " + obj[prop]);
};
