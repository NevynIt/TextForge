import { createPipelineDiagnostic } from './diagnostics.js';
import { createGeneratedResourceDescriptor } from './resources.js';
import {
  createPipelineRegistry,
  createPipelineRegistryFromContributions,
} from './registry.js';
import { createPipelineStep } from './steps.js';

function inferValueKind(value, fallback) {
  if (value?.kind) {
    return value.kind;
  }
  return fallback ?? 'text';
}

function resolvePipelineReference(registry, reference) {
  const normalizedReference = String(reference ?? '').trim();
  if (!normalizedReference) {
    return {
      status: 'missing',
      reference: normalizedReference,
      matches: [],
    };
  }

  const exactMatch = registry.get(normalizedReference);
  if (exactMatch) {
    return {
      status: 'resolved',
      reference: normalizedReference,
      step: exactMatch,
    };
  }

  const localMatches = registry.list().filter((step) => step.localName === normalizedReference);
  if (localMatches.length === 1) {
    return {
      status: 'resolved',
      reference: normalizedReference,
      step: localMatches[0],
    };
  }

  if (localMatches.length > 1) {
    return {
      status: 'ambiguous',
      reference: normalizedReference,
      matches: localMatches,
    };
  }

  return {
    status: 'missing',
    reference: normalizedReference,
    matches: [],
  };
}

function createFailedTrace(stepId, current, now) {
  return {
    stepId,
    contributionId: stepId,
    inputKind: inferValueKind(current, 'text'),
    outputKind: inferValueKind(current, 'text'),
    startedAt: now(),
    finishedAt: now(),
    status: 'failed',
    diagnosticsCount: 1,
    generatedResourceCount: 0,
  };
}

export function createPipelineRunner(options = {}) {
  const registry = options.registry ?? createPipelineRegistry();
  const now = options.now ?? (() => new Date().toISOString());

  return {
    registry,
    async run(input, runOptions = {}) {
      const stopOnError = runOptions.stopOnError ?? true;
      const diagnostics = [];
      const generatedResources = [];
      const trace = [];
      const intermediateValues = [];
      let current = input;
      let failed = false;

      const steps = (runOptions.steps ?? []).flatMap((step) => {
        if (typeof step === 'string') {
          const resolved = resolvePipelineReference(registry, step);
          if (resolved.status === 'resolved') {
            return [resolved.step];
          }

          if (resolved.status === 'ambiguous') {
            diagnostics.push(createPipelineDiagnostic(
              'pipeline.step.ambiguous',
              `Pipeline step "${step}" is ambiguous in the active contribution context.`,
              'error',
              {
                origin: {
                  pipelineStepId: step,
                },
                related: resolved.matches.map((match) => ({
                  message: match.id,
                })),
              },
            ));
            failed = true;
            trace.push(createFailedTrace(step, current, now));
            return [];
          }

          if (resolved.status !== 'resolved') {
            diagnostics.push(createPipelineDiagnostic(
              'pipeline.step.missing',
              `Unknown pipeline step: ${step}`,
              'error',
              {
                origin: {
                  pipelineStepId: step,
                },
              },
            ));
            failed = true;
            trace.push(createFailedTrace(step, current, now));
            return [];
          }
        }
        return [createPipelineStep(step.id, step)];
      });

      if (failed && stopOnError) {
        return {
          ok: false,
          value: current,
          diagnostics,
          generatedResources,
          trace,
          intermediateValues,
        };
      }

      for (const step of steps) {
        const startedAt = now();
        try {
          const result = await step.run({
            input: current,
            context: runOptions.context,
            now,
            diagnostics: [...diagnostics],
            trace: [...trace],
          }) ?? {};

          const nextOutput = result.output ?? current;
          const stepDiagnostics = result.diagnostics ?? [];
          const stepGeneratedResources = (result.generatedResources ?? []).map((resource) =>
            createGeneratedResourceDescriptor(resource));
          diagnostics.push(...stepDiagnostics);
          generatedResources.push(...stepGeneratedResources);
          trace.push({
            stepId: step.id,
            contributionId: step.contributionId ?? step.id,
            inputKind: inferValueKind(current, step.inputKind),
            outputKind: inferValueKind(nextOutput, step.outputKind),
            startedAt,
            finishedAt: now(),
            status: 'done',
            diagnosticsCount: stepDiagnostics.length,
            generatedResourceCount: stepGeneratedResources.length,
          });
          intermediateValues.push({
            stepId: step.id,
            contributionId: step.contributionId ?? step.id,
            value: nextOutput,
          });
          current = nextOutput;
        } catch (error) {
          failed = true;
          diagnostics.push(createPipelineDiagnostic(
            'pipeline.step.failed',
            error?.message ?? `Pipeline step failed: ${step.id}`,
            'error',
            {
              origin: {
                contributionId: step.contributionId ?? step.id,
                pipelineStepId: step.id,
              },
            },
          ));
          trace.push({
            stepId: step.id,
            contributionId: step.contributionId ?? step.id,
            inputKind: inferValueKind(current, step.inputKind),
            outputKind: step.outputKind ?? inferValueKind(current, 'text'),
            startedAt,
            finishedAt: now(),
            status: 'failed',
            diagnosticsCount: 1,
            generatedResourceCount: 0,
          });
          if (stopOnError) {
            break;
          }
        }
      }

      return {
        ok: !failed,
        value: current,
        diagnostics,
        generatedResources,
        trace,
        intermediateValues,
      };
    },
  };
}

export function createDocumentPipelineRunner(options = {}) {
  return createPipelineRunner({
    registry: createPipelineRegistryFromContributions(options.contributionContext?.activePipelines ?? []),
    now: options.now,
  });
}
