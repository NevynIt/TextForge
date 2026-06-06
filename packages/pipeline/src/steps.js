import { pipelineRunCapabilityId } from './capabilities.js';

export function createPipelineStep(id, overrides = {}) {
  return {
    id,
    contributionId: overrides.contributionId ?? id,
    localName: overrides.localName,
    capabilities: overrides.capabilities ?? [pipelineRunCapabilityId],
    defaultActive: overrides.defaultActive ?? true,
    inputKind: overrides.inputKind ?? 'text',
    outputKind: overrides.outputKind ?? 'html',
    description: overrides.description,
    run: overrides.run ?? (async ({ input }) => ({ output: input })),
  };
}
