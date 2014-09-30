#!/usr/bin/env node

// Renders the bower.json template and prints it to stdout

var template = {
  name: 'dagre',
  version: require('../../package.json').version,
  main: ['js/dagre.js', 'js/dagre.min.js'],
  ignore: [
    'README.md'
  ],
  dependencies: {
  }
};

console.log(JSON.stringify(template, null, 2));
