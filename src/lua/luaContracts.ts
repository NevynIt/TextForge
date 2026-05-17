import type { PipelineValue } from "../domain/types";

export function describeLuaPipelineValue(value: PipelineValue): string {
  if (value.kind === "text") {
    return value.languageId;
  }
  if (value.kind === "model") {
    return value.modelType;
  }
  return value.kind;
}

export function luaValueMatchesContract(contract: string | string[], actual: string): boolean {
  if (Array.isArray(contract)) {
    return contract.some((candidate) => luaValueMatchesContract(candidate, actual));
  }
  if (!contract || contract === "*" || contract === actual) {
    return true;
  }
  if (contract === "text") {
    return actual.startsWith("text.");
  }
  if (contract === "model") {
    return actual.startsWith("model.");
  }
  return false;
}

export function formatLuaContract(contract: string | string[]): string {
  return Array.isArray(contract) ? contract.join(" | ") : contract || "*";
}
