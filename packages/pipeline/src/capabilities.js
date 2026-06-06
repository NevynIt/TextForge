import {
  createCapability,
  createResourcePredicate,
} from '@textforge/core';

export const pipelineRunCapabilityId = '@textforge/pipeline/capability/run';

export const pipelineCapabilities = [
  createCapability(pipelineRunCapabilityId, {
    description: 'Run local pipeline steps over bundled TextForge values.',
    localName: 'run',
    defaultActive: true,
    scope: 'document',
    documentPredicate: createResourcePredicate({
      representations: ['text'],
    }),
  }),
];
