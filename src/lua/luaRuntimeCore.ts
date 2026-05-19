import { serializeDocument, type ItmDocument, type ItmRelationship } from "@textforge/itm";
import { lauxlib, lua, lualib, to_luastring } from "fengari";
import type { Diagnostic, GraphModel, PipelineValue, TextDocument, TreeNode } from "../domain/types";
import { parseDelimited } from "../parsers/csv";
import { indentedTreeToGraph, parseIndentedTree } from "../parsers/itm";
import { extractMarkdownHeadingTree } from "../parsers/markdown";
import { describeLuaPipelineValue, formatLuaContract, luaValueMatchesContract } from "./luaContracts";
import { bundledLuaModules } from "./luaModules";
import type { LuaActionDescriptor, LuaAvailableAction, LuaLimits, LuaRunRequest, LuaRunResult } from "./types";
import { defaultLuaLimits } from "./types";

const hookInstructionStep = 1000;
const textParentLanguage = "text";
const blockedGlobals = [
  "dofile",
  "loadfile",
  "load",
  "collectgarbage",
  "os",
  "io",
  "debug",
  "js",
  "window",
  "document",
  "localStorage",
  "indexedDB",
  "XML" + "HttpRequest",
  "Web" + "Socket",
  "Event" + "Source",
  "Function",
  "eval",
  "import" + "Scripts"
];

interface LuaExecutionContext {
  limits: LuaLimits;
  output: string[];
  outputBytes: number;
  startTime: number;
  instructions: number;
  request: LuaRunRequest;
  userModules: Record<string, string>;
  moduleCache: Map<string, (state: unknown) => void>;
}

export function executeLuaInProcess(request: LuaRunRequest): LuaRunResult {
  const limits = { ...defaultLuaLimits, ...(request.limits || {}) };
  const context: LuaExecutionContext = {
    limits,
    output: [],
    outputBytes: 0,
    startTime: Date.now(),
    instructions: 0,
    request,
    userModules: buildUserModuleRegistry(request),
    moduleCache: new Map()
  };
  const L = lauxlib.luaL_newstate();
  try {
    openSafeLibraries(L);
    removeBlockedGlobals(L);
    installInstructionHook(L, context);
    installPrint(L, context);
    installRequire(L, context);
    installHostFunctions(L, context);
    installInput(L, context);
    installGlobalTf(L);
    installConsoleGlobals(L);

    if (request.mode === "inspect") {
      return inspectLuaActions(L, context);
    }

    const value = request.mode === "action" ? runLuaAction(L, context) : runLuaChunk(L, context, request.source, request.fileName || "console");
    return {
      ok: true,
      output: context.output.join("\n"),
      value: value === undefined ? undefined : normalizePipelineValue(value, context)
    };
  } catch (error) {
    const message = luaErrorMessage(error);
    return {
      ok: false,
      output: context.output.join("\n"),
      error: message,
      diagnostics: [luaRuntimeDiagnostic(message, request)]
    };
  }
}

function openSafeLibraries(L: unknown): void {
  openLibrary(L, "_G", lualib.luaopen_base);
  openLibrary(L, "table", lualib.luaopen_table);
  openLibrary(L, "string", lualib.luaopen_string);
  openLibrary(L, "math", lualib.luaopen_math);
  openLibrary(L, "utf8", lualib.luaopen_utf8);
  openLibrary(L, "coroutine", lualib.luaopen_coroutine);
}

function openLibrary(L: unknown, name: string, opener: unknown): void {
  lauxlib.luaL_requiref(L, to_luastring(name), opener, 1);
  lua.lua_pop(L, 1);
}

function removeBlockedGlobals(L: unknown): void {
  for (const name of blockedGlobals) {
    lua.lua_pushnil(L);
    lua.lua_setglobal(L, to_luastring(name));
  }
}

function installInstructionHook(L: unknown, context: LuaExecutionContext): void {
  lua.lua_sethook(
    L,
    (state: unknown) => {
      context.instructions += hookInstructionStep;
      if (context.instructions > context.limits.maxInstructions || Date.now() - context.startTime > context.limits.maxWallTimeMs) {
        return lauxlib.luaL_error(state, to_luastring("Lua execution exceeded instruction/time limit."));
      }
      return 0;
    },
    lua.LUA_MASKCOUNT,
    hookInstructionStep
  );
}

function installPrint(L: unknown, context: LuaExecutionContext): void {
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const top = lua.lua_gettop(state);
    const parts: string[] = [];
    for (let index = 1; index <= top; index += 1) {
      parts.push(luaValueToDisplayString(state, index));
    }
    appendOutput(context, parts.join("\t"));
    return 0;
  });
  lua.lua_setglobal(L, to_luastring("print"));
}

