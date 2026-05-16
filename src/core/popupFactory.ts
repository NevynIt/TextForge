import type { Diagnostic, PipelineTraceStep, PopupRecord, TextDocument, ViewerResult } from "../domain/types";
import { createId } from "./id";

export function createViewerPopup(
  document: TextDocument,
  result: ViewerResult,
  options: { pipelineId?: string; contributionId?: string; trace?: PipelineTraceStep[] } = {}
): PopupRecord {
  const now = new Date().toISOString();
  return {
    id: createId("popup"),
    kind: "viewer",
    title: result.title,
    documentId: document.id,
    documentName: document.fileName,
    documentLanguageId: document.languageId,
    documentIdentity: document.identity,
    sourceVersion: document.version,
    pipelineId: options.pipelineId,
    contributionId: options.contributionId,
    result,
    trace: options.trace,
    createdAt: now,
    refreshedAt: now,
    followSource: false,
    detached: false,
    zoom: 1,
    query: "",
    settings: defaultSettings(result)
  };
}

export function createDiagnosticsPopup(document: TextDocument, diagnostics: Diagnostic[]): PopupRecord {
  const now = new Date().toISOString();
  return {
    id: createId("popup"),
    kind: "diagnostics",
    title: "Diagnostics",
    documentId: document.id,
    documentName: document.fileName,
    documentLanguageId: document.languageId,
    documentIdentity: document.identity,
    sourceVersion: document.version,
    diagnostics,
    createdAt: now,
    refreshedAt: now,
    followSource: false,
    detached: false,
    zoom: 1,
    query: "",
    settings: {}
  };
}

export function createToolPopup(kind: "plugin-manager" | "pipeline-trace", title: string, trace?: PipelineTraceStep[]): PopupRecord {
  const now = new Date().toISOString();
  return {
    id: createId("popup"),
    kind,
    title,
    trace,
    createdAt: now,
    followSource: false,
    detached: false,
    zoom: 1,
    query: "",
    settings: {}
  };
}

function defaultSettings(result: ViewerResult): Record<string, string | number | boolean | string[] | null> {
  return Object.fromEntries((result.controls || []).map((control) => [control.id, control.defaultValue]));
}
