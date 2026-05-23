import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distIndexPath = resolve(rootDir, 'dist/index.html');
const html = await readFile(distIndexPath, 'utf8');

const nextHtml = html.replace(
  /<script type="module" crossorigin src="(\.\/assets\/[^"]+\.js)"><\/script>/,
  '<script defer src="$1"></script>',
);

if (nextHtml === html) {
  throw new Error('Expected Vite module script tag was not found in dist/index.html');
}

await writeFile(distIndexPath, nextHtml);
console.info('TextForge dist converted to classic file:// script.');
