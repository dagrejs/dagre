dagre = {};

require('./src/version.js');

var sys = require('sys');

sys.puts(JSON.stringify({
  name: "dagre",
  version: dagre.version,
  description: "Directed graph rendering",
  main: "index.js",
  directories: {
    src: "src",
    test: "test"
  },
  scripts: {
    test: "make test"
  },
  keywords: [
    "graph"
  ],
  devDependencies: {
    pegjs: "0.7.x",
    mocha: "1.5.x",
    chai: "1.3.x",
    "uglify-js": "1.2.3"
  },
  author: "Chris Pettitt <chris@samsarin.com>",
  repository: {
    type: "git",
    url: "https://github.com/cpettitt/dagre.git"
  },
  license: "MIT"
}, null, 2));
