#!/usr/bin/env node

/*
 * Bumps the minor version and sets the prelease tag.
 */

import * as fs from 'fs';
import * as semver from 'semver';

const packageFile = fs.readFileSync('package.json', 'utf-8');
const packageJson = JSON.parse(packageFile) as { version?: string; [key: string]: unknown };

if (!('version' in packageJson)) {
    bail('ERROR: Could not find version in package.json');
}

const ver = semver.parse(packageJson.version!);
if (ver) {
    packageJson.version = ver.inc('patch').toString() + '-pre';
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, undefined, 2));

// Write an error message to stderr and then exit immediately with an error.
function bail(msg: string): never {
    console.error(msg + '\n');
    process.exit(1);
}
