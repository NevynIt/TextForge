import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(rootDir, 'dist');
const [distIndexHtml, distScriptJs, distStyleCss] = await Promise.all([
  readFile(resolve(distDir, 'index.html'), 'utf8'),
  readFile(resolve(distDir, 'assets/textforge-loader.js'), 'utf8'),
  readFile(resolve(distDir, 'assets/textforge.css'), 'utf8'),
]);

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

if (distIndexHtml.includes('type="module"')) {
  throw new Error('dist/index.html must not use module scripts for direct file:// launch');
}

if (distIndexHtml.includes('modulepreload')) {
  throw new Error('dist/index.html must not use modulepreload for direct file:// launch');
}

if (!distIndexHtml.includes('<script defer src="./assets/textforge-loader.js"></script>')) {
  throw new Error('dist/index.html must load the dedicated classic loader bundle');
}

if (!distIndexHtml.includes('<link rel="stylesheet" href="./assets/textforge.css" />')) {
  throw new Error('dist/index.html must load the built shell stylesheet');
}

if (hasEsModuleSyntax(distScriptJs)) {
  throw new Error('dist/assets/textforge-loader.js must not contain runtime ES module syntax');
}

if (!distStyleCss.trim()) {
  throw new Error('dist/assets/textforge.css must not be empty');
}

console.info('TextForge dist file:// checks passed.');

function hasEsModuleSyntax(source) {
  return /(^|[;\n])\s*import\s+[\w*{]/m.test(source)
    || /(^|[^\w$.}])import\s*\(/.test(source)
    || /(^|[;\n])\s*export\s+(?:\{|\*|default|const|function|class|let|var)/m.test(source);
}
