#!/usr/bin/env node

let packagejson = require("../../package.json");
console.log("module.exports = \"" + packagejson.version + "\";");
