import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexHtml = await readFile(resolve(rootDir, 'index.html'), 'utf8');
const fileIndexHtml = await readFile(resolve(rootDir, 'public/index.html'), 'utf8');
const mainJs = await readFile(resolve(rootDir, 'src/main.js'), 'utf8');
const scriptLoaderJs = await readFile(resolve(rootDir, 'src/scriptLoader.js'), 'utf8');
const workbenchJs = await readFile(resolve(rootDir, 'src/workbench.js'), 'utf8');
const viteConfig = await readFile(resolve(rootDir, 'vite.config.mjs'), 'utf8');

if (!indexHtml.includes('./src/scriptLoader.js')) {
  throw new Error('index.html must load ./src/scriptLoader.js as the development entrypoint');
}

if (indexHtml.includes('type="module"') && indexHtml.includes('./src/scriptLoader.js') && fileIndexHtml.includes('type="module"')) {
  throw new Error('public/index.html must not use module scripts for the file-launch artifact');
}

if (!fileIndexHtml.includes('./assets/textforge-loader.js')) {
  throw new Error('public/index.html must load the classic textforge loader bundle');
}

if (!fileIndexHtml.includes('./assets/textforge.css')) {
  throw new Error('public/index.html must load the built shell stylesheet');
}

if (!scriptLoaderJs.includes('./styles.css') || !scriptLoaderJs.includes('./main.js') || !scriptLoaderJs.includes('DOMContentLoaded')) {
  throw new Error('scriptLoader.js must own shell styles and defer the main bootstrap until the DOM is ready');
}

if (!mainJs.includes('./workbench.js') || !mainJs.includes('bootTextForgeShell') || !mainJs.includes('mountTextForgeShell')) {
  throw new Error('main.js must expose the package-driven workbench bootstrap helper');
}

if (!viteConfig.includes("base: './'")) {
  throw new Error('vite.config.mjs must use base ./ so the built shell works from file://');
}

if (!viteConfig.includes("formats: ['iife']") || !viteConfig.includes("fileName: () => 'assets/textforge-loader.js'")) {
  throw new Error('vite.config.mjs must emit a deterministic classic loader bundle for file:// launch');
}

if (!viteConfig.includes('cssCodeSplit: false') || !viteConfig.includes("cssFileName: 'textforge'")) {
  throw new Error('vite.config.mjs must emit a single stylesheet for the file-launch artifact');
}

for (const requiredImport of [
  '@textforge/workspace',
  '@textforge/surfaces',
  '@textforge/editors',
  '@textforge/assets',
  '@textforge/ui',
]) {
  if (!workbenchJs.includes(requiredImport)) {
    throw new Error(`workbench.js must import ${requiredImport}`);
  }
}

console.info('TextForge web shell checks passed.');
