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
import { createId } from "./id";

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
    const pipelineRunId = createId("run");
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
        trace.push({ ...traceDocument(document), stepId, status: availability, inputType, message: `Contribution "${stepId}" is not available.` });
        return { pipeline, status: availability, trace, value, diagnostics };
      }

      let contribution: Contribution | undefined;
      try {
        contribution = await this.registry.resolveContribution(stepId);
      } catch (error) {
        trace.push({
          ...traceDocument(document),
          stepId,
          status: "runtime-failed",
          inputType,
          message: error instanceof Error ? error.message : String(error)
        });
        return { pipeline, status: "runtime-failed", trace, value, diagnostics };
      }

      if (!contribution) {
        trace.push({ ...traceDocument(document), stepId, status: "missing-contribution", inputType });
        return { pipeline, status: "missing-contribution", trace, value, diagnostics };
      }

      if (!this.registry.valueMatches(contributionInput(contribution), inputType)) {
        trace.push({
          ...traceDocument(document),
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
          const stepDiagnostics = annotateDiagnostics(value.diagnostics || [], document, pipeline.id, pipelineRunId, stepId, contribution.id);
          value = { ...value, diagnostics: stepDiagnostics };
          diagnostics.push(...stepDiagnostics);
          trace.push({
            ...traceDocument(document),
            stepId,
            contributionKind: "transformer",
            status: "available",
            inputType,
            outputType: describeValue(value),
            diagnostics: stepDiagnostics,
            serializedValue: serializePipelineValue(value)
          });
          continue;
        }

        if (contribution.kind === "viewer") {
          const viewerResult = await (contribution as ViewerContribution).render(value, { runtime: this.runtime });
          const stepDiagnostics = annotateDiagnostics(viewerResult.diagnostics || [], document, pipeline.id, pipelineRunId, stepId, contribution.id);
          diagnostics.push(...stepDiagnostics);
          trace.push({
            ...traceDocument(document),
            stepId,
            contributionKind: "viewer",
            status: "available",
            inputType,
            outputType: viewerResult.kind,
            diagnostics: stepDiagnostics
          });
          return { pipeline, status: "available", trace, value, viewerResult: { ...viewerResult, diagnostics: stepDiagnostics }, diagnostics };
        }

        if (contribution.kind === "editor") {
          const editorResult = await (contribution as EditorContribution).create(value, { runtime: this.runtime });
          const stepDiagnostics = annotateDiagnostics(editorResult.diagnostics || [], document, pipeline.id, pipelineRunId, stepId, contribution.id);
          diagnostics.push(...stepDiagnostics);
          trace.push({
            ...traceDocument(document),
            stepId,
            contributionKind: "editor",
            status: "available",
            inputType,
            outputType: editorResult.kind,
            diagnostics: stepDiagnostics
          });
          return { pipeline, status: "available", trace, value, editorResult: { ...editorResult, diagnostics: stepDiagnostics }, diagnostics };
        }

        trace.push({
          ...traceDocument(document),
          stepId,
          contributionKind: contribution.kind,
          status: "failed",
          inputType,
          message: "Linters cannot be used as pipeline terminal steps."
        });
        return { pipeline, status: "failed", trace, value, diagnostics };
      } catch (error) {
        trace.push({
          ...traceDocument(document),
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

function traceDocument(document: TextDocument): Pick<
  PipelineTraceStep,
  "documentId" | "documentName" | "documentLanguageId" | "documentVersion" | "documentIdentity"
> {
  return {
    documentId: document.id,
    documentName: document.fileName,
    documentLanguageId: document.languageId,
    documentVersion: document.version,
    documentIdentity: document.identity
  };
}

function annotateDiagnostics(
  items: Diagnostic[],
  document: TextDocument,
  pipelineId: string,
  pipelineRunId: string,
  pipelineStepId: string,
  contributionId: string
): Diagnostic[] {
  return items.map((diagnostic, index) => ({
    ...diagnostic,
    id: diagnostic.id || `${pipelineRunId}-${pipelineStepId}-${index}`,
    documentId: diagnostic.documentId || document.id,
    documentVersion: diagnostic.documentVersion || document.version,
    languageId: diagnostic.languageId || document.languageId,
    pipelineId: diagnostic.pipelineId || pipelineId,
    pipelineRunId: diagnostic.pipelineRunId || pipelineRunId,
    pipelineStepId: diagnostic.pipelineStepId || pipelineStepId,
    contributionId: diagnostic.contributionId || contributionId,
    from: diagnostic.from ?? diagnostic.range?.from,
    to: diagnostic.to ?? diagnostic.range?.to,
    line: diagnostic.line ?? diagnostic.range?.line,
    column: diagnostic.column ?? diagnostic.range?.column,
    target: { ...(diagnostic.target || {}), documentId: document.id }
  }));
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
