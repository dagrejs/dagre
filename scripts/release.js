#!/usr/bin/env node

/**
 * Release script that:
 * 1. Updates package.json version to match the release tag
 * 2. Runs tests (unit-test and browser-test)
 * 3. Runs linting
 * 4. Builds the distribution files
 */

const fs = require('fs');
const { execSync } = require('child_process');
const semver = require('semver');

function log(message) {
  console.log(`[RELEASE] ${message}`);
}

function bail(message) {
  console.error(`[RELEASE ERROR] ${message}`);
  process.exit(1);
}

function execCommand(command, description) {
  log(`${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed`);
  } catch (error) {
    bail(`Failed during: ${description}`);
  }
}

function main() {
  // Get the release tag from environment or command line
  const releaseTag = process.env.GITHUB_REF_NAME || process.argv[2];
  
  if (!releaseTag) {
    bail('No release tag provided. Set GITHUB_REF_NAME or pass as argument.');
  }

  log(`Starting release process for tag: ${releaseTag}`);

  // Extract version from tag (remove 'v' prefix if present)
  const version = releaseTag.startsWith('v') ? releaseTag.slice(1) : releaseTag;

  // Validate version format
  if (!semver.valid(version)) {
    bail(`Invalid version format: ${version}`);
  }

  log(`Target version: ${version}`);

  // Update package.json version
  log('Updating package.json version...');
  const packagePath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✓ Updated package.json version to ${version}`);

  // Update lib/version.js
  execCommand('make lib/version.js', 'Updating lib/version.js');

  // Run tests
  execCommand('make unit-test', 'Running unit tests');
  execCommand('make browser-test', 'Running browser tests');

  // Run linting
  execCommand('make lint', 'Running linting');

  // Build distribution
  execCommand('make dist', 'Building distribution files');

  log('🎉 Release build completed successfully!');
  log(`Version ${version} is ready for deployment.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };