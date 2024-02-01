#!/usr/bin/env node

let package = require("../../package.json");
console.log("export default \"" + package.version + "\";");
