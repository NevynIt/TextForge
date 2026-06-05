import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  contributions,
  createEaViewerModel,
  eaViewerSurfaceContribution,
  isEaDashboardFixture,
  normalizeEaDashboardFixture,
} from '../src/index.js';

const workspaceRoot = resolve(import.meta.dirname, '..', '..', '..');
const samplePath = resolve(workspaceRoot, 'docs/examples/ea/ea-dashboard-sample.json');

test('contribution manifest exposes the EA dashboard viewer surface', () => {
  assert.equal(contributions.packageId, '@textforge/ea-viewer');
  assert.equal(contributions.surfaces.some((surface) => surface.id === '@textforge/ea-viewer/dashboard'), true);
  assert.equal(contributions.capabilities.some((capability) => capability.id === '@textforge/ea-viewer/capability/dashboard'), true);
});

test('recognizes the bundled EA Dashboard Django fixture sample', () => {
  const sample = JSON.parse(readFileSync(samplePath, 'utf8'));

  assert.equal(isEaDashboardFixture(sample), true);
});

test('normalizes fixture records into viewer collections and resolved relationships', () => {
  const result = normalizeEaDashboardFixture(readFileSync(samplePath, 'utf8'), {
    resource: {
      resourceId: 'ea-sample',
      kind: 'resource',
      representation: 'text',
      path: '/docs/examples/ea/ea-dashboard-sample.json',
      languageId: 'json',
      mimeType: 'application/json',
    },
  });

  assert.equal(result.recognized, true);
  assert.equal(result.model.recordCount, 16);
  assert.equal(result.model.systems.length, 1);
  assert.equal(result.model.services[0].system.id, 30);
  assert.equal(result.model.servers[0].systems[0].id, 30);
  assert.equal(result.model.systems[0].servers.length, 1);
  assert.equal(result.model.projects[0].systems[0].id, 30);
  assert.equal(result.model.strategicGoals[0].value_streams[0].id, 130);
  assert.equal(result.model.businessProcesses[0].systems[0].id, 30);
});

test('accepts diagrams-only fixtures while reporting partial deployment coverage', () => {
  const diagramsOnly = JSON.stringify([
    {
      model: 'architecture.securitydomain',
      pk: 1,
      fields: { name: 'NATO RESTRICTED', abbreviation: 'NR', level: 2, color: '#3b82f6' },
    },
    {
      model: 'architecture.system',
      pk: 2,
      fields: { name: 'Diagram System', security_domain: 1, capabilities: [] },
    },
  ]);

  const result = normalizeEaDashboardFixture(diagramsOnly);

  assert.equal(result.recognized, true);
  assert.equal(result.model.systems.length, 1);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'ea.fixture.deployment-partial'), true);
});

test('reports malformed and unrelated JSON without producing a blank model', () => {
  const malformed = normalizeEaDashboardFixture('{ nope');
  const unrelated = normalizeEaDashboardFixture(JSON.stringify({ ok: true }));
  const unrelatedDjango = normalizeEaDashboardFixture(JSON.stringify([
    { model: 'auth.user', pk: 1, fields: { username: 'admin' } },
  ]));

  assert.equal(malformed.recognized, false);
  assert.equal(malformed.diagnostics[0].code, 'ea.fixture.parse-failed');
  assert.equal(unrelated.recognized, false);
  assert.equal(unrelated.diagnostics[0].code, 'ea.fixture.not-array');
  assert.equal(unrelatedDjango.recognized, false);
  assert.equal(unrelatedDjango.diagnostics[0].code, 'ea.fixture.unrecognized');
});

test('unsupported architecture records do not block supported fixture models', () => {
  const result = normalizeEaDashboardFixture(JSON.stringify([
    {
      model: 'architecture.securitydomain',
      pk: 1,
      fields: { name: 'NATO UNCLASSIFIED', abbreviation: 'NU', level: 1, color: '#10b981' },
    },
    {
      model: 'architecture.system',
      pk: 2,
      fields: { name: 'Supported System', security_domain: 1, capabilities: [] },
    },
    {
      model: 'architecture.unknown',
      pk: 3,
      fields: { name: 'Skipped' },
    },
  ]));

  assert.equal(result.recognized, true);
  assert.equal(result.model.systems.length, 1);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === 'ea.fixture.model-unsupported'), true);
});

test('surface open returns mountable fallback for unrelated JSON and runtime model for fixture JSON', () => {
  const fallback = eaViewerSurfaceContribution.open({
    sourceText: JSON.stringify({ ok: true }),
    resource: {
      resourceId: 'unrelated',
      kind: 'resource',
      representation: 'text',
      path: '/docs/anything.json',
      languageId: 'json',
    },
  });
  const recognized = eaViewerSurfaceContribution.open({
    sourceText: readFileSync(samplePath, 'utf8'),
    resource: {
      resourceId: 'ea-sample',
      kind: 'resource',
      representation: 'text',
      path: '/docs/examples/ea/ea-dashboard-sample.json',
      languageId: 'json',
    },
  });
  const model = createEaViewerModel(readFileSync(samplePath, 'utf8'), { title: 'EA Sample' });

  assert.equal(fallback.surface.model.diagnostics[0].code, 'ea.fixture.not-array');
  assert.equal(typeof fallback.surface.mount, 'function');
  assert.equal(recognized.detail.includes('16 records'), true);
  assert.equal(model.title, 'EA Sample');
});
