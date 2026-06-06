import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const withoutDocs = process.argv.includes('--without-docs');
const distDirArgIndex = process.argv.indexOf('--dist-dir');
const distDirectoryName = distDirArgIndex >= 0
  ? process.argv[distDirArgIndex + 1]
  : 'dist-single';
const singleDistDir = resolve(rootDir, distDirectoryName);
const [singleDistEntries, singleIndexHtml] = await Promise.all([
  readdir(singleDistDir, { withFileTypes: true }),
  readFile(resolve(singleDistDir, 'index.html'), 'utf8'),
]);

const unexpectedDistEntries = singleDistEntries
  .map((entry) => entry.name)
  .filter((name) => name !== 'index.html');

if (unexpectedDistEntries.length > 0) {
  throw new Error(`dist-single must contain only index.html for single-file shipping, found: ${unexpectedDistEntries.join(', ')}`);
}

const shellHtml = stripInlineBlocks(singleIndexHtml);

for (const forbidden of [
  'src="/assets/',
  'href="/assets/',
  'src="./assets/',
  'href="./assets/',
  'type="module"',
  'modulepreload',
]) {
  if (shellHtml.includes(forbidden)) {
    throw new Error(`dist-single/index.html must not contain ${forbidden}`);
  }
}

const scriptJs = extractSingleInlineBlock(singleIndexHtml, 'script', 'textforge-loader');
const styleCss = extractSingleInlineBlock(singleIndexHtml, 'style', 'textforge-codemirror-style');
const docsJs = extractOptionalInlineBlock(singleIndexHtml, 'script', 'textforge-bundled-docs');

if (!/<script\s+nonce="textforge-loader">/i.test(singleIndexHtml)) {
  throw new Error('dist-single/index.html must inline the dedicated classic loader bundle with a CSP nonce');
}

if (!/<style\s+nonce="textforge-codemirror-style">/i.test(singleIndexHtml)) {
  throw new Error('dist-single/index.html must inline the built shell stylesheet with the CodeMirror CSP nonce');
}

if (hasEsModuleSyntax(scriptJs)) {
  throw new Error('dist-single/index.html inline script must not contain runtime ES module syntax');
}

for (const forbiddenStartupCopy of [
  'Markdown preview and generated assets',
  'restored TF-MD preview, generated-asset export',
  'Markdown resources can open in both the source editor and the package-owned TF-MD preview surface',
]) {
  if (scriptJs.includes(forbiddenStartupCopy)) {
    throw new Error(`${distDirectoryName}/index.html inline script must not retain stale startup copy: ${forbiddenStartupCopy}`);
  }
}

if (!styleCss.trim()) {
  throw new Error('dist-single/index.html inline style must not be empty');
}

if (withoutDocs && docsJs !== undefined) {
  throw new Error(`${distDirectoryName}/index.html must omit bundled docs for the small single-file artifact`);
}

if (!withoutDocs && !docsJs?.includes('globalThis.TextForgeBundledDocs')) {
  throw new Error(`${distDirectoryName}/index.html must inline the bundled docs payload`);
}

for (const [description, pattern] of [
  ['install a browser process shim', /globalThis\.process\s*=/],
  ['install a window process shim', /window\.process\s*=/],
  ['bundle the TextForge process compatibility shim', /Node process APIs are unavailable in the browser TextForge shell/],
  ['retain raw Fengari process configuration access', /process\.env\.FENGARICONF/],
  ['retain raw process environment access', /process\.env\.[A-Z0-9_]+/],
  ['bundle Fengari child_process execution support', /child_process\.(?:exec|execSync|spawn|spawnSync)/],
  ['bundle Fengari temporary host-file support', /tmpNameSync|tmp\.tmpNameSync/],
  ['bundle Fengari Node package path resolution', /path(?:lib)?\.resolve\(\s*process\.cwd\(\)/],
]) {
  if (pattern.test(scriptJs)) {
    throw new Error(`dist-single/index.html inline script must not ${description}`);
  }
}

for (const [label, source, pattern] of [
  ['dist-single/index.html', shellHtml, /\b(?:src|href)\s*=\s*["']https?:\/\//i],
  ['dist-single/index.html inline style', styleCss, /url\(\s*["']?https?:\/\//i],
  ['dist-single/index.html inline script', scriptJs, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|import)\s*\(\s*["']https?:\/\//i],
]) {
  if (pattern.test(source)) {
    throw new Error(`${label} must not require remote or CDN asset URLs for the shipped local artifact`);
  }
}

const cspContent = extractMetaContent(singleIndexHtml, 'Content-Security-Policy');
if (!cspContent) {
  throw new Error('dist-single/index.html must include a Content-Security-Policy meta tag for file:// launch');
}
if (!/default-src/i.test(cspContent)) {
  throw new Error('dist-single/index.html Content-Security-Policy must declare a default-src directive');
}
if (/unsafe-inline/i.test(cspContent)) {
  throw new Error('dist-single/index.html Content-Security-Policy must not allow unsafe-inline');
}
if (!cspContent.includes("'nonce-textforge-loader'")) {
  throw new Error('dist-single/index.html Content-Security-Policy must allow the inline loader nonce');
}
if (withoutDocs && cspContent.includes("'nonce-textforge-bundled-docs'")) {
  throw new Error(`${distDirectoryName}/index.html Content-Security-Policy must not allow the omitted docs nonce`);
}
if (!withoutDocs && !cspContent.includes("'nonce-textforge-bundled-docs'")) {
  throw new Error(`${distDirectoryName}/index.html Content-Security-Policy must allow the inline docs nonce`);
}
if (!cspContent.includes("'nonce-textforge-codemirror-style'")) {
  throw new Error('dist-single/index.html Content-Security-Policy must allow the inline style nonce');
}

console.info('TextForge single-file dist checks passed.');

function extractSingleInlineBlock(html, tagName, nonce) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*nonce=["']${nonce}["'][^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`dist-single/index.html must include exactly one nonce-bearing inline ${tagName} block, found ${matches.length}`);
  }
  return matches[0][1] ?? '';
}

function extractOptionalInlineBlock(html, tagName, nonce) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*nonce=["']${nonce}["'][^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = [...html.matchAll(pattern)];
  if (matches.length > 1) {
    throw new Error(`${distDirectoryName}/index.html must include at most one nonce-bearing inline ${tagName} block for ${nonce}, found ${matches.length}`);
  }
  return matches[0]?.[1];
}

function extractMetaContent(html, httpEquiv) {
  const re1 = new RegExp(`<meta[^>]*http-equiv\\s*=\\s*"${httpEquiv}"[^>]*content\\s*=\\s*"([^"]*)"[^>]*>`, 'i');
  const re2 = new RegExp(`<meta[^>]*content\\s*=\\s*"([^"]*)"[^>]*http-equiv\\s*=\\s*"${httpEquiv}"[^>]*>`, 'i');
  const re3 = new RegExp(`<meta[^>]*http-equiv\\s*=\\s*'${httpEquiv}'[^>]*content\\s*=\\s*'([^']*)'[^>]*>`, 'i');
  const re4 = new RegExp(`<meta[^>]*content\\s*=\\s*'([^']*)'[^>]*http-equiv\\s*=\\s*'${httpEquiv}'[^>]*>`, 'i');
  const match = html.match(re1) || html.match(re2) || html.match(re3) || html.match(re4);
  return match ? match[1] : null;
}

function stripInlineBlocks(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

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
