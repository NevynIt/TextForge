import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const loaderEntry = resolve(rootDir, 'src/scriptLoader.js');
const browserFsShim = resolve(rootDir, 'src/node-compat/fs.js');
const browserFsPromisesShim = resolve(rootDir, 'src/node-compat/fs-promises.js');
const browserFengariLualibShim = resolve(rootDir, 'src/fengari-browser/lualib.cjs');
const browserOsShim = resolve(rootDir, 'src/node-compat/os.js');
const fengariLualibEntry = require.resolve('fengari/src/lualib.js');
const xtermCssEntry = resolve(
  require.resolve('@xterm/xterm/package.json'),
  '../css/xterm.css',
);

function browserFengariHostPlugin() {
  return {
    name: 'textforge-browser-fengari-host',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === './lualib.js'
        && typeof importer === 'string'
        && importer.replaceAll('\\', '/').includes('/fengari/src/')
      ) {
        return browserFengariLualibShim;
      }

      return undefined;
    },
  };
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    browserFengariHostPlugin(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development'),
    'process.env.FENGARICONF': 'undefined',
  },
  resolve: {
    alias: [
      { find: '@textforge/vendor/xterm.css', replacement: xtermCssEntry },
      { find: 'fs/promises', replacement: browserFsPromisesShim },
      { find: 'node:fs/promises', replacement: browserFsPromisesShim },
      { find: 'fs', replacement: browserFsShim },
      { find: 'node:fs', replacement: browserFsShim },
      { find: fengariLualibEntry, replacement: browserFengariLualibShim },
      { find: /fengari[/\\]src[/\\]lualib\.js$/, replacement: browserFengariLualibShim },
      { find: 'os', replacement: browserOsShim },
      { find: 'node:os', replacement: browserOsShim },
    ],
  },
  build: command === 'build'
    ? {
        cssCodeSplit: false,
        lib: {
          entry: loaderEntry,
          name: 'TextForgeLoader',
          formats: ['iife'],
          cssFileName: 'textforge',
          fileName: () => 'assets/textforge-loader.js',
        },
        rollupOptions: {
          output: {
            assetFileNames: 'assets/[name][extname]',
          },
        },
      }
    : undefined,
}));
