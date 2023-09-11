#!/usr/bin/env node

let package = require("../../package.json");
console.log("module.exports = \"" + package.version + "\";");
