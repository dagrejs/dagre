#!/usr/bin/env node

// Renders the bower.json template and prints it to stdout

var packageJson = require("../../package.json");

var template = {
  name: packageJson.name,
  version: packageJson.version,
  main: ["dist/" + packageJson.name + ".core.js", "dist/" + packageJson.name + ".core.min.js"],
  ignore: [
    ".*",
    "README.md",
    "CHANGELOG.md",
    "Makefile",
    "browser.js",
    "dist/" + packageJson.name + ".js",
    "dist/" + packageJson.name + ".min.js",
    "index.js",
    "karma*",
    "lib/**",
    "package.json",
    "src/**",
    "test/**"
  ],
  dependencies: packageJson.dependencies
};

console.log(JSON.stringify(template, null, 2));
