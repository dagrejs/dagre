var fs = require('fs');
module.exports = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;
