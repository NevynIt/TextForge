import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexHtml = await readFile(resolve(rootDir, 'index.html'), 'utf8');
const mainJs = await readFile(resolve(rootDir, 'src/main.js'), 'utf8');
const workbenchJs = await readFile(resolve(rootDir, 'src/workbench.js'), 'utf8');

if (!indexHtml.includes('./src/main.js')) {
  throw new Error('index.html must load ./src/main.js as the Vite application entrypoint');
}

if (!indexHtml.includes('./src/styles.css')) {
  throw new Error('index.html must load ./src/styles.css as the shell stylesheet');
}

if (!mainJs.includes('./workbench.js') || !mainJs.includes('bootTextForgeShell')) {
  throw new Error('main.js must bootstrap the package-driven workbench module');
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
