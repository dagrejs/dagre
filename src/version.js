var fs = require("fs");
var package = JSON.parse(fs.readFileSync(__dirname + "/../package.json", "utf8"));
console.log("module.exports = '" + package.version + "';");
