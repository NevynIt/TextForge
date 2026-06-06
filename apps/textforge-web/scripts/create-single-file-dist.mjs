import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const withoutDocs = process.argv.includes('--without-docs');
const outDirArgIndex = process.argv.indexOf('--out-dir');
const outputDirectoryName = outDirArgIndex >= 0
  ? process.argv[outDirArgIndex + 1]
  : 'dist-single';
const distDir = resolve(rootDir, 'dist');
const singleDistDir = resolve(rootDir, outputDirectoryName);
const indexPath = resolve(distDir, 'index.html');
const scriptPath = resolve(distDir, 'assets/textforge-loader.js');
const stylePath = resolve(distDir, 'assets/textforge.css');
const docsPath = resolve(distDir, 'assets/textforge-bundled-docs.js');
const singleIndexPath = resolve(singleDistDir, 'index.html');
const styleNonce = 'textforge-codemirror-style';
const scriptNonce = 'textforge-loader';
const docsNonce = 'textforge-bundled-docs';

const [indexHtml, scriptJs, styleCss, docsJs] = await Promise.all([
  readFile(indexPath, 'utf8'),
  readFile(scriptPath, 'utf8'),
  readFile(stylePath, 'utf8'),
  withoutDocs ? Promise.resolve('') : readFile(docsPath, 'utf8'),
]);

if (!styleCss.trim()) {
  throw new Error('Cannot inline an empty built stylesheet.');
}

if (!scriptJs.trim()) {
  throw new Error('Cannot inline an empty built script bundle.');
}

let singleFileHtml = indexHtml
  .replace(
    /<script\s+defer\s+src="\.\/assets\/textforge-bundled-docs\.js"><\/script>/i,
    () => withoutDocs
      ? ''
      : `<script nonce="${docsNonce}">\n${escapeScriptText(docsJs)}\n</script>`,
  )
  .replace(
    /<link\s+rel="stylesheet"\s+href="\.\/assets\/textforge\.css"\s*\/?>/i,
    () => `<style nonce="${styleNonce}">\n${escapeStyleText(styleCss)}\n</style>`,
  )
  .replace(
    /<script\s+defer\s+src="\.\/assets\/textforge-loader\.js"><\/script>/i,
    () => `<script nonce="${scriptNonce}">\n${escapeScriptText(scriptJs)}\n</script>`,
  );

if (singleFileHtml === indexHtml) {
  throw new Error('dist/index.html did not contain the expected built asset references to inline.');
}

singleFileHtml = replaceContentSecurityPolicy(singleFileHtml);

if (/\b(?:src|href)="\.\/assets\//i.test(stripInlineBlocks(singleFileHtml))) {
  throw new Error('single-file HTML still references built assets after inlining.');
}

await rm(singleDistDir, { recursive: true, force: true });
await mkdir(singleDistDir, { recursive: true });
await writeFile(singleIndexPath, singleFileHtml, 'utf8');

console.info(`Created TextForge single-file artifact at ${outputDirectoryName}/index.html.`);

function replaceContentSecurityPolicy(html) {
  return html.replace(
    /(<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]*)("[^>]*>)/i,
    (_match, prefix, content, suffix) => {
      const directives = parseCspDirectives(content);
      const scriptSrc = [
        "'self'",
        `'nonce-${scriptNonce}'`,
        "'wasm-unsafe-eval'",
      ];
      if (!withoutDocs) {
        scriptSrc.splice(2, 0, `'nonce-${docsNonce}'`);
      }
      directives.set('script-src', scriptSrc);
      directives.set('style-src', [
        "'self'",
        `'nonce-${styleNonce}'`,
      ]);
      return `${prefix}${serializeCspDirectives(directives)}${suffix}`;
    },
  );
}

function parseCspDirectives(content) {
  const directives = new Map();
  for (const rawDirective of content.split(';')) {
    const parts = rawDirective.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      continue;
    }
    directives.set(parts[0].toLowerCase(), parts.slice(1));
  }
  return directives;
}

function serializeCspDirectives(directives) {
  return [...directives]
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');
}

function escapeStyleText(source) {
  return source.replace(/<\/style/gi, '<\\/style');
}

function escapeScriptText(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

function stripInlineBlocks(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}
