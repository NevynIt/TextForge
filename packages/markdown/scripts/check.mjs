import assert from 'node:assert/strict';

import {
  contributions,
  createMarkdownSnippet,
  renderMarkdownDocument,
} from '../src/index.js';

assert.equal(contributions.packageId, '@textforge/markdown');
assert.match(createMarkdownSnippet('graphviz'), /```graphviz/);

const result = await renderMarkdownDocument('# Check');
assert.match(result.html, /tfmd-preview/);
assert.match(result.printHtml, /<!doctype html>/i);

console.info('markdown package checks passed');
