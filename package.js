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
  devDependencies: {
    browserify: "2.28.x",
    chai: "1.7.x",
    mocha: "1.12.x",
    pegjs: "0.7.x",
    "uglify-js": "1.2.3",
  },
  author: "Chris Pettitt <chris@samsarin.com>",
  repository: {
    type: "git",
    url: "https://github.com/cpettitt/dagre.git"
  },
  license: "MIT",
  "testling": {
    "files": ["test/**/*.js"],
    "browsers": [
      "ie/8..latest",
      "firefox/17..latest",
      "firefox/nightly",
      "chrome/22..latest",
      "chrome/canary",
      "opera/12..latest",
      "opera/next",
      "safari/5.1..latest",
      "ipad/6.0..latest",
      "iphone/6.0..latest",
      "android-browser/4.2..latest"
    ],
    "harness": "mocha"
  }
}, null, 2));
