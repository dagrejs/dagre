var chai = require('chai');
chai.Assertion.includeStack = true;

module.exports = chai.assert;

/*
 * Fix Chai's `notProperty` which passes when an object has a property but its
 * value is undefined.
 */
chai.assert.notProperty = function(obj, prop) {
  chai.assert(!(prop in obj), 'Found prop ' + prop + ' in ' + obj + ' with value ' + obj[prop]);
};
