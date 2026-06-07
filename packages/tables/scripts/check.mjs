import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = await import('../src/index.js');
const sourceDir = resolve(import.meta.dirname, '..', 'src');
const source = readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => readFileSync(resolve(sourceDir, entry.name), 'utf8'))
  .join('\n');

assert.equal(typeof root.parseDelimitedTable, 'function');
assert.equal(typeof root.serializeDelimitedTable, 'function');
assert.equal(typeof root.renderReadonlyTableModel, 'function');
assert.equal(Object.hasOwn(root, 'Papa'), false);
assert.equal(Object.hasOwn(root, 'PapaParse'), false);
assert.equal(Object.hasOwn(root, 'GridApi'), false);
assert.equal(source.includes("from 'papaparse'"), true);
assert.equal(
  source.includes("from '@glideapps/glide-data-grid'") || source.includes("import('@glideapps/glide-data-grid')"),
  true,
);
assert.equal(
  source.includes("from 'ag-grid-community'") || source.includes("import('ag-grid-community')"),
  true,
);
assert.equal(
  source.includes("from 'ag-grid-react'") || source.includes("import('ag-grid-react')"),
  true,
);
assert.equal(source.includes('ag-grid-enterprise'), false);

console.info('tables package checks passed');
