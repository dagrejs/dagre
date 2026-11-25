// Regression test for the published dist package format (dagrejs/dagre).
//
// test/bundle-test.ts imports ../index (source) via ts-jest, so it cannot catch a
// dist-format bug. This test exercises the BUILT dist bundles through real
// runtimes (tsx for ESM, node for CJS) by importing them at an absolute path.
//
// Importing by absolute path is what makes this faithful: Node/tsx reads the
// "type" field from the dist file's nearest package.json to decide whether a
// ".js" file is ESM or CJS. Without "type": "module" the ESM bundle
// (dist/dagre.esm.js, ESM syntax) is treated as CJS, so named imports are
// undefined and `new Graph()` throws. Adding "type": "module" fixes the ESM
// path; renaming the CJS bundle to .cjs keeps `require()` working under it.

import {execFileSync} from 'child_process';
import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join, resolve} from 'path';
import {pathToFileURL} from 'url';

const repoRoot = process.cwd();
const esmPath = resolve(repoRoot, 'dist', 'dagre.esm.js');
const cjsPath = resolve(repoRoot, 'dist', 'dagre.cjs');

// ESM smoke check run under tsx
const esmCheck = `import dagre, {Graph, layout, version} from ${JSON.stringify(pathToFileURL(esmPath).href)};

const problems = [];
if (typeof Graph !== 'function') problems.push('Graph is ' + typeof Graph + ', expected function');
if (typeof layout !== 'function') problems.push('layout is ' + typeof layout + ', expected function');
if (typeof version !== 'string') problems.push('version is ' + typeof version + ', expected string');
if (typeof dagre !== 'object') problems.push('dagre default export is ' + typeof dagre + ', expected object');
try {
    const g = new Graph().setGraph({});
    g.setNode('a', {width: 100, height: 100});
    g.setNode('b', {width: 100, height: 100});
    g.setEdge('a', 'b', {});
    layout(g);
    if (!g.hasNode('a')) problems.push('Graph operation failed');
} catch (e) {
    problems.push('layout() threw: ' + (e && e.message ? e.message : e));
}
if (problems.length) { console.error('ESM FAIL: ' + problems.join('; ')); process.exit(1); }
console.log('ESM OK');
`;

// CJS smoke check run under node
const cjsCheck = `const dagre = require(${JSON.stringify(cjsPath)});
const {Graph, layout} = dagre;
const g = new Graph().setGraph({});
g.setNode('a', {width: 100, height: 100});
g.setNode('b', {width: 100, height: 100});
g.setEdge('a', 'b', {});
layout(g);
if (!g.hasNode('a')) { console.error('CJS FAIL: Graph operation failed'); process.exit(1); }
console.log('CJS OK');
`;

describe('dist exports', () => {
    let tmpDir: string;

    beforeAll(() => {
        if (!existsSync(esmPath) || !existsSync(cjsPath)) {
            execFileSync('npm', ['run', 'build'], {
                cwd: repoRoot,
                stdio: 'pipe',
                shell: process.platform === 'win32',
            });
        }
        tmpDir = mkdtempSync(join(tmpdir(), 'dagre-dist-exports-'));
        writeFileSync(join(tmpDir, 'esm-check.mts'), esmCheck);
        writeFileSync(join(tmpDir, 'cjs-check.cjs'), cjsCheck);
    }, 60000);

    afterAll(() => {
        if (tmpDir) {
            rmSync(tmpDir, {recursive: true, force: true});
        }
    });

    it('ESM bundle exposes named exports under tsx', () => {
        const out = execFileSync('npx', ['tsx', join(tmpDir, 'esm-check.mts')], {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: process.platform === 'win32',
        });
        expect(out).toContain('ESM OK');
    }, 30000);

    it('CJS bundle is requireable under node', () => {
        const out = execFileSync(process.execPath, [join(tmpDir, 'cjs-check.cjs')], {
            cwd: repoRoot,
            encoding: 'utf8',
        });
        expect(out).toContain('CJS OK');
    }, 30000);
});
