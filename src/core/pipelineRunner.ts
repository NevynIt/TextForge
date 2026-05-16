import type {
  Contribution,
  Diagnostic,
  EditorContribution,
  PipelineContribution,
  PipelineRunResult,
  PipelineTraceStep,
  PipelineValue,
  TextDocument,
  TransformerContribution,
  ViewerContribution
} from "../domain/types";
import { PluginRegistry } from "./pluginRegistry";
import { RuntimeLoader } from "./runtimeLoader";

export class PipelineRunner {
  constructor(
    private registry: PluginRegistry,
    private runtime: RuntimeLoader
  ) {}

  async run(pipelineId: string, document: TextDocument): Promise<PipelineRunResult> {
    const pipeline = this.registry.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline "${pipelineId}" was not found.`);
    }
    return this.runPipeline(pipeline, document);
  }

  async runPipeline(pipeline: PipelineContribution, document: TextDocument): Promise<PipelineRunResult> {
    let value: PipelineValue = {
      kind: "text",
      languageId: document.languageId,
      text: document.text,
      fileName: document.fileName
    };
    const diagnostics: Diagnostic[] = [];
    const trace: PipelineTraceStep[] = [];

    for (const stepId of pipeline.steps) {
      const inputType = describeValue(value);
      const availability = this.registry.getContributionAvailability(stepId);
      if (availability !== "available") {
        trace.push({ stepId, status: availability, inputType, message: `Contribution "${stepId}" is not available.` });
        return { pipeline, status: availability, trace, value, diagnostics };
      }

      let contribution: Contribution | undefined;
      try {
        contribution = await this.registry.resolveContribution(stepId);
      } catch (error) {
        trace.push({
          stepId,
          status: "runtime-failed",
          inputType,
          message: error instanceof Error ? error.message : String(error)
        });
        return { pipeline, status: "runtime-failed", trace, value, diagnostics };
      }

      if (!contribution) {
        trace.push({ stepId, status: "missing-contribution", inputType });
        return { pipeline, status: "missing-contribution", trace, value, diagnostics };
      }

      if (!this.registry.valueMatches(contributionInput(contribution), inputType)) {
        trace.push({
          stepId,
          contributionKind: contribution.kind,
          status: "failed",
          inputType,
          message: `Step expects ${formatInput(contributionInput(contribution))}, received ${inputType}.`
        });
        return { pipeline, status: "failed", trace, value, diagnostics };
      }

      try {
        if (contribution.kind === "transformer") {
          value = await (contribution as TransformerContribution).transform(value, { runtime: this.runtime });
          diagnostics.push(...(value.diagnostics || []));
          trace.push({
            stepId,
            contributionKind: "transformer",
            status: "available",
            inputType,
            outputType: describeValue(value),
            diagnostics: value.diagnostics || [],
            serializedValue: serializePipelineValue(value)
          });
          continue;
        }

        if (contribution.kind === "viewer") {
          const viewerResult = await (contribution as ViewerContribution).render(value, { runtime: this.runtime });
          diagnostics.push(...(viewerResult.diagnostics || []));
          trace.push({
            stepId,
            contributionKind: "viewer",
            status: "available",
            inputType,
            outputType: viewerResult.kind,
            diagnostics: viewerResult.diagnostics || []
          });
          return { pipeline, status: "available", trace, value, viewerResult, diagnostics };
        }

        if (contribution.kind === "editor") {
          const editorResult = await (contribution as EditorContribution).create(value, { runtime: this.runtime });
          trace.push({
            stepId,
            contributionKind: "editor",
            status: "available",
            inputType,
            outputType: editorResult.kind
          });
          return { pipeline, status: "available", trace, value, editorResult, diagnostics };
        }

        trace.push({
          stepId,
          contributionKind: contribution.kind,
          status: "failed",
          inputType,
          message: "Linters cannot be used as pipeline terminal steps."
        });
        return { pipeline, status: "failed", trace, value, diagnostics };
      } catch (error) {
        trace.push({
          stepId,
          contributionKind: contribution.kind,
          status: "runtime-failed",
          inputType,
          message: error instanceof Error ? error.message : String(error)
        });
        return { pipeline, status: "runtime-failed", trace, value, diagnostics };
      }
    }

    return { pipeline, status: "available", trace, value, diagnostics };
  }
}

export function describeValue(value: PipelineValue): string {
  if (value.kind === "text") {
    return value.languageId;
  }
  if (value.kind === "model") {
    return value.modelType;
  }
  return value.kind;
}

function contributionInput(contribution: Contribution): string | string[] {
  if (contribution.kind === "linter") {
    return contribution.accepts;
  }
  return contribution.input;
}

function formatInput(input: string | string[]): string {
  return Array.isArray(input) ? input.join(", ") : input;
}

function serializePipelineValue(value: PipelineValue): string {
  if (value.kind === "text") {
    return value.text;
  }
  if (value.kind === "model") {
    return JSON.stringify(value.data, null, 2);
  }
  if (value.kind === "html") {
    return value.html;
  }
  return value.svg;
}
