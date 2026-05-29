import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { contributions as coreContributions, createContributionRegistry } from '@textforge/core';
import { contributions as itmContributions, loadItmDocument } from '@textforge/itm';

import {
  applyBpmnDiagramInterchangeToXml,
  bpmnCapabilityIds,
  bundledBpmnReferenceAssets,
  collectBpmnMvpScopeDiagnostics,
  contributions,
  createBpmnViewerModelFromXml,
  extractBpmnDiagramInterchangeView,
  importBpmnSemanticXmlResult,
  loadBpmnSemanticFixture,
  validateBpmnDiagramInterchangeView,
  validateBpmnSemanticDocument,
} from '../src/index.js';

const workspaceRoot = resolve(import.meta.dirname, '..', '..', '..');

function createBpmnContributionRegistry() {
  return createContributionRegistry([
    coreContributions,
    itmContributions,
    contributions,
  ]);
}

test('bpmn contribution manifest exposes the semantic MVP capabilities', () => {
  assert.equal(contributions.packageId, '@textforge/bpmn');
  assert.deepEqual(
    contributions.capabilities.map((capability) => capability.id).sort(),
    [...bpmnCapabilityIds].sort(),
  );
});

test('semantic fixtures load cleanly through the public package APIs', async () => {
  const registry = createBpmnContributionRegistry();
  const [linear, gateway] = await Promise.all([
    loadBpmnSemanticFixture('linearProcess', { contributionRegistry: registry }),
    loadBpmnSemanticFixture('exclusiveGatewayProcess', { contributionRegistry: registry }),
  ]);

  assert.equal(validateBpmnSemanticDocument(linear.effectiveResolvedDocument, { contributionRegistry: registry }).some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(validateBpmnSemanticDocument(gateway.effectiveResolvedDocument, { contributionRegistry: registry }).some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(linear.effectiveResolvedDocument.views?.some((view) => view.name === 'linear_diagram'), true);
  assert.equal(gateway.effectiveResolvedDocument.views?.some((view) => view.name === 'approval_diagram'), true);
});

test('semantic fixtures activate the BPMN capabilities through the contribution registry', async () => {
  const registry = createBpmnContributionRegistry();
  const loaded = await loadBpmnSemanticFixture('linearProcess', {
    contributionRegistry: registry,
    documentResource: {
      path: '/docs/linear.itm',
      kind: 'resource',
      representation: 'text',
      languageId: 'itm',
      mimeType: 'text/x-itm',
    },
  });

  const activeCapabilityIds = new Set((loaded.capabilityContext?.activeCapabilities ?? []).map((capability) => capability.id));
  assert.equal(activeCapabilityIds.has('@textforge/bpmn/capability/semantic'), true);
  assert.equal(activeCapabilityIds.has('@textforge/bpmn/capability/rules'), true);
  assert.equal(activeCapabilityIds.has('@textforge/bpmn/capability/viewer'), true);
});

test('the semantic MVP validator reports broader preserved BPMN reference scope without absorbing it', async () => {
  const referencePath = resolve(workspaceRoot, bundledBpmnReferenceAssets.convertedItmPath);
  const source = readFileSync(referencePath, 'utf8');
  const referenceLoaded = await loadItmDocument(source, {
    strict: false,
    uri: '/docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm',
  });
  const diagnostics = collectBpmnMvpScopeDiagnostics(referenceLoaded.effectiveResolvedDocument);

  assert.equal(diagnostics.some((diagnostic) => diagnostic.code === 'bpmn.mvp.out-of-scope-type'), true);
});

test('minimal BPMN XML imports into the semantic MVP without scope errors', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="https://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_1" targetNamespace="https://example.org/textforge/bpmn/xml">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
    <bpmn:task id="Task_1" name="Review" />
    <bpmn:endEvent id="EndEvent_1" name="End" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`;

  const result = importBpmnSemanticXmlResult(xml);

  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(result.value.entities.some((entity) => entity.typeRef === 'bpmn::Task'), true);
});

test('bpmn viewer model parses BPMN XML and surfaces parse diagnostics', async () => {
  const validXml = readFileSync(resolve(workspaceRoot, bundledBpmnReferenceAssets.rawXmlPath), 'utf8');
  const invalidXml = '<bpmn:definitions><broken></bpmn:definitions>';

  const valid = await createBpmnViewerModelFromXml(validXml, { title: 'Valid BPMN' });
  const invalid = await createBpmnViewerModelFromXml(invalidXml, { title: 'Invalid BPMN' });

  assert.equal(valid.processes.length > 0, true);
  assert.equal(valid.diagramCount > 0, true);
  assert.equal(valid.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(invalid.diagnostics.some((diagnostic) => diagnostic.code === 'bpmn.viewer.parse-failed'), true);
  assert.equal(contributions.surfaces.some((surface) => surface.id === '@textforge/bpmn/viewer'), true);
});

test('bpmn DI extraction reads preserved bounds, routes, and label bounds from ITM views', () => {
  const itmSource = readFileSync(resolve(workspaceRoot, bundledBpmnReferenceAssets.convertedItmPath), 'utf8');
  const extracted = extractBpmnDiagramInterchangeView(itmSource, { viewName: 'bpmn_diagram' });

  assert.equal(extracted.viewName, 'bpmn_diagram');
  assert.equal(extracted.sourceDiagramId, 'BPMNDiagram_1');
  assert.equal(extracted.sourcePlaneId, 'BPMNPlane_1');
  assert.equal(extracted.bounds.length > 0, true);
  assert.equal(extracted.routes.length > 0, true);
  assert.equal(extracted.labelBounds.length > 0, true);
});

test('bpmn DI validation checks semantic element and relationship references without generic delta semantics', async () => {
  const referencePath = resolve(workspaceRoot, bundledBpmnReferenceAssets.convertedItmPath);
  const source = readFileSync(referencePath, 'utf8');
  const extracted = extractBpmnDiagramInterchangeView(source, { viewName: 'bpmn_diagram' });
  const loaded = await loadItmDocument(source, {
    strict: false,
    uri: '/docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm',
  });

  const validDiagnostics = validateBpmnDiagramInterchangeView(extracted, loaded.effectiveResolvedDocument);
  const invalidDiagnostics = validateBpmnDiagramInterchangeView({
    ...extracted,
    bounds: [
      {
        ...extracted.bounds[0],
        element: 'Missing_Element',
      },
    ],
  }, loaded.effectiveResolvedDocument);

  assert.equal(validDiagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(invalidDiagnostics.some((diagnostic) => diagnostic.code === 'bpmn.di.missing-bounds-element'), true);
});

test('bpmn DI application can project ITM view geometry back onto BPMN XML read-only', async () => {
  const rawXml = readFileSync(resolve(workspaceRoot, bundledBpmnReferenceAssets.rawXmlPath), 'utf8');
  const itmSource = readFileSync(resolve(workspaceRoot, bundledBpmnReferenceAssets.convertedItmPath), 'utf8');
  const extracted = extractBpmnDiagramInterchangeView(itmSource, { viewName: 'bpmn_diagram' });
  const updatedBounds = {
    ...extracted.bounds[0],
    x: extracted.bounds[0].x + 17,
    y: extracted.bounds[0].y + 11,
  };

  const applied = await applyBpmnDiagramInterchangeToXml(rawXml, {
    ...extracted,
    bounds: [updatedBounds, ...extracted.bounds.slice(1)],
  });
  const parsed = await createBpmnViewerModelFromXml(applied.xml, { title: 'Applied BPMN DI' });
  const planeElements = parsed.definitions?.diagrams?.[0]?.plane?.planeElement ?? [];
  const updatedShape = planeElements.find((entry) => entry?.id === updatedBounds.shapeId);

  assert.equal(applied.diagnostics.some((diagnostic) => diagnostic.severity === 'error'), false);
  assert.equal(updatedShape?.bounds?.x, updatedBounds.x);
  assert.equal(updatedShape?.bounds?.y, updatedBounds.y);
});
