import {
  createCapability,
  createContributionManifest,
} from '@textforge/core';
import {
  bpmnDiCapabilityId,
  bpmnItmDocumentPredicate,
  bpmnRulesCapabilityId,
  bpmnSemanticCapabilityId,
  bpmnViewerCapabilityId,
  bpmnViewerSurfaceDocumentPredicate,
  bpmnXmlCapabilityId,
} from './ids.js';
import { bpmnViewerSurfaceContribution } from './surface.js';

export const bpmnCapabilities = Object.freeze([
  createCapability(bpmnSemanticCapabilityId, {
    localName: 'bpmn.semantic',
    aliases: ['bpmn', 'semantic-bpmn'],
    description: 'Owns the narrowed TextForge BPMN semantic MVP profile and validation helpers.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnRulesCapabilityId, {
    localName: 'bpmn.rules',
    aliases: ['bpmn.basicWellFormedness'],
    description: 'Activates BPMN semantic validation rules for ITM documents using the BPMN MVP profile.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnXmlCapabilityId, {
    localName: 'bpmn.xml',
    aliases: ['bpmn.import', 'bpmn.export'],
    description: 'Owns BPMN XML import/export helpers and diagnostics for the BPMN MVP slice.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
  createCapability(bpmnViewerCapabilityId, {
    localName: 'bpmn.viewer',
    aliases: ['bpmn.view'],
    description: 'Owns the read-only BPMN viewer surface and ITM render-target binding.',
    defaultActive: true,
    documentPredicate: bpmnViewerSurfaceDocumentPredicate,
  }),
  createCapability(bpmnDiCapabilityId, {
    localName: 'bpmn.di',
    aliases: ['bpmndi', 'bpmn.diagram-interchange'],
    description: 'Owns read-only BPMN Diagram Interchange extraction and fidelity helpers.',
    documentPredicate: bpmnItmDocumentPredicate,
  }),
]);

export function createBpmnContributionManifest(overrides = {}) {
  return createContributionManifest('@textforge/bpmn', {
    name: '@textforge/bpmn',
    version: '0.1.0',
    description: 'BPMN semantic MVP, read-only viewer, Diagram Interchange fidelity, and ITM integration for TextForge.',
    dependencies: [
      '@textforge/core',
      '@textforge/itm',
      ...(overrides.dependencies ?? []),
    ],
    capabilities: bpmnCapabilities,
    surfaces: overrides.surfaces ?? [bpmnViewerSurfaceContribution],
    pipelines: overrides.pipelines ?? [],
  });
}

export const contributions = createBpmnContributionManifest();
