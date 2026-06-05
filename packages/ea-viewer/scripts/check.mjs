import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  createDagreLayoutEngine,
  eaViewerSurfaceContribution,
  normalizeEaDashboardFixture,
  verifyDagreLayoutEngine,
} from '../src/index.js';

const source = readFileSync(resolve(import.meta.dirname, '..', 'src', 'index.js'), 'utf8');
const [dagreModule, graphlibModule] = await Promise.all([
  import('dagre-d3-es/src/dagre/index.js'),
  import('dagre-d3-es/src/graphlib/index.js'),
]);

assert.equal(eaViewerSurfaceContribution.id, '@textforge/ea-viewer/dashboard');
assert.equal(typeof normalizeEaDashboardFixture, 'function');
assert.equal(typeof createDagreLayoutEngine, 'function');
assert.equal(
  source.includes('@xyflow/react/dist/style.css'),
  false,
  'EA viewer must keep React Flow CSS in the CSP-nonced package style block.',
);
assert.equal(
  source.includes("import('dagre')"),
  false,
  'EA viewer must not import the browser-hostile dagre CommonJS entry.',
);
assert.equal(
  source.includes("dagre-d3-es/src/dagre/index.js"),
  true,
  'EA viewer must import the ESM Dagre layout engine.',
);
assert.equal(
  source.includes('layoutWithFallback'),
  false,
  'EA viewer must not silently replace Dagre with a fallback layout.',
);
verifyDagreLayoutEngine(createDagreLayoutEngine(dagreModule, graphlibModule));

console.info('ea-viewer package checks passed');
