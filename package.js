dagre = {};

require('./src/version.js');

var sys = require('sys');

sys.puts(JSON.stringify({
  "name": "dagre",
  "version": dagre.version,
  "description": "Directed graph rendering",
  "main": "index.js",
  "directories": {
    "src": "src",
    "test": "test"
  },
  "scripts": {
    "test": "mocha -R spec"
  },
  "keywords": [
    "graph"
  ],
  "devDependencies": {
  },
  "author": "Chris Pettitt <chris@samsarin.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/cpettitt/dagre.git"
  },
  "license": "MIT"
}, null, 2));
