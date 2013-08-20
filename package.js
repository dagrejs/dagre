dagre = {};

var sys = require('sys'),
    version = require('./lib/version');

sys.puts(JSON.stringify({
  name: "dagre",
  version: version,
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
  "testling": {
    "files": "test/**/*.js",
    "browsers": [ "ie8", "ie9", "ff/13", "chrome/20" ],
    "harness" : "mocha"
  },
  devDependencies: {
    browserify: "2.28.x",
    chai: "1.3.x",
    mocha: "1.5.x",
    pegjs: "0.7.x",
    "uglify-js": "1.2.3",
  },
  author: "Chris Pettitt <chris@samsarin.com>",
  repository: {
    type: "git",
    url: "https://github.com/cpettitt/dagre.git"
  },
  license: "MIT"
}, null, 2));
