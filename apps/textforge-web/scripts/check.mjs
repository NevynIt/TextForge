import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexHtml = await readFile(resolve(rootDir, 'index.html'), 'utf8');
const mainJs = await readFile(resolve(rootDir, 'src/main.js'), 'utf8');
const workbenchJs = await readFile(resolve(rootDir, 'src/workbench.js'), 'utf8');

if (!indexHtml.includes('./src/main.js')) {
  throw new Error('index.html must load ./src/main.js for file:// compatibility');
}

if (!indexHtml.includes('./src/styles.css')) {
  throw new Error('index.html must load ./src/styles.css for file:// compatibility');
}

if (!mainJs.includes('./workbench.js') || !mainJs.includes('bootTextForgeShell')) {
  throw new Error('main.js must bootstrap the package-driven workbench module');
}

for (const requiredImport of [
  '../../packages/workspace/src/index.js',
  '../../packages/surfaces/src/index.js',
  '../../packages/editors/src/index.js',
  '../../packages/assets/src/index.js',
  '../../packages/ui/src/index.js',
]) {
  if (!workbenchJs.includes(requiredImport)) {
    throw new Error(`workbench.js must import ${requiredImport}`);
  }
}

console.info('TextForge web shell checks passed.');
