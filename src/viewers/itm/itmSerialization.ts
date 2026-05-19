import { serializeDocument } from "@textforge/itm";
import type { ItmPipelineValue } from "../../domain/types";

export function serializeItmPipelineValue(value: ItmPipelineValue): string {
  return JSON.stringify(toSerializableItmPipelineValue(value), null, 2);
}

export function toSerializableItmPipelineValue(value: ItmPipelineValue) {
  return {
    modelType: value.modelType,
    source: value.source,
    document: value.document,
    diagnostics: value.itmDiagnostics || []
  };
}

export function serializeItmPipelineDocument(value: ItmPipelineValue): string {
  return serializeDocument(value.document);
}