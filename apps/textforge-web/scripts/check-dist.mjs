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

for (const [label, source, pattern] of [
  ['dist/index.html', distIndexHtml, /\b(?:src|href)\s*=\s*["']https?:\/\//i],
  ['dist/assets/textforge.css', distStyleCss, /url\(\s*["']?https?:\/\//i],
  ['dist/assets/textforge-loader.js', distScriptJs, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|import)\s*\(\s*["']https?:\/\//i],
]) {
  if (pattern.test(source)) {
    throw new Error(`${label} must not require remote or CDN asset URLs for the shipped local artifact`);
  }
}

// Ensure the built HTML includes a CSP meta tag that declares default-src and forbids unsafe-inline.
function extractMetaContent(html, httpEquiv) {
  const re1 = new RegExp(`<meta[^>]*http-equiv\\s*=\\s*["']${httpEquiv}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`, 'i');
  const re2 = new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*http-equiv\\s*=\\s*["']${httpEquiv}["'][^>]*>`, 'i');
  let m = html.match(re1) || html.match(re2);
  return m ? m[1] : null;
}

const cspContent = extractMetaContent(distIndexHtml, 'Content-Security-Policy');
if (!cspContent) {
  throw new Error('dist/index.html must include a Content-Security-Policy meta tag for file:// launch');
}
if (!/default-src/i.test(cspContent)) {
  throw new Error('dist/index.html Content-Security-Policy must declare a default-src directive');
}
if (/unsafe-inline/i.test(cspContent)) {
  throw new Error('dist/index.html Content-Security-Policy must not allow unsafe-inline');
}

console.info('TextForge dist file:// checks passed.');

function hasEsModuleSyntax(source) {
  const sanitized = stripStringsAndComments(source);
  return /(^|[;\n])\s*import\s+[\w*{]/m.test(sanitized)
    || /(^|[^\w$.}])import\s*\(/.test(sanitized)
    || /(^|[;\n])\s*export\s+(?:\{|\*|default|const|function|class|let|var)/m.test(sanitized);
}

function stripStringsAndComments(source) {
  let result = '';
  let state = 'code';

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    const previous = source[index - 1];

    if (state === 'code') {
      if (current === '/' && next === '/') {
        state = 'line-comment';
        result += '  ';
        index += 1;
        continue;
      }

      if (current === '/' && next === '*') {
        state = 'block-comment';
        result += '  ';
        index += 1;
        continue;
      }

      if (current === '\'') {
        state = 'single-quote';
        result += ' ';
        continue;
      }

      if (current === '"') {
        state = 'double-quote';
        result += ' ';
        continue;
      }

      if (current === '`') {
        state = 'template';
        result += ' ';
        continue;
      }

      result += current;
      continue;
    }

    if (state === 'line-comment') {
      if (current === '\n') {
        state = 'code';
        result += '\n';
      } else {
        result += ' ';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        state = 'code';
        result += '  ';
        index += 1;
      } else {
        result += current === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (state === 'single-quote') {
      if (current === '\'' && previous !== '\\') {
        state = 'code';
      }
      result += current === '\n' ? '\n' : ' ';
      continue;
    }

    if (state === 'double-quote') {
      if (current === '"' && previous !== '\\') {
        state = 'code';
      }
      result += current === '\n' ? '\n' : ' ';
      continue;
    }

    if (state === 'template') {
      if (current === '`' && previous !== '\\') {
        state = 'code';
      }
      result += current === '\n' ? '\n' : ' ';
    }
  }

  return result;
}
