import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distIndexHtml = await readFile(resolve(rootDir, 'dist/index.html'), 'utf8');

for (const forbidden of ['src="/assets/', 'href="/assets/']) {
  if (distIndexHtml.includes(forbidden)) {
    throw new Error(`dist/index.html uses root-relative built assets (${forbidden}); file:// launch requires relative paths`);
  }
}

for (const required of ['src="./assets/', 'href="./assets/']) {
  if (!distIndexHtml.includes(required)) {
    throw new Error(`dist/index.html must include ${required} for file:// launch`);
  }
}

console.info('TextForge dist file:// checks passed.');
