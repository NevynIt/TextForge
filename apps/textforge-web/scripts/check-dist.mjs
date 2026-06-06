import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = resolve(rootDir, 'dist');
const [distIndexHtml, distScriptJs, distStyleCss, scriptLoaderSource, viteConfigSource] = await Promise.all([
  readFile(resolve(distDir, 'index.html'), 'utf8'),
  readFile(resolve(distDir, 'assets/textforge-loader.js'), 'utf8'),
  readFile(resolve(distDir, 'assets/textforge.css'), 'utf8'),
  readFile(resolve(rootDir, 'src/scriptLoader.js'), 'utf8'),
  readFile(resolve(rootDir, 'vite.config.mjs'), 'utf8'),
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

if (/node-compat\/process|node-compat\\process/.test(scriptLoaderSource)) {
  throw new Error('src/scriptLoader.js must not install the process compatibility shim before startup');
}

if (!viteConfigSource.includes("'process.env.FENGARICONF': 'undefined'")) {
  throw new Error('vite.config.mjs must compile away Fengari process.env.FENGARICONF access');
}

if (viteConfigSource.includes('process.versions.node')) {
  throw new Error('vite.config.mjs must not define process.versions.node for the browser build');
}

for (const [description, pattern] of [
  ['install a browser process shim', /globalThis\.process\s*=/],
  ['install a window process shim', /window\.process\s*=/],
  ['bundle the TextForge process compatibility shim', /Node process APIs are unavailable in the browser TextForge shell/],
  ['retain raw Fengari process configuration access', /process\.env\.FENGARICONF/],
  ['bundle Fengari child_process execution support', /child_process\.(?:exec|execSync|spawn|spawnSync)/],
  ['bundle Fengari temporary host-file support', /tmpNameSync|tmp\.tmpNameSync/],
  ['bundle Fengari Node package path resolution', /path(?:lib)?\.resolve\(\s*process\.cwd\(\)/],
]) {
  if (pattern.test(distScriptJs)) {
    throw new Error(`dist/assets/textforge-loader.js must not ${description}`);
  }
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
  let state = 'code';

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    const previous = source[index - 1];

    if (state === 'code') {
      if (current === '/' && next === '/') {
        state = 'line-comment';
        index += 1;
        continue;
      }

      if (current === '/' && next === '*') {
        state = 'block-comment';
        index += 1;
        continue;
      }

      if (current === '\'') {
        state = 'single-quote';
        continue;
      }

      if (current === '"') {
        state = 'double-quote';
        continue;
      }

      if (current === '`') {
        state = 'template';
        continue;
      }

      if (matchesKeyword(source, index, 'import')) {
        if (isDynamicImport(source, index) || isStaticImport(source, index)) {
          return true;
        }
        index += 'import'.length - 1;
        continue;
      }

      if (matchesKeyword(source, index, 'export')) {
        if (isExportStatement(source, index)) {
          return true;
        }
        index += 'export'.length - 1;
        continue;
      }

      continue;
    }

    if (state === 'line-comment') {
      if (current === '\n') {
        state = 'code';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        state = 'code';
        index += 1;
      }
      continue;
    }

    if (state === 'single-quote') {
      if (current === '\'' && previous !== '\\') {
        state = 'code';
      }
      continue;
    }

    if (state === 'double-quote') {
      if (current === '"' && previous !== '\\') {
        state = 'code';
      }
      continue;
    }

    if (state === 'template') {
      if (current === '`' && previous !== '\\') {
        state = 'code';
      }
    }
  }

  return false;
}

function matchesKeyword(source, index, keyword) {
  if (!source.startsWith(keyword, index)) {
    return false;
  }
  return !isIdentifierChar(source[index - 1]) && !isIdentifierChar(source[index + keyword.length]);
}

function isStaticImport(source, index) {
  if (!hasStatementPrefix(source, index)) {
    return false;
  }

  const nextIndex = skipWhitespace(source, index + 'import'.length);
  return nextIndex > index + 'import'.length && /[\w*{]/.test(source[nextIndex] ?? '');
}

function isDynamicImport(source, index) {
  const previous = source[index - 1];
  if (isIdentifierChar(previous) || previous === '$' || previous === '.' || previous === '}') {
    return false;
  }

  return source[skipWhitespace(source, index + 'import'.length)] === '(';
}

function isExportStatement(source, index) {
  if (!hasStatementPrefix(source, index)) {
    return false;
  }

  const nextIndex = skipWhitespace(source, index + 'export'.length);
  if (nextIndex === index + 'export'.length) {
    return false;
  }

  const next = source[nextIndex];
  if (next === '{' || next === '*') {
    return true;
  }

  return ['default', 'const', 'function', 'class', 'let', 'var']
    .some((keyword) => matchesKeyword(source, nextIndex, keyword));
}

function hasStatementPrefix(source, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const current = source[cursor];
    if (current === ' ' || current === '\t' || current === '\r') {
      continue;
    }
    return current === ';' || current === '\n';
  }

  return true;
}

function skipWhitespace(source, index) {
  let cursor = index;
  while (/\s/.test(source[cursor] ?? '')) {
    cursor += 1;
  }
  return cursor;
}

function isIdentifierChar(value) {
  return typeof value === 'string' && /[\w$]/.test(value);
}
