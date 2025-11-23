#!/usr/bin/env node

/*
 * Prints the current version from the specified package-file to stdout or
 * fails with an error if either the version cannot be determined or it is
 * a pre-release.
 */

let fs = require("fs"),
  semver = require("semver");

let packageFile = fs.readFileSync("package.json");
let packageJson = JSON.parse(packageFile);

if (!("version" in packageJson)) {
  bail("ERROR: Could not find version in package.json");
}

let ver = semver.parse(packageJson.version),
  preRelease = process.env.PRE_RELEASE;

if (ver.prerelease.length > 0 && !preRelease) {
  bail("ERROR: version is a pre-release: " + ver);
}

console.log(ver.toString());

// Write an error message to stderr and then exit immediately with an error.
function bail(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}