function appendOutput(context: LuaExecutionContext, text: string): void {
  const nextBytes = context.outputBytes + text.length;
  if (nextBytes > context.limits.maxOutputBytes) {
    throw new Error("Lua output exceeded configured byte limit.");
  }
  context.outputBytes = nextBytes;
  context.output.push(text);
}

function installRequire(L: unknown, context: LuaExecutionContext): void {
  lua.lua_newtable(L);
  lua.lua_newtable(L);
  lua.lua_setfield(L, -2, to_luastring("loaded"));
  lua.lua_newtable(L);
  for (const name of Object.keys({ ...bundledLuaModules, ...context.userModules })) {
    lua.lua_pushboolean(L, true);
    lua.lua_setfield(L, -2, to_luastring(name));
  }
  lua.lua_setfield(L, -2, to_luastring("preload"));
  lua.lua_newtable(L);
  lua.lua_setfield(L, -2, to_luastring("searchers"));
  lua.lua_pushliteral(L, "textforge://?.lua");
  lua.lua_setfield(L, -2, to_luastring("path"));
  lua.lua_pushliteral(L, "/\n;\n?\n!\n-");
  lua.lua_setfield(L, -2, to_luastring("config"));
  lua.lua_setglobal(L, to_luastring("package"));

  lua.lua_pushjsfunction(L, (state: unknown) => requireModule(state, context));
  lua.lua_setglobal(L, to_luastring("require"));
}

function requireModule(L: unknown, context: LuaExecutionContext): number {
  const name = lua.lua_tojsstring(L, 1);
  const cached = context.moduleCache.get(name);
  if (cached) {
    cached(L);
    return 1;
  }
  const source = bundledLuaModules[name] || context.userModules[name];
  if (!source) {
    return lauxlib.luaL_error(
      L,
      to_luastring(`module '${name}' not found:\n  no TextForge bundled module '${name}'\n  no user Lua module '${name}'`)
    );
  }
  const bytes = to_luastring(source);
  const status = lauxlib.luaL_loadbuffer(L, bytes, bytes.length, to_luastring(`@${name}`));
  if (status !== lua.LUA_OK) {
    return lauxlib.luaL_error(L, to_luastring(lua.lua_tojsstring(L, -1)));
  }
  const callStatus = lua.lua_pcall(L, 0, 1, 0);
  if (callStatus !== lua.LUA_OK) {
    return lauxlib.luaL_error(L, to_luastring(lua.lua_tojsstring(L, -1)));
  }
  if (lua.lua_isnil(L, -1)) {
    lua.lua_pop(L, 1);
    lua.lua_pushboolean(L, true);
  }
  const proxy = lua.lua_toproxy(L, -1);
  context.moduleCache.set(name, proxy);
  lua.lua_getglobal(L, to_luastring("package"));
  lua.lua_getfield(L, -1, to_luastring("loaded"));
  proxy(L);
  lua.lua_setfield(L, -2, to_luastring(name));
  lua.lua_pop(L, 2);
  proxy(L);
  return 1;
}

function installHostFunctions(L: unknown, context: LuaExecutionContext): void {
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const id = lua.lua_tojsstring(state, 1);
    const input = lua.lua_gettop(state) >= 2 && !lua.lua_isnil(state, 2) ? normalizePipelineValue(luaToJsValue(state, 2), context) : currentInput(context);
    try {
      pushJsValue(state, runBuiltInPipelineStep(id, input, context));
      return 1;
    } catch (error) {
      return lauxlib.luaL_error(state, to_luastring(luaErrorMessage(error)));
    }
  });
  lua.lua_setglobal(L, to_luastring("__tf_pipeline_run"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const id = lua.lua_tojsstring(state, 1);
    const input = lua.lua_gettop(state) >= 2 && !lua.lua_isnil(state, 2) ? normalizePipelineValue(luaToJsValue(state, 2), context) : currentInput(context);
    try {
      pushJsValue(state, runNestedLuaAction(id, input, context));
      return 1;
    } catch (error) {
      return lauxlib.luaL_error(state, to_luastring(luaErrorMessage(error)));
    }
  });
  lua.lua_setglobal(L, to_luastring("__tf_actions_run"));
}

function installInput(L: unknown, context: LuaExecutionContext): void {
  pushInputTable(L, context);
  lua.lua_setglobal(L, to_luastring("input"));
}

