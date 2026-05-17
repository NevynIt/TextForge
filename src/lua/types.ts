import type { Diagnostic, PipelineValue, SourceRange, TextDocument } from "../domain/types";

export interface LuaLimits {
  maxInstructions: number;
  maxWallTimeMs: number;
  maxOutputBytes: number;
  maxModelNodes: number;
  maxModelEdges: number;
  maxTableCells: number;
  maxRecursionDepth: number;
}

export const defaultLuaLimits: LuaLimits = {
  maxInstructions: 1_000_000,
  maxWallTimeMs: 500,
  maxOutputBytes: 2 * 1024 * 1024,
  maxModelNodes: 20_000,
  maxModelEdges: 50_000,
  maxTableCells: 500_000,
  maxRecursionDepth: 200
};

export interface LuaActionDescriptor {
  id: string;
  name: string;
  category: string;
  input: string | string[];
  output: string;
  description?: string;
  documentId?: string;
  documentName?: string;
  actionIndex?: number;
}

export interface LuaAvailableAction extends LuaActionDescriptor {
  source: string;
  fileName: string;
  documentId?: string;
}

export interface LuaRunRequest {
  mode: "command" | "script" | "action" | "inspect";
  source: string;
  fileName?: string;
  sourceOffset?: Pick<SourceRange, "from" | "line" | "column">;
  actionId?: string;
  input?: PipelineValue;
  documents?: TextDocument[];
  actions?: LuaAvailableAction[];
  limits?: Partial<LuaLimits>;
  recursionDepth?: number;
}

export interface LuaRunResult {
  ok: boolean;
  output: string;
  value?: PipelineValue;
  actions?: LuaActionDescriptor[];
  diagnostics?: Diagnostic[];
  error?: string;
}
