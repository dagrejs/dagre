#!/usr/bin/env node

import jsonPackage from '../../package.json';

console.log(`export const version = "${jsonPackage.version}";`);
