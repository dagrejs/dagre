// Renders the version.js template and prints it to stdout

var version = require('../../package.json').version;
console.log('module.exports = \'' + version + '\';');