function pushInputTable(L: unknown, context: LuaExecutionContext): void {
  pushJsValue(L, currentInput(context));
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const input = currentInput(context);
    if (input.kind !== "text") {
      return lauxlib.luaL_error(state, to_luastring("input:parse_itm() requires text input."));
    }
    const parsed = parseIndentedTree(input.text, input.languageId, {
      currentDocumentId: input.documentId,
      currentFileName: input.fileName,
      includeDocuments: context.request.documents || []
    });
    pushJsValue(state, parsed.nodes);
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("parse_itm"));
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const input = currentInput(context);
    if (input.kind !== "text") {
      return lauxlib.luaL_error(state, to_luastring("input:parse_itm() requires text input."));
    }
    const parsed = parseIndentedTree(input.text, input.languageId, {
      currentDocumentId: input.documentId,
      currentFileName: input.fileName,
      includeDocuments: context.request.documents || []
    });
    pushJsValue(state, parsed.nodes);
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("parse_itt"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const input = currentInput(context);
    if (input.kind !== "text") {
      return lauxlib.luaL_error(state, to_luastring("input:parse_markdown() requires text input."));
    }
    pushJsValue(state, extractMarkdownHeadingTree(input.text));
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("parse_markdown"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const input = currentInput(context);
    if (input.kind !== "text") {
      return lauxlib.luaL_error(state, to_luastring("input:parse_csv() requires text input."));
    }
    const delimiter = lua.lua_gettop(state) >= 2 && !lua.lua_isnil(state, 2) ? lua.lua_tojsstring(state, 2) : inferDelimiter(input.text);
    pushJsValue(state, parseDelimited(input.text, delimiter || ",", input.languageId));
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("parse_csv"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const nodes = luaToJsValue(state, 2) as TreeNode[];
    pushJsValue(state, { kind: "text", languageId: "text.itm", text: emitIndentedTree(nodes) });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("emit_itm"));
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const nodes = luaToJsValue(state, 2) as TreeNode[];
    pushJsValue(state, { kind: "text", languageId: "text.itm", text: emitIndentedTree(nodes) });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("emit_itt"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const languageId = lua.lua_tojsstring(state, 2) || "text.plain";
    const text = lua.lua_tojsstring(state, 3) || "";
    pushJsValue(state, { kind: "text", languageId, text });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("emit_text"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const value = luaToJsValue(state, 2);
    pushJsValue(state, { kind: "text", languageId: "text.json", text: JSON.stringify(value, null, 2) });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("emit_json"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const table = luaToJsValue(state, 2);
    const delimiter = lua.lua_gettop(state) >= 3 && !lua.lua_isnil(state, 3) ? lua.lua_tojsstring(state, 3) : undefined;
    pushJsValue(state, { kind: "text", languageId: "text.csv", text: emitDelimited(table, delimiter) });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring("emit_csv"));
}

function installGlobalTf(L: unknown): void {
  lua.lua_getglobal(L, to_luastring("require"));
  lua.lua_pushliteral(L, "tf");
  const status = lua.lua_pcall(L, 1, 1, 0);
  if (status !== lua.LUA_OK) {
    throw new Error(lua.lua_tojsstring(L, -1));
  }
  lua.lua_setglobal(L, to_luastring("tf"));
}

function installConsoleGlobals(L: unknown): void {
  lua.lua_pushjsfunction(L, (state: unknown) => {
    const id = lua.lua_tojsstring(state, 1);
    const hasInput = lua.lua_gettop(state) >= 2 && !lua.lua_isnil(state, 2);
    lua.lua_getglobal(state, to_luastring("__tf_pipeline_run"));
    lua.lua_pushstring(state, to_luastring(id));
    if (hasInput) {
      lua.lua_pushvalue(state, 2);
      callLuaFunction(state, 2, 1);
    } else {
      callLuaFunction(state, 1, 1);
    }
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("run"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const id = lua.lua_tojsstring(state, 1);
    const hasInput = lua.lua_gettop(state) >= 2 && !lua.lua_isnil(state, 2);
    lua.lua_getglobal(state, to_luastring("__tf_actions_run"));
    lua.lua_pushstring(state, to_luastring(id));
    if (hasInput) {
      lua.lua_pushvalue(state, 2);
      callLuaFunction(state, 2, 1);
    } else {
      callLuaFunction(state, 1, 1);
    }
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("run_action"));

  lua.lua_getglobal(L, to_luastring("run_action"));
  lua.lua_setglobal(L, to_luastring("action"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    lua.lua_pushvalue(state, 1);
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("open"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    lua.lua_getglobal(state, to_luastring("input"));
    lua.lua_getfield(state, -1, to_luastring("parse_itm"));
    lua.lua_pushvalue(state, -2);
    callLuaFunction(state, 1, 1);
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("parse_itm"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    lua.lua_getglobal(state, to_luastring("input"));
    lua.lua_getfield(state, -1, to_luastring("parse_itt"));
    lua.lua_pushvalue(state, -2);
    callLuaFunction(state, 1, 1);
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("parse_itt"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    lua.lua_getglobal(state, to_luastring("input"));
    lua.lua_getfield(state, -1, to_luastring("parse_markdown"));
    lua.lua_pushvalue(state, -2);
    callLuaFunction(state, 1, 1);
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("parse_markdown"));

  lua.lua_pushjsfunction(L, (state: unknown) => {
    const hasDelimiter = lua.lua_gettop(state) >= 1 && !lua.lua_isnil(state, 1);
    lua.lua_getglobal(state, to_luastring("input"));
    lua.lua_getfield(state, -1, to_luastring("parse_csv"));
    lua.lua_pushvalue(state, -2);
    if (hasDelimiter) {
      lua.lua_pushvalue(state, 1);
      callLuaFunction(state, 2, 1);
    } else {
      callLuaFunction(state, 1, 1);
    }
    return 1;
  });
  lua.lua_setglobal(L, to_luastring("parse_csv"));
}

function inspectLuaActions(L: unknown, context: LuaExecutionContext): LuaRunResult {
  const fileName = context.request.fileName || "lua-script.lua";
  const value = runLuaChunk(L, context, context.request.source, fileName);
  return {
    ok: true,
    output: context.output.join("\n"),
    actions: extractActionDescriptors(value, fileName, context.request.input)
  };
}

function runLuaAction(L: unknown, context: LuaExecutionContext): unknown {
  const source = context.request.source;
  const fileName = context.request.fileName || "lua-action.lua";
  const actionId = context.request.actionId || "";
  loadChunk(L, source, fileName);
  const status = lua.lua_pcall(L, 0, 1, 0);
  if (status !== lua.LUA_OK) {
    throw new Error(lua.lua_tojsstring(L, -1));
  }
  const resultIndex = lua.lua_absindex(L, -1);
  if (lua.lua_isfunction(L, resultIndex)) {
    lua.lua_pushvalue(L, resultIndex);
    pushInputTable(L, context);
    callLuaFunction(L, 1, 1);
    return luaToJsValue(L, -1);
  }
  if (lua.lua_istable(L, resultIndex)) {
    if (callActionTable(L, resultIndex, actionId, context)) {
      return luaToJsValue(L, -1);
    }
  }
  throw new Error(`Lua action "${actionId || fileName}" does not define a runnable function.`);
}

function callActionTable(L: unknown, tableIndex: number, actionId: string, context: LuaExecutionContext): boolean {
  const actionTable = lua.lua_absindex(L, tableIndex);
  lua.lua_getfield(L, actionTable, to_luastring("actions"));
  if (lua.lua_istable(L, -1)) {
    const actionsIndex = lua.lua_absindex(L, -1);
    const length = lua.lua_rawlen(L, actionsIndex);
    for (let index = 1; index <= length; index += 1) {
      lua.lua_rawgeti(L, actionsIndex, index);
      if (lua.lua_istable(L, -1)) {
        const candidateIndex = lua.lua_absindex(L, -1);
        const id = getLuaFieldString(L, candidateIndex, "id");
        const name = getLuaFieldString(L, candidateIndex, "name");
        if (!actionId || actionId === id || actionId === name) {
          lua.lua_getfield(L, candidateIndex, to_luastring("run"));
          if (lua.lua_isfunction(L, -1)) {
            pushInputTable(L, context);
            callLuaFunction(L, 1, 1);
            lua.lua_remove(L, actionsIndex);
            return true;
          }
          lua.lua_pop(L, 1);
        }
      }
      lua.lua_pop(L, 1);
    }
    lua.lua_pop(L, 1);
    return false;
  }
  lua.lua_pop(L, 1);
  lua.lua_getfield(L, actionTable, to_luastring("run"));
  if (!lua.lua_isfunction(L, -1)) {
    lua.lua_pop(L, 1);
    return false;
  }
  pushInputTable(L, context);
  callLuaFunction(L, 1, 1);
  return true;
}

function runLuaChunk(L: unknown, context: LuaExecutionContext, source: string, fileName: string): unknown {
  loadCommandOrChunk(L, source, fileName, context.request.mode === "command");
  const status = lua.lua_pcall(L, 0, 1, 0);
  if (status !== lua.LUA_OK) {
    throw new Error(lua.lua_tojsstring(L, -1));
  }
  return luaToJsValue(L, -1);
}

function loadCommandOrChunk(L: unknown, source: string, fileName: string, expressionFallback: boolean): void {
  if (expressionFallback) {
    const expressionSource = `return ${source}`;
    const expressionBytes = to_luastring(expressionSource);
    const expressionStatus = lauxlib.luaL_loadbuffer(L, expressionBytes, expressionBytes.length, to_luastring(`@${fileName}`));
    if (expressionStatus === lua.LUA_OK) {
      return;
    }
    lua.lua_pop(L, 1);
  }
  const first = lauxlib.luaL_loadbuffer(L, to_luastring(source), to_luastring(source).length, to_luastring(`@${fileName}`));
  if (first === lua.LUA_OK) {
    return;
  }
  const firstError = lua.lua_tojsstring(L, -1);
  lua.lua_pop(L, 1);
  if (!expressionFallback) {
    throw new Error(firstError);
  }
  throw new Error(firstError);
}

function loadChunk(L: unknown, source: string, fileName: string): void {
  const bytes = to_luastring(source);
  const status = lauxlib.luaL_loadbuffer(L, bytes, bytes.length, to_luastring(`@${fileName}`));
  if (status !== lua.LUA_OK) {
    throw new Error(lua.lua_tojsstring(L, -1));
  }
}

function callLuaFunction(L: unknown, args: number, results: number): void {
  const status = lua.lua_pcall(L, args, results, 0);
  if (status !== lua.LUA_OK) {
    throw new Error(lua.lua_tojsstring(L, -1));
  }
}

function currentInput(context: LuaExecutionContext): PipelineValue {
  return context.request.input || { kind: "text", languageId: "text.plain", text: "" };
}

function runBuiltInPipelineStep(id: string, input: PipelineValue, context: LuaExecutionContext): PipelineValue {
  if (id === "itm-to-tree" || id === "itt-to-tree") {
    if (input.kind !== "text") {
      throw new Error("itm-to-tree requires text input.");
    }
    const parsed = parseIndentedTree(input.text, input.languageId, {
      currentDocumentId: input.documentId,
      currentFileName: input.fileName,
      includeDocuments: context.request.documents || []
    });
    return { kind: "model", modelType: "model.tree", data: parsed.nodes, diagnostics: parsed.diagnostics };
  }
  if (id === "itm-to-graph" || id === "itt-to-graph") {
    const tree = runBuiltInPipelineStep("itm-to-tree", input, context);
    if (tree.kind !== "model" || tree.modelType !== "model.tree") {
      throw new Error("itm-to-graph could not produce a tree model.");
    }
    return { kind: "model", modelType: "model.graph", data: indentedTreeToGraph(tree.data), diagnostics: tree.diagnostics };
  }
  if (id === "markdown-heading-tree") {
    if (input.kind !== "text") {
      throw new Error("markdown-heading-tree requires text input.");
    }
    return { kind: "model", modelType: "model.tree", data: extractMarkdownHeadingTree(input.text), diagnostics: input.diagnostics };
  }
  if (id === "delimited-to-table") {
    if (input.kind !== "text") {
      throw new Error("delimited-to-table requires text input.");
    }
    const table = parseDelimited(input.text, inferDelimiter(input.text), input.languageId);
    return {
      kind: "model",
      modelType: "model.table",
      data: table,
      diagnostics: [...(input.diagnostics || []), ...(table.diagnostics || [])]
    };
  }
  throw new Error(`Lua pipeline bridge cannot run unknown built-in step "${id}".`);
}

function runNestedLuaAction(id: string, input: PipelineValue, context: LuaExecutionContext): PipelineValue {
  const depth = context.request.recursionDepth || 0;
  if (depth >= context.limits.maxRecursionDepth) {
    throw new Error("Lua action recursion limit exceeded.");
  }
  const action = (context.request.actions || []).find((candidate) => candidate.id === id || candidate.name === id);
  if (!action) {
    throw new Error(`Lua action "${id}" was not found.`);
  }
  const inputType = describeLuaPipelineValue(input);
  if (!luaValueMatchesContract(action.input, inputType)) {
    throw new Error(`Lua action "${id}" expects ${formatLuaContract(action.input)}, received ${inputType}.`);
  }
  const nested = executeLuaInProcess({
    ...context.request,
    mode: "action",
    source: action.source,
    fileName: action.fileName,
    actionId: action.id,
    input,
    recursionDepth: depth + 1
  });
  if (!nested.ok || !nested.value) {
    throw new Error(nested.error || `Lua action "${id}" did not return a value.`);
  }
  const outputType = describeLuaPipelineValue(nested.value);
  if (!luaValueMatchesContract(action.output, outputType)) {
    throw new Error(`Lua action "${id}" declares ${action.output}, returned ${outputType}.`);
  }
  return nested.value;
}

function extractActionDescriptors(value: unknown, fileName: string, input?: PipelineValue): LuaActionDescriptor[] {
  if (typeof value === "function") {
    return [fallbackAction(fileName, input)];
  }
  if (!value || typeof value !== "object") {
    return [fallbackAction(fileName, input)];
  }
  const candidate = value as Record<string, unknown>;
  if (Array.isArray(candidate.actions)) {
    return candidate.actions.map((action, index) => descriptorFromObject(action, fileName, input, index)).filter(Boolean) as LuaActionDescriptor[];
  }
  if (candidate.actions && typeof candidate.actions === "object") {
    return Object.values(candidate.actions as Record<string, unknown>)
      .map((action, index) => descriptorFromObject(action, fileName, input, index))
      .filter(Boolean) as LuaActionDescriptor[];
  }
  return [descriptorFromObject(candidate, fileName, input, 0) || fallbackAction(fileName, input)];
}

function descriptorFromObject(value: unknown, fileName: string, input: PipelineValue | undefined, index: number): LuaActionDescriptor | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const fallback = fallbackAction(fileName, input);
  const id = String(candidate.id || `${fallback.id}-${index + 1}`);
  return {
    id: sanitizeId(id),
    name: String(candidate.name || id || fallback.name),
    category: String(candidate.category || "Lua Transform"),
    input: Array.isArray(candidate.input)
      ? candidate.input.map(String)
      : String(candidate.input || (input?.kind === "text" ? input.languageId : textParentLanguage)),
    output: String(candidate.output || "text.plain"),
    description: candidate.description ? String(candidate.description) : "",
    actionIndex: index
  };
}

function fallbackAction(fileName: string, input?: PipelineValue): LuaActionDescriptor {
  const base = fileName.replace(/\.[^.]+$/, "").split(/[\\/]/).pop() || "Lua transform";
  return {
    id: sanitizeId(base),
    name: base,
    category: "Lua Transform",
    input: input?.kind === "text" ? input.languageId : "*",
    output: "text.plain",
    description: ""
  };
}

function normalizePipelineValue(value: unknown, context: LuaExecutionContext): PipelineValue {
  if (typeof value === "string") {
    return { kind: "text", languageId: "text.plain", text: value };
  }
  if (!value || typeof value !== "object") {
    return { kind: "text", languageId: "text.plain", text: value == null ? "" : String(value) };
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.kind === "text") {
    return {
      kind: "text",
      languageId: String(candidate.languageId || candidate.language_id || "text.plain"),
      text: String(candidate.text || ""),
      fileName: candidate.fileName ? String(candidate.fileName) : undefined,
      documentId: candidate.documentId ? String(candidate.documentId) : undefined
    };
  }
  if (candidate.kind === "model") {
    const modelType = String(candidate.modelType || candidate.model_type);
    if (modelType === "model.tree") {
      const data = Array.isArray(candidate.data) ? (candidate.data as TreeNode[]) : [];
      validateModelSize({ kind: "model", modelType: "model.tree", data }, context);
      return { kind: "model", modelType: "model.tree", data };
    }
    if (modelType === "model.table") {
      const data = candidate.data as PipelineValue & { columns?: unknown[]; rows?: unknown[]; delimiter?: string };
      const table = {
        columns: Array.isArray(data?.columns) ? data.columns.map(String) : [],
        rows: Array.isArray(data?.rows) ? data.rows.map((row) => (Array.isArray(row) ? row.map(String) : [String(row)])) : [],
        delimiter: typeof data?.delimiter === "string" ? data.delimiter : ","
      };
      validateModelSize({ kind: "model", modelType: "model.table", data: table }, context);
      return { kind: "model", modelType: "model.table", data: table };
    }
    if (modelType === "model.graph") {
      const graph = candidate.data as GraphModel;
      if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
        throw new Error("Lua returned invalid graph model data.");
      }
      validateModelSize({ kind: "model", modelType: "model.graph", data: graph }, context);
      return { kind: "model", modelType: "model.graph", data: graph };
    }
  }
  if (candidate.kind === "html") {
    return { kind: "html", html: String(candidate.html || "") };
  }
  if (candidate.kind === "svg") {
    return { kind: "svg", svg: String(candidate.svg || "") };
  }
  return { kind: "text", languageId: "text.json", text: JSON.stringify(value, null, 2) };
}

function validateModelSize(value: PipelineValue, context: LuaExecutionContext): void {
  if (value.kind !== "model") {
    return;
  }
  if (value.modelType === "model.tree" && countTreeNodes(value.data) > context.limits.maxModelNodes) {
    throw new Error("Lua returned a tree model beyond the node limit.");
  }
  if (value.modelType === "model.graph") {
    if (value.data.nodes.length > context.limits.maxModelNodes || value.data.edges.length > context.limits.maxModelEdges) {
      throw new Error("Lua returned a graph model beyond the size limit.");
    }
  }
  if (value.modelType === "model.table") {
    const cells = value.data.rows.reduce((sum, row) => sum + row.length, value.data.columns.length);
    if (cells > context.limits.maxTableCells) {
      throw new Error("Lua returned a table model beyond the cell limit.");
    }
  }
}

function countTreeNodes(nodes: TreeNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countTreeNodes(node.children || []), 0);
}

function pushJsValue(L: unknown, value: unknown, seen = new Set<unknown>()): void {
  if (value === null || value === undefined) {
    lua.lua_pushnil(L);
    return;
  }
  if (typeof value === "string") {
    lua.lua_pushstring(L, to_luastring(value));
    return;
  }
  if (typeof value === "number") {
    lua.lua_pushnumber(L, Number.isFinite(value) ? value : 0);
    return;
  }
  if (typeof value === "boolean") {
    lua.lua_pushboolean(L, value);
    return;
  }
  if (typeof value === "function") {
    lua.lua_pushnil(L);
    return;
  }
  if (seen.has(value)) {
    lua.lua_pushnil(L);
    return;
  }
  seen.add(value);
  lua.lua_newtable(L);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      pushJsValue(L, item, seen);
      lua.lua_rawseti(L, -2, index + 1);
    });
  } else {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (typeof item === "function" || item === undefined) {
        return;
      }
      pushJsValue(L, item, seen);
      lua.lua_setfield(L, -2, to_luastring(key));
    });
  }
  seen.delete(value);
}

function luaToJsValue(L: unknown, index: number, depth = 0): unknown {
  if (depth > 60) {
    return null;
  }
  const type = lua.lua_type(L, index);
  if (type === lua.LUA_TNIL || type === lua.LUA_TNONE) {
    return null;
  }
  if (type === lua.LUA_TBOOLEAN) {
    return Boolean(lua.lua_toboolean(L, index));
  }
  if (type === lua.LUA_TNUMBER) {
    return lua.lua_tonumber(L, index);
  }
  if (type === lua.LUA_TSTRING) {
    return lua.lua_tojsstring(L, index);
  }
  if (type === lua.LUA_TFUNCTION) {
    return undefined;
  }
  if (type !== lua.LUA_TTABLE) {
    return luaValueToDisplayString(L, index);
  }
  const absolute = lua.lua_absindex(L, index);
  const numeric: Record<number, unknown> = {};
  const object: Record<string, unknown> = {};
  let maxIndex = 0;
  let numericCount = 0;
  let hasStringKeys = false;
  lua.lua_pushnil(L);
  while (lua.lua_next(L, absolute) !== 0) {
    const key = luaToJsValue(L, -2, depth + 1);
    const value = luaToJsValue(L, -1, depth + 1);
    if (typeof key === "number" && Number.isInteger(key) && key > 0) {
      numeric[key] = value;
      numericCount += 1;
      maxIndex = Math.max(maxIndex, key);
    } else if (key !== undefined && key !== null) {
      hasStringKeys = true;
      object[String(key)] = value;
    }
    lua.lua_pop(L, 1);
  }
  if (!hasStringKeys && numericCount === maxIndex) {
    return Array.from({ length: maxIndex }, (_item, idx) => numeric[idx + 1]);
  }
  Object.entries(numeric).forEach(([key, value]) => {
    object[key] = value;
  });
  return object;
}

function luaValueToDisplayString(L: unknown, index: number): string {
  const type = lua.lua_type(L, index);
  if (type === lua.LUA_TSTRING) {
    return lua.lua_tojsstring(L, index);
  }
  if (type === lua.LUA_TNUMBER) {
    return String(lua.lua_tonumber(L, index));
  }
  if (type === lua.LUA_TBOOLEAN) {
    return lua.lua_toboolean(L, index) ? "true" : "false";
  }
  if (type === lua.LUA_TNIL || type === lua.LUA_TNONE) {
    return "nil";
  }
  return lua.lua_typename(L, type);
}

function getLuaFieldString(L: unknown, index: number, field: string): string {
  lua.lua_getfield(L, index, to_luastring(field));
  const value = lua.lua_isnil(L, -1) ? "" : lua.lua_tojsstring(L, -1);
  lua.lua_pop(L, 1);
  return value || "";
}

function emitIndentedTree(nodes: TreeNode[]): string {
  return serializeDocument(treeNodesToItmDocument(nodes));
}

function treeNodesToItmDocument(nodes: TreeNode[]): ItmDocument {
  const entities: ItmDocument["entities"] = [];
  const relationships: ItmRelationship[] = [];
  let entityCounter = 0;
  let relationshipCounter = 0;

  const visit = (node: TreeNode, parentUid: string | undefined, depth: number, rank: number): string => {
    entityCounter += 1;
    const localId = node.declaredId || (isSafeLocalId(node.id) ? node.id : undefined);
    const qualifiedId = localId ? `local::${localId}` : undefined;
    const uid = qualifiedId ? `entity:${qualifiedId}` : `entity:auto:${entityCounter}`;
    entities.push({
      uid,
      kind: "entity",
      ...(localId ? { id: localId, localId, qualifiedId, namespacePrefix: "local" } : {}),
      label: node.label || "(empty)",
      ...(node.type ? { typeRef: node.type } : {}),
      ...(node.tags?.length ? { tags: node.tags } : {}),
      ...(node.attributes && Object.keys(node.attributes).length ? { attributes: { values: node.attributes } } : {}),
      ...(node.details ? { description: { format: "markdown", text: node.details } } : {}),
      ...(parentUid ? { parentId: parentUid } : {}),
      depth,
      rank
    });
    for (const link of node.links || []) {
      relationshipCounter += 1;
      const targetRef = link.target.includes("::") ? link.target : `local::${link.target}`;
      relationships.push({
        uid: `relationship:${relationshipCounter}`,
        kind: "relationship",
        sourceId: uid,
        ...(qualifiedId ? { sourceRef: qualifiedId } : {}),
        targetRef,
        typeRef: link.type === "related-to" ? "related_to" : (link.type || "related_to"),
        relationshipKind: "explicit",
        implicit: false,
        virtual: false,
        sourceSyntax: "inline-relationship",
        ...(link.style && Object.keys(link.style).length ? { attributes: { values: link.style } } : {})
      });
    }
    (node.children || []).forEach((child, index) => visit(child, uid, depth + 1, index));
    return uid;
  };

  nodes.forEach((node, index) => visit(node, undefined, 0, index));

  return {
    format: "itm",
    modelVersion: "1.0.0",
    metadata: { defaultNamespace: "local" },
    entities,
    relationships
  };
}

function isSafeLocalId(value: string | undefined): boolean {
  return Boolean(value && /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value));
}

