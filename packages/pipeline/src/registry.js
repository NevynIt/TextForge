import { createPipelineStep } from './steps.js';

export function createPipelineRegistry(initialSteps = []) {
  const steps = new Map();

  function register(step) {
    const normalized = createPipelineStep(step.id, step);
    steps.set(normalized.id, normalized);
    return registry;
  }

  const registry = {
    register,
    get(stepId) {
      return steps.get(stepId);
    },
    list() {
      return [...steps.values()];
    },
  };

  for (const step of initialSteps) {
    register(step);
  }

  return registry;
}

export function createPipelineRegistryFromContributions(contributions = []) {
  return createPipelineRegistry(
    contributions.map((contribution) => createPipelineStep(contribution.id, contribution)),
  );
}
