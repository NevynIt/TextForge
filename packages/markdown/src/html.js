import { escapeHtml } from './support.js';

export function renderStaticDataBlock(kind, content) {
  return `
<div class="tfmd-block tfmd-block--${kind}">
  <pre><code class="language-${kind}">${escapeHtml(content)}</code></pre>
</div>
`.trim();
}

export function renderInlineSvgBlock(content) {
  return `
<figure class="tfmd-block tfmd-block--svg">
  <div class="tfmd-svg-block">${content}</div>
</figure>
`.trim();
}

export function createPrintOptimizedHtmlDocument(result, options = {}) {
  const title = options.title ?? String(result.metadata.title ?? 'TextForge Markdown');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0 auto;
        max-width: 880px;
        padding: 40px 48px 72px;
        font-family: Georgia, "Times New Roman", serif;
        line-height: 1.6;
        color: #172033;
        background: #ffffff;
      }
      img, svg {
        max-width: 100%;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        background: #f3f4f6;
        padding: 16px;
        border-radius: 12px;
      }
      figure {
        margin: 24px 0;
      }
      ${result.styleSheet}
    </style>
  </head>
  <body>
    ${result.bodyHtml}
  </body>
</html>`;
}
