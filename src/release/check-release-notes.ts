#!/usr/bin/env node

/**
 * Verifies changelog.md contains release notes for the current version.
 */

import fs from 'fs';
import semver from 'semver';

const CHANGELOG_FILE = 'changelog.md';

const packageFile = fs.readFileSync('package.json', 'utf-8');
const packageJson = JSON.parse(packageFile);

if (!('version' in packageJson)) {
    bail('ERROR: Could not find version in package.json');
}

const ver = semver.parse(packageJson.version);

if (!ver) {
    bail('ERROR: Could not parse version');
}

if (!fs.existsSync(CHANGELOG_FILE)) {
    bail(`ERROR: Could not find ${CHANGELOG_FILE}`);
}

const changelog = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
const escapedVersion = ver.version.replace(/\./g, '\\.');
const headingRegex = new RegExp(`^##\\s+v${escapedVersion}(?:\\s|$)`, 'm');
const match = headingRegex.exec(changelog);

if (!match) {
    bail(`ERROR: Release notes for v${ver.version} not found in ${CHANGELOG_FILE}`);
}

const afterHeading = changelog.slice(match.index + match[0].length);
const nextHeadingMatch = /^##\s+/m.exec(afterHeading);
const sectionContent = (nextHeadingMatch ? afterHeading.slice(0, nextHeadingMatch.index) : afterHeading).trim();

if (!sectionContent) {
    bail(`ERROR: Release notes for v${ver.version} in ${CHANGELOG_FILE} are empty`);
}

function bail(msg: string): never {
    process.stderr.write(msg + '\n');
    process.exit(1);
}
