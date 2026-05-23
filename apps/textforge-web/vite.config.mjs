import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const loaderEntry = resolve(rootDir, 'src/scriptLoader.js');

export default defineConfig(({ command }) => ({
  base: './',
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
