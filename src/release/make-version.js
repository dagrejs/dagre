#!/usr/bin/env node

var package = require("../../package.json");
console.log("module.exports = \"" + package.version + "\";");
