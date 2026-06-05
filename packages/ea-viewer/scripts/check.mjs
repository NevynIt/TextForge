import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  eaViewerSurfaceContribution,
  normalizeEaDashboardFixture,
} from '../src/index.js';

const source = readFileSync(resolve(import.meta.dirname, '..', 'src', 'index.js'), 'utf8');

assert.equal(eaViewerSurfaceContribution.id, '@textforge/ea-viewer/dashboard');
assert.equal(typeof normalizeEaDashboardFixture, 'function');
assert.equal(
  source.includes('@xyflow/react/dist/style.css'),
  false,
  'EA viewer must keep React Flow CSS in the CSP-nonced package style block.',
);
assert.match(
  source,
  /try\s*\{[\s\S]*dagre\.layout\(graph\);[\s\S]*\}\s*catch\s*\{[\s\S]*layoutWithFallback\(nodes\)/u,
  'EA viewer must fall back when browser-bundled Dagre layout fails.',
);

console.info('ea-viewer package checks passed');
