import { createDiagnostic } from '@textforge/core';
import {
  importBpmnXmlResult,
  loadItmDocument,
  validateBpmnRules,
  validateItmDocument,
} from '@textforge/itm';
import {
  bpmnSemanticCapabilityId,
} from './ids.js';
import {
  bpmnSemanticFixtureTexts,
  bpmnSemanticProfileText,
} from './fixtures.js';
import {
  appendUniqueDiagnostics,
  supportedEntityTypes,
  supportedRelationshipTypes,
  toResolvedDocument,
} from './shared.js';

export function collectBpmnMvpScopeDiagnostics(document) {
  const resolved = toResolvedDocument(document);
  const diagnostics = [];

  for (const entity of resolved.entities) {
    if (!entity.typeRef || !entity.typeRef.startsWith('bpmn::')) {
      continue;
    }
    if (supportedEntityTypes.has(entity.typeRef)) {
      continue;
    }
    diagnostics.push(createDiagnostic(
      `BPMN semantic MVP does not include entity type '${entity.typeRef}'.`,
      'error',
      {
        code: 'bpmn.mvp.out-of-scope-type',
        origin: {
          packageId: '@textforge/bpmn',
          capabilityId: bpmnSemanticCapabilityId,
          subsystem: 'semantic-mvp',
        },
      },
    ));
  }

  for (const relationship of resolved.relationships) {
    if (!relationship.typeRef || !relationship.typeRef.startsWith('bpmn::')) {
      continue;
    }
    if (supportedRelationshipTypes.has(relationship.typeRef)) {
      continue;
    }
    diagnostics.push(createDiagnostic(
      `BPMN semantic MVP does not include relationship type '${relationship.typeRef}'.`,
      'error',
      {
        code: 'bpmn.mvp.out-of-scope-relationship',
        origin: {
          packageId: '@textforge/bpmn',
          capabilityId: bpmnSemanticCapabilityId,
          subsystem: 'semantic-mvp',
        },
      },
    ));
  }

  return diagnostics;
}

export function validateBpmnSemanticDocument(document, options = {}) {
  const diagnostics = [];
  appendUniqueDiagnostics(diagnostics, validateItmDocument(document, options));
  appendUniqueDiagnostics(diagnostics, validateBpmnRules(document));
  appendUniqueDiagnostics(diagnostics, collectBpmnMvpScopeDiagnostics(document));
  return diagnostics;
}

export async function loadBpmnSemanticFixture(name, options = {}) {
  const fixtureText = bpmnSemanticFixtureTexts[name];
  if (!fixtureText) {
    throw new Error(`Unknown BPMN semantic fixture: ${name}`);
  }

  const uri = options.uri ?? `/packages/bpmn/${name}.itm`;
  const includeProviders = [
    {
      name: 'textforge-bpmn-semantic-mvp',
      load(target) {
        if (target === './textforge-bpmn-semantic-mvp.itm' || target === 'textforge-bpmn-semantic-mvp.itm') {
          return {
            text: bpmnSemanticProfileText,
            uri: '/packages/bpmn/textforge-bpmn-semantic-mvp.itm',
          };
        }
        return undefined;
      },
    },
    ...(options.includeProviders ?? []),
  ];
  return loadItmDocument(fixtureText, {
    strict: false,
    includeStdProfiles: false,
    uri,
    includeProviders,
    ...options,
  });
}

export async function loadBpmnSemanticProfile(options = {}) {
  return loadItmDocument(bpmnSemanticProfileText, {
    strict: false,
    includeStdProfiles: false,
    uri: options.uri ?? '/packages/bpmn/textforge-bpmn-semantic-mvp.itm',
    ...options,
  });
}

export function importBpmnSemanticXmlResult(xml, options = {}) {
  const result = importBpmnXmlResult(xml, options);
  if (result.value) {
    appendUniqueDiagnostics(result.diagnostics, collectBpmnMvpScopeDiagnostics(result.value));
  }
  return result;
}
