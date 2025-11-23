const esbuild = require('esbuild');
const fs = require('fs');
const { dependencies } = require('./package.json');

// Get all production dependencies to be marked as external (not bundled)
const external = Object.keys(dependencies || {});

const sharedConfig = {
  entryPoints: ['index.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2018',
  legalComments: 'linked',
  external: external.concat([
    '@dagrejs/graphlib'
  ]),
};

async function build() {
  // 1. CommonJS (CJS) - For Node.js `require()`
  await esbuild.build({
    ...sharedConfig,
    outfile: 'dist/dagre.cjs.js',
    format: 'cjs',
    platform: 'node',
  });

  // 2. ES Module (ESM) - For modern bundlers/native ES imports
  await esbuild.build({
    ...sharedConfig,
    outfile: 'dist/dagre.esm.js',
    format: 'esm',
    platform: 'neutral',
  });

  const iifeConfig = {
    ...sharedConfig,
    format: 'iife',
    globalName: 'dagre',
    platform: 'browser',
  };

  // 3. IIFE/UMD - For direct browser script tag
  await esbuild.build({
    ...iifeConfig,
    outfile: 'dist/dagre.min.js',
  });

  // 4. IIFE/UMD - For direct browser script tag, unminified
  await esbuild.build({
    ...iifeConfig,
    outfile: 'dist/dagre.js',
    minify: false,
  });

  fs.copyFileSync('index.d.ts', 'dist/dagre.d.ts');
  
  console.log('Build complete! 🚀');
}

build().catch(() => process.exit(1));