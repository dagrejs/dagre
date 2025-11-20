const esbuild = require('esbuild');
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

  // 3. IIFE/UMD - For direct browser script tag
  await esbuild.build({
    ...sharedConfig,
    outfile: 'dist/dagre.min.js',
    format: 'iife',
    globalName: 'dagre',
    platform: 'browser',
    external: [], 
    minify: true,
  });

  // 4. IIFE/UMD - For direct browser script tag
  await esbuild.build({
    ...sharedConfig,
    outfile: 'dist/dagre.js',
    format: 'iife',
    globalName: 'dagre',
    platform: 'browser',
    external: [], 
    minify: false,
  });
  
  console.log('Build complete! 🚀');
}

build().catch(() => process.exit(1));