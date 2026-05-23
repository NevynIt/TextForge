import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexHtml = await readFile(resolve(rootDir, 'index.html'), 'utf8');
const mainJs = await readFile(resolve(rootDir, 'src/main.js'), 'utf8');

if (!indexHtml.includes('/src/main.js')) {
  throw new Error('index.html must load /src/main.js');
}

if (!indexHtml.includes('/src/styles.css')) {
  throw new Error('index.html must load /src/styles.css');
}

if (!mainJs.includes('TextForge') || !mainJs.includes('render()')) {
  throw new Error('main.js must define the runnable shell render loop');
}

console.info('TextForge web shell checks passed.');