function emitDelimited(value: unknown, delimiter?: string): string {
  const table = tableDataFromLuaValue(value);
  const separator = delimiter || table.delimiter || ",";
  const lines = [table.columns, ...table.rows].map((row) => row.map((field) => escapeDelimitedField(String(field ?? ""), separator)).join(separator));
  return `${lines.join("\n")}\n`;
}

function tableDataFromLuaValue(value: unknown): { columns: string[]; rows: string[][]; delimiter?: string } {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const data = candidate.kind === "model" && candidate.modelType === "model.table" && candidate.data && typeof candidate.data === "object"
    ? (candidate.data as Record<string, unknown>)
    : candidate;
  return {
    columns: Array.isArray(data.columns) ? data.columns.map(String) : [],
    rows: Array.isArray(data.rows) ? data.rows.map((row) => (Array.isArray(row) ? row.map(String) : [String(row)])) : [],
    delimiter: typeof data.delimiter === "string" ? data.delimiter : undefined
  };
}

function escapeDelimitedField(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes("\n") || value.includes("\r") || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function inferDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const candidates = [",", "\t", ";", "|"];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length - 1 }))
    .sort((left, right) => right.count - left.count)[0]?.delimiter || ",";
}

function buildUserModuleRegistry(request: LuaRunRequest): Record<string, string> {
  const modules: Record<string, string> = {};
  for (const document of request.documents || []) {
    if (document.languageId !== "text.lua" && !document.fileName.toLowerCase().endsWith(".lua")) {
      continue;
    }
    const moduleName = document.fileName.replace(/\\/g, "/").replace(/\.lua$/i, "").replace(/[/-]/g, ".").replace(/^\.+|\.+$/g, "");
    if (moduleName && document.text !== request.source) {
      modules[moduleName] = document.text;
    }
  }
  return modules;
}

function sanitizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "lua-action";
}

function luaErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function luaRuntimeDiagnostic(message: string, request: LuaRunRequest): Diagnostic {
  const location = luaErrorLocation(message, request.source, request.sourceOffset);
  const input = request.input?.kind === "text" ? request.input : undefined;
  const targetLuaDocument = input?.languageId === "text.lua" ? input : undefined;
  return {
    id: `lua-runtime-${location.line ?? "error"}-${location.column ?? 0}`,
    source: "lua-runtime",
    severity: "error",
    languageId: "text.lua",
    documentId: targetLuaDocument?.documentId,
    message: `Lua error: ${message}`,
    target: { fileName: request.fileName || "console.lua" },
    ...location
  };
}

function luaErrorLocation(
  message: string,
  source: string,
  sourceOffset: Pick<NonNullable<LuaRunRequest["sourceOffset"]>, "from" | "line" | "column"> = { from: 0, line: 0, column: 0 }
): Pick<Diagnostic, "from" | "to" | "line" | "column" | "range"> {
  const match = /:(\d+):/.exec(message);
  if (!match) {
    return {};
  }
  const localLine = Math.max(0, Number(match[1]) - 1);
  const column = localLine === 0 ? sourceOffset.column : 0;
  const from = sourceOffset.from + offsetAtLine(source, localLine, column);
  const range = {
    from,
    to: from,
    line: sourceOffset.line + localLine,
    column
  };
  return { ...range, range };
}

function offsetAtLine(source: string, line: number, column: number): number {
  if (line <= 0) {
    return column;
  }
  let position = 0;
  let currentLine = 0;
  while (currentLine < line && position < source.length) {
    const next = source.indexOf("\n", position);
    if (next < 0) {
      return source.length;
    }
    position = next + 1;
    currentLine += 1;
  }
  return Math.min(source.length, position + column);
}
