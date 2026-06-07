import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const loaderEntry = resolve(rootDir, 'src/scriptLoader.js');
const browserFsShim = resolve(rootDir, 'src/node-compat/fs.js');
const browserFsPromisesShim = resolve(rootDir, 'src/node-compat/fs-promises.js');
const browserFengariLuaconfShim = resolve(rootDir, 'src/fengari-browser/luaconf.cjs');
const browserFengariLualibShim = resolve(rootDir, 'src/fengari-browser/lualib.cjs');
const browserOsShim = resolve(rootDir, 'src/node-compat/os.js');
const fengariLuaconfEntry = require.resolve('fengari/src/luaconf.js');
const fengariLualibEntry = require.resolve('fengari/src/lualib.js');

function resolveFengariBrowserHostImport(source, importer) {
  if (source === 'fengari/src/luaconf.js' || source === fengariLuaconfEntry) {
    return browserFengariLuaconfShim;
  }

  if (source === 'fengari/src/lualib.js' || source === fengariLualibEntry) {
    return browserFengariLualibShim;
  }

  if (
    (source === './lualib.js' || source === './luaconf.js')
    && typeof importer === 'string'
    && importer.replaceAll('\\', '/').includes('/fengari/src/')
  ) {
    return source === './luaconf.js' ? browserFengariLuaconfShim : browserFengariLualibShim;
  }

  return undefined;
}

function browserFengariHostPlugin() {
  return {
    name: 'textforge-browser-fengari-host',
    enforce: 'pre',
    resolveId(source, importer) {
      return resolveFengariBrowserHostImport(source, importer);
    },
  };
}

function browserFengariOptimizeDepsPlugin() {
  return {
    name: 'textforge-browser-fengari-optimize-deps',
    resolveId(source, importer) {
      return resolveFengariBrowserHostImport(source, importer);
    },
  };
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    browserFengariHostPlugin(),
  ],
  define: command === 'build'
    ? {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.LOG': 'undefined',
      }
    : undefined,
  resolve: {
    alias: [
      { find: 'fs/promises', replacement: browserFsPromisesShim },
      { find: 'node:fs/promises', replacement: browserFsPromisesShim },
      { find: 'fs', replacement: browserFsShim },
      { find: 'node:fs', replacement: browserFsShim },
      { find: fengariLuaconfEntry, replacement: browserFengariLuaconfShim },
      { find: /fengari[/\\]src[/\\]luaconf\.js$/, replacement: browserFengariLuaconfShim },
      { find: './luaconf.js', replacement: browserFengariLuaconfShim },
      { find: fengariLualibEntry, replacement: browserFengariLualibShim },
      { find: /fengari[/\\]src[/\\]lualib\.js$/, replacement: browserFengariLualibShim },
      { find: './lualib.js', replacement: browserFengariLualibShim },
      { find: 'os', replacement: browserOsShim },
      { find: 'node:os', replacement: browserOsShim },
    ],
  },
  optimizeDeps: {
    force: true,
    rolldownOptions: {
      plugins: [
        browserFengariOptimizeDepsPlugin(),
      ],
    },
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
