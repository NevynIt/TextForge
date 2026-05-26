import {
  createCanonicalContributionId,
  createCapability,
  createCommand,
  createContributionManifest,
  createDiagnostic,
  createPipelineContribution,
  createPipelineValue,
  createResourcePredicate,
} from '@textforge/core';
import {
  basenameWorkspacePath,
  dirnameWorkspacePath,
  joinWorkspacePath,
  normalizeWorkspacePath,
} from '@textforge/workspace';
import fengariCore from 'fengari/src/fengaricore.js';
import fengariLua from 'fengari/src/lua.js';
import fengariLauxlib from 'fengari/src/lauxlib.js';
import fengariBaseLib from 'fengari/src/lbaselib.js';
import fengariMathLib from 'fengari/src/lmathlib.js';
import fengariStringLib from 'fengari/src/lstrlib.js';
import fengariTableLib from 'fengari/src/ltablib.js';
import fengariUtf8Lib from 'fengari/src/lutf8lib.js';

const { to_luastring } = fengariCore;
const lua = fengariLua;
const lauxlib = fengariLauxlib;
const { luaopen_base } = fengariBaseLib;
const { luaopen_math } = fengariMathLib;
const { luaopen_string } = fengariStringLib;
const { luaopen_table } = fengariTableLib;
const { luaopen_utf8 } = fengariUtf8Lib;

const packageId = '@textforge/lua';
const luaLanguageId = 'lua';
const defaultAutomationRoot = '/.textforge/automation/lua';
const defaultInstructionHookInterval = 1_000;
const packageKey = to_luastring('package');
const loadedKey = to_luastring('loaded');
const preloadKey = to_luastring('preload');
const searchersKey = to_luastring('searchers');
const pathKey = to_luastring('path');
const configKey = to_luastring('config');
const runKey = to_luastring('run');
const kindKey = to_luastring('kind');
const valueKey = to_luastring('value');
const idKey = to_luastring('id');
const nameKey = to_luastring('name');
const inputKey = to_luastring('input');
const outputKey = to_luastring('output');
const categoryKey = to_luastring('category');
const descriptionKey = to_luastring('description');
const tfKey = to_luastring('tf');

export const luaAutomationRoot = defaultAutomationRoot;
export const luaCapabilityIds = {
  manualRun: `${packageId}/capability/manual-run`,
  automation: `${packageId}/capability/automation`,
  console: `${packageId}/capability/console`,
};

export const defaultLuaExecutionLimits = Object.freeze({
  maxInstructions: 1_000_000,
  maxWallTimeMs: 500,
  maxOutputBytes: 2 * 1024 * 1024,
  maxRecursionDepth: 8,
  instructionHookInterval: defaultInstructionHookInterval,
});

export const luaBlockedGlobals = Object.freeze([
  'window',
  'document',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'localStorage',
  'indexedDB',
  'importScripts',
  'Function',
  'eval',
]);

export const luaBlockedModules = Object.freeze([
  'io',
  'os',
  'socket',
  'js',
]);

export const luaCommandContributions = [
  createCommand('lua.open-console', 'Open Lua console', {
    category: 'lua',
    description: 'Open the xterm.js-backed Lua console surface.',
    keywords: ['lua', 'console', 'terminal', 'xterm'],
    menu: { id: 'lua', label: 'Lua', groupOrder: 60, order: 10 },
    toolbar: { order: 120, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('lua.run-selected-resource', 'Run selected Lua file', {
    category: 'lua',
    description: 'Run the selected Lua resource once in the local sandbox.',
    keywords: ['lua', 'run', 'script'],
    menu: { id: 'lua', label: 'Lua', groupOrder: 60, order: 20 },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['resource'], selectionLanguageIds: ['lua'] },
  }),
  createCommand('lua.promote-selected-to-automation', 'Promote selected Lua file to automation area', {
    category: 'lua',
    description: 'Copy the selected Lua file into the reserved automation root so it can be discovered as a pipeline.',
    keywords: ['lua', 'automation', 'promote', 'pipeline'],
    menu: { id: 'lua', label: 'Lua', groupOrder: 60, order: 30 },
    when: { workspaceReady: true, selectionRequired: true, selectionKinds: ['resource'], selectionLanguageIds: ['lua'] },
  }),
  createCommand('lua.reload-automation', 'Reload Lua automation pipelines', {
    category: 'lua',
    description: 'Rescan the reserved Lua automation root and rebuild discovered Lua pipeline contributions.',
    keywords: ['lua', 'reload', 'automation', 'pipeline'],
    menu: { id: 'lua', label: 'Lua', groupOrder: 60, order: 40 },
    when: { workspaceReady: true },
  }),
  createCommand('lua.open-automation-root', 'Open Lua automation area', {
    category: 'lua',
    description: 'Focus the reserved Lua automation root in the workspace.',
    keywords: ['lua', 'automation', 'root', 'workspace'],
    menu: { id: 'lua', label: 'Lua', groupOrder: 60, order: 50 },
    when: { workspaceReady: true },
  }),
];

export const luaConsoleResourceMimeType = 'application/x-textforge-lua-console';
export const luaConsoleResourcePath = '/.textforge/runtime/lua-console.session';

export const luaCapabilities = [
  createCapability(luaCapabilityIds.manualRun, {
    description: 'Allows manual execution of Lua source in the local sandbox.',
    localName: 'manual-run',
    defaultActive: true,
    scope: 'document',
    documentPredicate: createResourcePredicate({
      languageIds: [luaLanguageId],
      representations: ['text'],
    }),
  }),
  createCapability(luaCapabilityIds.automation, {
    description: 'Allows Lua automation discovery from the reserved workspace automation root.',
    localName: 'automation',
    defaultActive: true,
    scope: 'workspace',
  }),
  createCapability(luaCapabilityIds.console, {
    description: 'Allows the local Lua console surface.',
    localName: 'console',
    defaultActive: true,
    scope: 'session',
  }),
];

function createDefaultConsoleState() {
  return {
    history: [],
    historyIndex: 0,
    transcript: [
      'TextForge Lua Console',
    ],
    currentInput: '',
  };
}

function formatLuaConsolePrompt() {
  return '\x1b[38;5;81mlua>\x1b[0m ';
}

function writeConsoleTranscript(terminal, state) {
  for (const line of state.transcript) {
    terminal.writeln(line);
  }
  terminal.write(formatLuaConsolePrompt());
  if (state.currentInput) {
    terminal.write(state.currentInput);
  }
}

function formatLuaConsoleResult(result) {
  const lines = [];
  for (const line of result.consoleLines ?? []) {
    lines.push(line.kind === 'inspect' ? `inspect: ${line.text}` : line.text);
  }

  for (const diagnostic of result.diagnostics ?? []) {
    lines.push(`${diagnostic.severity}: ${diagnostic.message}`);
  }

  if (result.ok && result.value?.value !== undefined) {
    lines.push(normalizeConsoleText(result.value.value));
  }

  return lines;
}

export function createLuaConsoleSurface(options = {}) {
  return {
    id: 'lua-console-surface',
    mount(container) {
      const disposeCallbacks = [];
      container.innerHTML = '<section class="tf-lua-console"><div class="tf-lua-console__terminal" data-lua-terminal></div></section>';
      const host = container.querySelector('[data-lua-terminal]');
      if (!host) {
        return () => {
          container.replaceChildren();
        };
      }

      let disposed = false;
      let terminal;
      let fitAddon;
      let busy = false;
      let state = {
        ...createDefaultConsoleState(),
        ...(typeof options.getState === 'function' ? options.getState() : {}),
      };

      const syncState = (nextState) => {
        state = nextState;
        options.setState?.(state);
      };

      const rerender = () => {
        if (!terminal || disposed) {
          return;
        }

        terminal.reset();
        writeConsoleTranscript(terminal, state);
      };

      const handleSubmit = async (command) => {
        const trimmed = command.trim();
        const nextTranscript = [...state.transcript, `${formatLuaConsolePrompt().replace(/\x1b\[[0-9;]*m/g, '')}${command}`];
        const nextHistory = trimmed ? [...state.history, command] : [...state.history];
        syncState({
          ...state,
          transcript: nextTranscript,
          history: nextHistory,
          historyIndex: nextHistory.length,
          currentInput: '',
        });
        rerender();
        if (!trimmed) {
          return;
        }

        busy = true;
        try {
          const result = await options.runCommand?.(command);
          const nextLines = formatLuaConsoleResult(result ?? { ok: true, consoleLines: [], diagnostics: [] });
          syncState({
            ...state,
            transcript: [...nextTranscript, ...nextLines],
            history: nextHistory,
            historyIndex: nextHistory.length,
            currentInput: '',
          });
        } catch (error) {
          syncState({
            ...state,
            transcript: [...nextTranscript, `error: ${error?.message ?? 'Lua console command failed.'}`],
            history: nextHistory,
            historyIndex: nextHistory.length,
            currentInput: '',
          });
        } finally {
          busy = false;
          rerender();
        }
      };

      const boot = async () => {
        const [{ Terminal }, { FitAddon }] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
        ]);
        if (disposed) {
          return;
        }

        terminal = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontFamily: '"Iosevka Term", Consolas, "SFMono-Regular", monospace',
          fontSize: 13,
          theme: {
            background: '#09111f',
            foreground: '#d9e6ff',
            cursor: '#7dd3fc',
            black: '#0b1220',
            brightBlack: '#344055',
            red: '#f97373',
            brightRed: '#fb7185',
            green: '#86efac',
            brightGreen: '#4ade80',
            yellow: '#fcd34d',
            brightYellow: '#f59e0b',
            blue: '#60a5fa',
            brightBlue: '#38bdf8',
            magenta: '#f9a8d4',
            brightMagenta: '#f472b6',
            cyan: '#67e8f9',
            brightCyan: '#22d3ee',
            white: '#d9e6ff',
            brightWhite: '#ffffff',
          },
        });
        fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(host);
        fitAddon.fit();
        rerender();
        terminal.focus();
        disposeCallbacks.push(terminal.onData((data) => {
          if (busy) {
            return;
          }

          if (data === '\r') {
            void handleSubmit(state.currentInput);
            return;
          }

          if (data === '\u0003') {
            syncState({
              ...state,
              transcript: [...state.transcript, `${formatLuaConsolePrompt().replace(/\x1b\[[0-9;]*m/g, '')}${state.currentInput}`, '^C'],
              currentInput: '',
            });
            rerender();
            return;
          }

          if (data === '\u007f') {
            if (!state.currentInput) {
              return;
            }
            syncState({
              ...state,
              currentInput: state.currentInput.slice(0, -1),
            });
            rerender();
            return;
          }

          if (data === '\u001b[A') {
            if (state.history.length === 0) {
              return;
            }
            const nextIndex = Math.max(0, state.historyIndex - 1);
            syncState({
              ...state,
              historyIndex: nextIndex,
              currentInput: state.history[nextIndex] ?? '',
            });
            rerender();
            return;
          }

          if (data === '\u001b[B') {
            if (state.history.length === 0) {
              return;
            }
            const nextIndex = Math.min(state.history.length, state.historyIndex + 1);
            syncState({
              ...state,
              historyIndex: nextIndex,
              currentInput: state.history[nextIndex] ?? '',
            });
            rerender();
            return;
          }

          if (data >= ' ') {
            syncState({
              ...state,
              currentInput: `${state.currentInput}${data}`,
            });
            terminal.write(data);
          }
        }));
        const resizeObserver = new ResizeObserver(() => fitAddon?.fit());
        resizeObserver.observe(host);
        disposeCallbacks.push(() => resizeObserver.disconnect());
      };

      void boot();
      return () => {
        disposed = true;
        for (const dispose of disposeCallbacks) {
          if (typeof dispose === 'function') {
            dispose();
          } else {
            dispose?.dispose?.();
          }
        }
        terminal?.dispose?.();
        container.replaceChildren();
      };
    },
  };
}

export const luaConsoleSurfaceContribution = {
  id: `${packageId}/console`,
  label: 'Lua Console',
  description: 'xterm.js-backed local Lua console with a persistent sandboxed session.',
  localName: 'console',
  capabilities: [luaCapabilityIds.console],
  defaultActive: true,
  allowPopup: true,
  mimeTypes: [luaConsoleResourceMimeType],
  open(execution = {}) {
    return {
      mountId: `lua-console:${execution.resource?.resourceId ?? 'session'}`,
      summary: 'Local Lua console with a persistent sandboxed session.',
      detail: 'Interactive xterm.js surface; no DOM, network, or local filesystem access.',
      readOnly: false,
      surface: createLuaConsoleSurface({
        getState: execution.getConsoleState,
        setState: execution.setConsoleState,
        runCommand: execution.runConsoleCommand,
      }),
    };
  },
};

export function createLuaDiagnostic(code, message, severity = 'error', overrides = {}) {
  return createDiagnostic(message, severity, {
    code,
    origin: {
      packageId,
      subsystem: 'lua',
      ...overrides.origin,
    },
    ...overrides,
  });
}

export function createLuaExecutionLimits(overrides = {}) {
  return {
    ...defaultLuaExecutionLimits,
    ...overrides,
  };
}

export function isLuaAutomationPath(path, automationRoot = defaultAutomationRoot) {
  const normalizedPath = normalizeWorkspacePath(path ?? '/');
  const normalizedRoot = normalizeWorkspacePath(automationRoot);
  return normalizedPath.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`)
    && normalizedPath.toLowerCase().endsWith('.lua');
}

export function isLuaResource(entry) {
  return entry?.kind === 'resource'
    && entry.representation === 'text'
    && String(entry.languageId ?? '').toLowerCase() === luaLanguageId;
}

function createManifestPipelines(definitions = [], executionService) {
  return definitions.map((definition) =>
    createPipelineContribution(definition.contributionId, {
      label: `Lua: ${definition.name}`,
      description: definition.description,
      localName: definition.localName,
      capabilities: [luaCapabilityIds.automation],
      defaultActive: true,
      input: definition.input.length === 1 ? definition.input[0] : 'text',
      output: definition.output,
      async run({ input, context }) {
        return executionService.runAutomation(definition.id, {
          input,
          context,
        });
      },
    }));
}

export function createLuaContributionManifest(options = {}) {
  return createContributionManifest(packageId, {
    capabilities: luaCapabilities,
    commands: luaCommandContributions,
    surfaces: [luaConsoleSurfaceContribution],
    pipelines: createManifestPipelines(options.definitions ?? [], options.executionService ?? createLuaExecutionService()),
  });
}

export const contributions = createLuaContributionManifest();

function createConsoleLine(kind, text) {
  return {
    kind,
    text: String(text ?? ''),
  };
}

function cloneJsonSafe(value) {
  if (value === undefined || value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Uint8Array) {
    return [...value];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => cloneJsonSafe(entry));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneJsonSafe(entry)]),
    );
  }

  return String(value);
}

function normalizeKind(kind) {
  const raw = String(kind ?? 'text').trim();
  return raw || 'text';
}

function normalizeKindMatch(candidate) {
  return normalizeKind(candidate).toLowerCase();
}

function matchesValueContract(expected, actual) {
  const expectedKinds = Array.isArray(expected) ? expected : [expected];
  const actualKind = normalizeKindMatch(actual);
  return expectedKinds.some((candidate) => {
    const normalizedCandidate = normalizeKindMatch(candidate);
    if (!normalizedCandidate) {
      return false;
    }

    if (normalizedCandidate === actualKind) {
      return true;
    }

    if (normalizedCandidate.endsWith('.*')) {
      return actualKind.startsWith(normalizedCandidate.slice(0, -1));
    }

    return actualKind === normalizedCandidate || actualKind.startsWith(`${normalizedCandidate}.`);
  });
}

function coerceArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return [value];
}

function sanitizeLocalName(value, fallback = 'lua-automation') {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function createWorkspaceTextResourceIndex(workspaceInput) {
  const state = typeof workspaceInput?.snapshot === 'function'
    ? workspaceInput.snapshot()
    : workspaceInput;
  const resources = state?.resources ?? [];
  const byPath = new Map();
  const byId = new Map();
  for (const resource of resources) {
    if (resource?.kind !== 'resource' || resource.representation !== 'text' || !resource.path) {
      continue;
    }

    const normalizedPath = normalizeWorkspacePath(resource.path);
    byPath.set(normalizedPath, resource);
    if (resource.id) {
      byId.set(resource.id, resource);
    }
  }

  return {
    resources,
    byPath,
    byId,
  };
}

export function resolveLuaModuleCandidatePaths(scriptPath, moduleName, automationRoot = defaultAutomationRoot) {
  const normalizedScriptPath = normalizeWorkspacePath(scriptPath ?? '/');
  const relativeModulePath = String(moduleName ?? '')
    .trim()
    .replaceAll('.', '/')
    .replace(/^\/+/, '');
  if (!relativeModulePath) {
    return [];
  }

  const sameFolder = dirnameWorkspacePath(normalizedScriptPath);
  const moduleDirectory = relativeModulePath;
  const candidates = [
    joinWorkspacePath(sameFolder, `${moduleDirectory}.lua`),
    joinWorkspacePath(sameFolder, moduleDirectory, 'init.lua'),
    joinWorkspacePath('/lua', `${moduleDirectory}.lua`),
    joinWorkspacePath('/lua', moduleDirectory, 'init.lua'),
    joinWorkspacePath('/lib', `${moduleDirectory}.lua`),
    joinWorkspacePath('/lib', moduleDirectory, 'init.lua'),
    joinWorkspacePath(automationRoot, `${moduleDirectory}.lua`),
    joinWorkspacePath(automationRoot, moduleDirectory, 'init.lua'),
  ];

  return [...new Set(candidates.map((candidate) => normalizeWorkspacePath(candidate)))];
}

export function listLuaAutomationFiles(workspaceInput, options = {}) {
  const automationRoot = normalizeWorkspacePath(options.automationRoot ?? defaultAutomationRoot);
  const disabledPaths = new Set((options.disabledPaths ?? []).map((path) => normalizeWorkspacePath(path)));
  const { resources } = createWorkspaceTextResourceIndex(workspaceInput);
  return resources
    .filter((resource) => isLuaAutomationPath(resource.path, automationRoot))
    .map((resource) => ({
      id: resource.id,
      path: normalizeWorkspacePath(resource.path),
      enabled: !disabledPaths.has(normalizeWorkspacePath(resource.path)),
      source: resource.text ?? '',
      updatedAt: resource.metadata?.updatedAt,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function openLuaLibrary(L, name, openFunction) {
  lauxlib.luaL_requiref(L, to_luastring(name), openFunction, 1);
  lua.lua_pop(L, 1);
}

function setGlobalNil(L, name) {
  lua.lua_pushnil(L);
  lua.lua_setglobal(L, to_luastring(name));
}

function setBlockedGlobal(L, name, message) {
  lua.lua_newtable(L);
  const tableIndex = lua.lua_absindex(L, -1);
  lua.lua_newtable(L);
  lua.lua_pushjsfunction(L, () => lauxlib.luaL_error(L, to_luastring(message)));
  lua.lua_setfield(L, -2, to_luastring('__call'));
  lua.lua_pushjsfunction(L, () => lauxlib.luaL_error(L, to_luastring(message)));
  lua.lua_setfield(L, -2, to_luastring('__index'));
  lua.lua_pushjsfunction(L, () => lauxlib.luaL_error(L, to_luastring(message)));
  lua.lua_setfield(L, -2, to_luastring('__newindex'));
  lua.lua_setmetatable(L, tableIndex);
  lua.lua_setglobal(L, to_luastring(name));
}

function pushLuaString(L, value) {
  lua.lua_pushstring(L, to_luastring(String(value ?? '')));
}

function pushLuaValue(L, value) {
  if (value === undefined || value === null) {
    lua.lua_pushnil(L);
    return;
  }

  if (typeof value === 'string') {
    pushLuaString(L, value);
    return;
  }

  if (typeof value === 'number') {
    lua.lua_pushnumber(L, value);
    return;
  }

  if (typeof value === 'boolean') {
    lua.lua_pushboolean(L, value ? 1 : 0);
    return;
  }

  if (value instanceof Uint8Array) {
    lua.lua_newtable(L);
    for (const [index, item] of [...value].entries()) {
      lua.lua_pushinteger(L, index + 1);
      lua.lua_pushinteger(L, item);
      lua.lua_settable(L, -3);
    }
    return;
  }

  if (Array.isArray(value)) {
    lua.lua_newtable(L);
    for (const [index, item] of value.entries()) {
      lua.lua_pushinteger(L, index + 1);
      pushLuaValue(L, item);
      lua.lua_settable(L, -3);
    }
    return;
  }

  if (typeof value === 'object') {
    lua.lua_newtable(L);
    for (const [key, item] of Object.entries(value)) {
      pushLuaValue(L, item);
      lua.lua_setfield(L, -2, to_luastring(key));
    }
    return;
  }

  pushLuaString(L, String(value));
}

function luaValueToJs(L, index, depth = 0) {
  const absoluteIndex = lua.lua_absindex(L, index);
  const valueType = lua.lua_type(L, absoluteIndex);
  switch (valueType) {
    case lua.LUA_TNIL:
      return null;
    case lua.LUA_TBOOLEAN:
      return lua.lua_toboolean(L, absoluteIndex) !== 0;
    case lua.LUA_TNUMBER:
      return lua.lua_tonumber(L, absoluteIndex);
    case lua.LUA_TSTRING:
      return lua.lua_tojsstring(L, absoluteIndex);
    case lua.LUA_TTABLE: {
      if (depth > 32) {
        return '[lua-table-depth-limit]';
      }

      const entries = [];
      lua.lua_pushnil(L);
      while (lua.lua_next(L, absoluteIndex) !== 0) {
        entries.push({
          key: luaValueToJs(L, -2, depth + 1),
          value: luaValueToJs(L, -1, depth + 1),
        });
        lua.lua_pop(L, 1);
      }

      const isArray = entries.length > 0 && entries.every((entry) =>
        Number.isInteger(entry.key) && entry.key >= 1);
      if (isArray) {
        return entries
          .sort((left, right) => left.key - right.key)
          .map((entry) => entry.value);
      }

      return Object.fromEntries(entries.map((entry) => [String(entry.key), entry.value]));
    }
    case lua.LUA_TFUNCTION:
      return '[lua-function]';
    default:
      return lua.lua_typename(L, valueType) ? lua.lua_tojsstring(L, lua.lua_typename(L, valueType)) : '[lua-value]';
  }
}

function getLuaErrorMessage(L) {
  const message = lua.lua_tojsstring(L, -1);
  lua.lua_pop(L, 1);
  return message;
}

function installInstructionHook(L, limits) {
  const startedAt = Date.now();
  let instructions = 0;
  lua.lua_sethook(L, () => {
    instructions += limits.instructionHookInterval;
    if (instructions > limits.maxInstructions) {
      lauxlib.luaL_error(L, to_luastring(`Lua execution exceeded the instruction limit of ${limits.maxInstructions}.`));
    }

    if (Date.now() - startedAt > limits.maxWallTimeMs) {
      lauxlib.luaL_error(L, to_luastring(`Lua execution exceeded the wall-clock limit of ${limits.maxWallTimeMs} ms.`));
    }
  }, lua.LUA_MASKCOUNT, limits.instructionHookInterval);
}

function pushPipelineValueTable(L, inputValue) {
  const value = inputValue?.kind ? inputValue : createPipelineValue('text', inputValue ?? '');
  const normalizedValue = {
    kind: normalizeKind(value.kind),
    value: cloneJsonSafe(value.value),
    resource: cloneJsonSafe(value.resource),
    metadata: cloneJsonSafe(value.metadata),
  };

  if (normalizedValue.kind.startsWith('text') && typeof normalizedValue.value === 'string') {
    normalizedValue.text = normalizedValue.value;
  }

  pushLuaValue(L, normalizedValue);
  lua.lua_pushjsfunction(L, () => {
    const languageId = lua.lua_tojsstring(L, 2);
    const text = lua.lua_tojsstring(L, 3);
    pushLuaValue(L, createPipelineValue('text', text, {
      metadata: { languageId },
    }));
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring('emit_text'));
  lua.lua_pushjsfunction(L, () => {
    const jsonValue = luaValueToJs(L, 2);
    pushLuaValue(L, createPipelineValue('json', jsonValue));
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring('emit_json'));
  lua.lua_pushjsfunction(L, () => {
    const severity = lua.lua_tojsstring(L, 2);
    const message = lua.lua_tojsstring(L, 3);
    pushLuaValue(L, {
      severity,
      message,
      kind: 'diagnostic',
    });
    return 1;
  });
  lua.lua_setfield(L, -2, to_luastring('diagnostic'));
}

function createRuntimeContext(options = {}) {
  return {
    limits: createLuaExecutionLimits(options.limits),
    workspaceIndex: createWorkspaceTextResourceIndex(options.workspace),
    automationRoot: normalizeWorkspacePath(options.automationRoot ?? defaultAutomationRoot),
    pipelineDefinitions: [...(options.pipelineDefinitions ?? [])],
    automationDefinitions: [...(options.automationDefinitions ?? [])],
    invokePipelineStep: options.invokePipelineStep,
    invokeActionStep: options.invokeActionStep,
    recursionDepth: options.recursionDepth ?? 0,
    currentScriptPaths: [],
    consoleLines: [],
  };
}

function setPackageLoadedModule(L, moduleName) {
  const moduleIndex = lua.lua_absindex(L, -1);
  lua.lua_getglobal(L, packageKey);
  lua.lua_getfield(L, -1, loadedKey);
  lua.lua_pushvalue(L, moduleIndex);
  lua.lua_setfield(L, -2, to_luastring(moduleName));
  lua.lua_pop(L, 2);
}

function pushPackageLoadedModule(L, moduleName) {
  lua.lua_getglobal(L, packageKey);
  lua.lua_getfield(L, -1, loadedKey);
  lua.lua_getfield(L, -1, to_luastring(moduleName));
  const found = !lua.lua_isnil(L, -1);
  if (found) {
    lua.lua_remove(L, -2);
    lua.lua_remove(L, -2);
    return true;
  }

  lua.lua_pop(L, 3);
  return false;
}

function createModuleNotFoundError(moduleName) {
  return `module '${moduleName}' not found:\n  no TextForge bundled module '${moduleName}'\n  no user Lua module '${moduleName}'`;
}

function resolveWorkspaceLuaModule(runtime, moduleName) {
  const currentScriptPath = runtime.currentScriptPaths.at(-1) ?? '/';
  const candidates = resolveLuaModuleCandidatePaths(currentScriptPath, moduleName, runtime.automationRoot);
  for (const candidate of candidates) {
    const resource = runtime.workspaceIndex.byPath.get(candidate);
    if (resource?.representation === 'text') {
      return {
        path: candidate,
        source: resource.text ?? '',
      };
    }
  }

  return undefined;
}

function createLuaActionCatalog(definitions) {
  const byId = new Map();
  const byName = new Map();
  for (const definition of definitions) {
    byId.set(definition.id, definition);
    byId.set(definition.contributionId, definition);
    byName.set(definition.name, definition);
    byName.set(definition.localName, definition);
  }

  return {
    byId,
    byName,
  };
}

function normalizeConsoleText(value) {
  if (value === undefined || value === null) {
    return 'nil';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function installBundledModules(L, runtime) {
  const actionCatalog = createLuaActionCatalog(runtime.automationDefinitions);
  const pipelineCatalog = createLuaActionCatalog(runtime.pipelineDefinitions);

  function pushTfPipelineModule() {
    lua.lua_newtable(L);
    lua.lua_pushjsfunction(L, () => {
      const requestedId = lua.lua_tojsstring(L, 1);
      const inputValue = luaValueToJs(L, 2);
      const actionDefinition = actionCatalog.byId.get(requestedId)
        ?? actionCatalog.byName.get(requestedId)
        ?? pipelineCatalog.byId.get(requestedId)
        ?? pipelineCatalog.byName.get(requestedId);
      if (actionDefinition?.source) {
        const nestedResult = runLuaAutomationDefinition(actionDefinition, {
          input: inputValue,
          workspace: {
            resources: runtime.workspaceIndex.resources,
          },
          automationDefinitions: runtime.automationDefinitions,
          pipelineDefinitions: runtime.pipelineDefinitions,
          invokePipelineStep: runtime.invokePipelineStep,
          invokeActionStep: runtime.invokeActionStep,
          recursionDepth: runtime.recursionDepth + 1,
          limits: runtime.limits,
        });
        if (!nestedResult.ok) {
          const detail = nestedResult.diagnostics[0]?.message ?? `Lua pipeline ${requestedId} failed.`;
          return lauxlib.luaL_error(L, to_luastring(detail));
        }

        pushLuaValue(L, cloneJsonSafe(nestedResult.value));
        return 1;
      }

      if (typeof runtime.invokePipelineStep === 'function') {
        const result = runtime.invokePipelineStep({
          id: requestedId,
          value: inputValue,
        });
        pushLuaValue(L, cloneJsonSafe(result));
        return 1;
      }

      return lauxlib.luaL_error(L, to_luastring(`Pipeline step "${requestedId}" is not available in the current Lua runtime.`));
    });
    lua.lua_setfield(L, -2, runKey);
    lua.lua_pushjsfunction(L, () => {
      const visible = [...new Set([
        ...runtime.automationDefinitions.map((definition) => definition.name),
        ...runtime.pipelineDefinitions.map((definition) => definition.name ?? definition.id),
      ])];
      pushLuaValue(L, visible);
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring('list'));
  }

  function pushTfActionsModule() {
    lua.lua_newtable(L);
    lua.lua_pushjsfunction(L, () => {
      const requestedId = lua.lua_tojsstring(L, 1);
      const inputValue = luaValueToJs(L, 2);
      const actionDefinition = actionCatalog.byId.get(requestedId) ?? actionCatalog.byName.get(requestedId);
      if (!actionDefinition) {
        if (typeof runtime.invokeActionStep === 'function') {
          const result = runtime.invokeActionStep({
            id: requestedId,
            value: inputValue,
          });
          pushLuaValue(L, cloneJsonSafe(result));
          return 1;
        }

        return lauxlib.luaL_error(L, to_luastring(`Lua action "${requestedId}" is not available in the current runtime.`));
      }

      const nestedResult = runLuaAutomationDefinition(actionDefinition, {
        input: inputValue,
        workspace: {
          resources: runtime.workspaceIndex.resources,
        },
        automationDefinitions: runtime.automationDefinitions,
        pipelineDefinitions: runtime.pipelineDefinitions,
        invokePipelineStep: runtime.invokePipelineStep,
        invokeActionStep: runtime.invokeActionStep,
        recursionDepth: runtime.recursionDepth + 1,
        limits: runtime.limits,
      });
      if (!nestedResult.ok) {
        const detail = nestedResult.diagnostics[0]?.message ?? `Lua action ${requestedId} failed.`;
        return lauxlib.luaL_error(L, to_luastring(detail));
      }

      pushLuaValue(L, cloneJsonSafe(nestedResult.value));
      return 1;
    });
    lua.lua_setfield(L, -2, runKey);
    lua.lua_pushjsfunction(L, () => {
      pushLuaValue(L, runtime.automationDefinitions.map((definition) => ({
        id: definition.id,
        name: definition.name,
        input: definition.input,
        output: definition.output,
      })));
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring('list'));
  }

  function pushTfConsoleModule() {
    lua.lua_newtable(L);
    lua.lua_pushjsfunction(L, () => {
      const value = luaValueToJs(L, 1);
      runtime.consoleLines.push(createConsoleLine('inspect', normalizeConsoleText(value)));
      pushLuaValue(L, value);
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring('inspect'));
  }

  function pushTfModule() {
    lua.lua_newtable(L);
    pushTfPipelineModule();
    lua.lua_setfield(L, -2, to_luastring('pipeline'));
    pushTfActionsModule();
    lua.lua_setfield(L, -2, to_luastring('actions'));
    pushTfConsoleModule();
    lua.lua_setfield(L, -2, to_luastring('console'));
    lua.lua_pushjsfunction(L, () => {
      const jsonValue = luaValueToJs(L, 1);
      pushLuaValue(L, createPipelineValue('json', jsonValue));
      return 1;
    });
    lua.lua_setfield(L, -2, to_luastring('emit_json'));
  }

  const bundledModulePushers = new Map([
    ['tf.pipeline', pushTfPipelineModule],
    ['tf.actions', pushTfActionsModule],
    ['tf.console', pushTfConsoleModule],
    ['tf', pushTfModule],
  ]);

  lua.lua_newtable(L);
  lua.lua_newtable(L);
  lua.lua_setfield(L, -2, loadedKey);
  lua.lua_newtable(L);
  lua.lua_setfield(L, -2, preloadKey);
  lua.lua_newtable(L);
  lua.lua_setfield(L, -2, searchersKey);
  pushLuaString(L, 'TextForge virtual modules');
  lua.lua_setfield(L, -2, pathKey);
  pushLuaString(L, '\n;\n?\n');
  lua.lua_setfield(L, -2, configKey);
  lua.lua_setglobal(L, packageKey);

  lua.lua_pushjsfunction(L, () => {
    const moduleName = lua.lua_tojsstring(L, 1);
    if (luaBlockedModules.includes(moduleName)) {
      return lauxlib.luaL_error(L, to_luastring(`Blocked Lua module request: ${moduleName}`));
    }

    if (pushPackageLoadedModule(L, moduleName)) {
      return 1;
    }

    const bundledPusher = bundledModulePushers.get(moduleName);
    if (bundledPusher) {
      bundledPusher();
      setPackageLoadedModule(L, moduleName);
      return 1;
    }

    const moduleRecord = resolveWorkspaceLuaModule(runtime, moduleName);
    if (!moduleRecord) {
      return lauxlib.luaL_error(L, to_luastring(createModuleNotFoundError(moduleName)));
    }

    runtime.currentScriptPaths.push(moduleRecord.path);
    const status = lauxlib.luaL_loadbuffer(
      L,
      to_luastring(moduleRecord.source),
      to_luastring(moduleRecord.source).length,
      to_luastring(`@${moduleRecord.path}`),
    );
    if (status !== lua.LUA_OK) {
      runtime.currentScriptPaths.pop();
      return lauxlib.luaL_error(L, to_luastring(getLuaErrorMessage(L)));
    }

    const moduleCallStatus = lua.lua_pcall(L, 0, 1, 0);
    runtime.currentScriptPaths.pop();
    if (moduleCallStatus !== lua.LUA_OK) {
      return lauxlib.luaL_error(L, to_luastring(getLuaErrorMessage(L)));
    }

    if (lua.lua_isnil(L, -1)) {
      lua.lua_pop(L, 1);
      lua.lua_pushboolean(L, 1);
    }

    setPackageLoadedModule(L, moduleName);
    return 1;
  });
  lua.lua_setglobal(L, to_luastring('require'));

  pushTfModule();
  lua.lua_setglobal(L, tfKey);
}

function installPrintOverride(L, runtime) {
  lua.lua_pushjsfunction(L, () => {
    const top = lua.lua_gettop(L);
    const values = [];
    for (let index = 1; index <= top; index += 1) {
      values.push(normalizeConsoleText(luaValueToJs(L, index)));
    }
    runtime.consoleLines.push(createConsoleLine('print', values.join('\t')));
    return 0;
  });
  lua.lua_setglobal(L, to_luastring('print'));
}

function installBlockedGlobals(L) {
  for (const globalName of luaBlockedGlobals) {
    setBlockedGlobal(L, globalName, `Blocked browser API: ${globalName}`);
  }
}

function createLuaState(runtime) {
  const L = lauxlib.luaL_newstate();
  openLuaLibrary(L, '_G', luaopen_base);
  openLuaLibrary(L, 'table', luaopen_table);
  openLuaLibrary(L, 'string', luaopen_string);
  openLuaLibrary(L, 'math', luaopen_math);
  openLuaLibrary(L, 'utf8', luaopen_utf8);
  setGlobalNil(L, 'dofile');
  setGlobalNil(L, 'loadfile');
  setGlobalNil(L, 'load');
  setGlobalNil(L, 'collectgarbage');
  installBlockedGlobals(L);
  installInstructionHook(L, runtime.limits);
  installBundledModules(L, runtime);
  installPrintOverride(L, runtime);
  return L;
}

function loadAndExecuteChunk(L, source, scriptPath, inputValue) {
  const chunkName = `@${normalizeWorkspacePath(scriptPath ?? '/lua/script.lua')}`;
  const sourceBytes = to_luastring(source ?? '');
  pushPipelineValueTable(L, inputValue);
  lua.lua_setglobal(L, to_luastring('input'));
  const loadStatus = lauxlib.luaL_loadbuffer(L, sourceBytes, sourceBytes.length, to_luastring(chunkName));
  if (loadStatus !== lua.LUA_OK) {
    throw new Error(getLuaErrorMessage(L));
  }

  pushPipelineValueTable(L, inputValue);
  const callStatus = lua.lua_pcall(L, 1, 1, 0);
  if (callStatus !== lua.LUA_OK) {
    throw new Error(getLuaErrorMessage(L));
  }
}

function loadConsoleChunk(L, command, scriptPath) {
  const normalizedCommand = String(command ?? '');
  const trimmedCommand = normalizedCommand.trim();
  const chunkName = `@${normalizeWorkspacePath(scriptPath ?? luaConsoleResourcePath)}`;
  const tryLoad = (source) => {
    const sourceBytes = to_luastring(source);
    return lauxlib.luaL_loadbuffer(L, sourceBytes, sourceBytes.length, to_luastring(chunkName));
  };

  const expressionSource = trimmedCommand.startsWith('=')
    ? `return ${trimmedCommand.slice(1).trim()}`
    : `return ${normalizedCommand}`;
  const primarySource = trimmedCommand.startsWith('=') ? expressionSource : normalizedCommand;
  const fallbackSource = trimmedCommand.startsWith('=') ? undefined : expressionSource;

  const primaryStatus = tryLoad(primarySource);
  if (primaryStatus === lua.LUA_OK) {
    return;
  }

  const primaryError = getLuaErrorMessage(L);
  if (!fallbackSource) {
    throw new Error(primaryError);
  }

  const fallbackStatus = tryLoad(fallbackSource);
  if (fallbackStatus === lua.LUA_OK) {
    return;
  }

  lua.lua_pop(L, 1);
  throw new Error(primaryError);
}

function readLuaStringField(L, tableIndex, fieldName) {
  lua.lua_getfield(L, tableIndex, to_luastring(fieldName));
  const value = lua.lua_isnil(L, -1) ? undefined : lua.lua_tojsstring(L, -1);
  lua.lua_pop(L, 1);
  return value;
}

function readLuaFieldAsArray(L, tableIndex, fieldName) {
  lua.lua_getfield(L, tableIndex, to_luastring(fieldName));
  if (lua.lua_isnil(L, -1)) {
    lua.lua_pop(L, 1);
    return [];
  }

  const value = luaValueToJs(L, -1);
  lua.lua_pop(L, 1);
  return coerceArray(value).map((entry) => String(entry));
}

function luaTableHasFunctionField(L, tableIndex, fieldName) {
  lua.lua_getfield(L, tableIndex, to_luastring(fieldName));
  const hasFunction = lua.lua_isfunction(L, -1);
  lua.lua_pop(L, 1);
  return hasFunction;
}

function extractDefinitionFromLuaTable(L, tableIndex, options = {}) {
  const id = readLuaStringField(L, tableIndex, 'id')
    ?? sanitizeLocalName(basenameWorkspacePath(options.scriptPath).replace(/\.lua$/i, ''), 'lua-automation');
  const name = readLuaStringField(L, tableIndex, 'name') ?? basenameWorkspacePath(options.scriptPath ?? id);
  const input = readLuaFieldAsArray(L, tableIndex, 'input');
  const output = readLuaStringField(L, tableIndex, 'output') ?? 'text';
  const category = readLuaStringField(L, tableIndex, 'category') ?? 'Lua Automation';
  const description = readLuaStringField(L, tableIndex, 'description') ?? '';
  return {
    id,
    name,
    input: input.length > 0 ? input : ['text'],
    output,
    category,
    description,
    localName: sanitizeLocalName(id, 'lua-automation'),
    contributionId: createCanonicalContributionId(packageId, `automation-${sanitizeLocalName(id, 'lua-automation')}`),
    sourcePath: normalizeWorkspacePath(options.scriptPath ?? `/${id}.lua`),
    sourceResourceId: options.sourceResourceId,
    source: options.source ?? '',
  };
}

function extractLuaDefinitions(L, scriptPath, source, sourceResourceId) {
  const valueType = lua.lua_type(L, -1);
  if (valueType === lua.LUA_TFUNCTION) {
    const id = sanitizeLocalName(basenameWorkspacePath(scriptPath).replace(/\.lua$/i, ''), 'lua-automation');
    return [{
      id,
      name: basenameWorkspacePath(scriptPath),
      input: ['text'],
      output: 'text',
      category: 'Lua Automation',
      description: '',
      localName: id,
      contributionId: createCanonicalContributionId(packageId, `automation-${id}`),
      sourcePath: normalizeWorkspacePath(scriptPath),
      sourceResourceId,
      source,
    }];
  }

  if (valueType !== lua.LUA_TTABLE) {
    return [];
  }

  const tableIndex = lua.lua_absindex(L, -1);
  if (luaTableHasFunctionField(L, tableIndex, 'run')) {
    return [extractDefinitionFromLuaTable(L, tableIndex, { scriptPath, source, sourceResourceId })];
  }

  const values = luaValueToJs(L, tableIndex);
  if (!Array.isArray(values)) {
    return [];
  }

  const definitions = [];
  for (let index = 1; index <= values.length; index += 1) {
    lua.lua_rawgeti(L, tableIndex, index);
    if (lua.lua_istable(L, -1) && luaTableHasFunctionField(L, lua.lua_absindex(L, -1), 'run')) {
      definitions.push(extractDefinitionFromLuaTable(L, lua.lua_absindex(L, -1), {
        scriptPath,
        source,
        sourceResourceId,
      }));
    }
    lua.lua_pop(L, 1);
  }

  return definitions;
}

function normalizePipelineValueOutput(rawValue, expectedOutput = 'text') {
  if (rawValue?.kind && Object.prototype.hasOwnProperty.call(rawValue, 'value')) {
    return {
      kind: normalizeKind(rawValue.kind),
      value: cloneJsonSafe(rawValue.value),
      resource: cloneJsonSafe(rawValue.resource),
      metadata: cloneJsonSafe(rawValue.metadata),
    };
  }

  if (typeof rawValue === 'string') {
    return createPipelineValue(normalizeKind(expectedOutput), rawValue);
  }

  return createPipelineValue(normalizeKind(expectedOutput), cloneJsonSafe(rawValue));
}

function executeReturnedLuaValue(L, inputValue) {
  if (lua.lua_isfunction(L, -1)) {
    lua.lua_pushvalue(L, -1);
    pushPipelineValueTable(L, inputValue);
    const status = lua.lua_pcall(L, 1, 1, 0);
    if (status !== lua.LUA_OK) {
      throw new Error(getLuaErrorMessage(L));
    }
    lua.lua_remove(L, -2);
    return;
  }

  if (lua.lua_istable(L, -1) && luaTableHasFunctionField(L, lua.lua_absindex(L, -1), 'run')) {
    const descriptorIndex = lua.lua_absindex(L, -1);
    const outputKind = readLuaStringField(L, descriptorIndex, 'output') ?? 'text';
    lua.lua_getfield(L, descriptorIndex, runKey);
    pushPipelineValueTable(L, inputValue);
    const status = lua.lua_pcall(L, 1, 1, 0);
    if (status !== lua.LUA_OK) {
      throw new Error(getLuaErrorMessage(L));
    }
    lua.lua_remove(L, descriptorIndex);
    return outputKind;
  }

  return readLuaStringField(L, lua.lua_absindex(L, -1), 'output');
}

export function runLuaScript(options = {}) {
  const runtime = createRuntimeContext(options);
  if (runtime.recursionDepth > runtime.limits.maxRecursionDepth) {
    return {
      ok: false,
      value: createPipelineValue('diagnostics', []),
      diagnostics: [createLuaDiagnostic('lua.recursion-limit', `Lua recursion exceeded ${runtime.limits.maxRecursionDepth} nested calls.`)],
      consoleLines: [],
      definitions: [],
    };
  }

  const scriptPath = normalizeWorkspacePath(options.scriptPath ?? '/lua/script.lua');
  runtime.currentScriptPaths.push(scriptPath);
  const L = createLuaState(runtime);
  try {
    loadAndExecuteChunk(L, options.source ?? '', scriptPath, options.input ?? createPipelineValue('text', ''));

    if (options.mode === 'discover') {
      const definitions = extractLuaDefinitions(L, scriptPath, options.source ?? '', options.sourceResourceId);
      return {
        ok: true,
        diagnostics: [],
        definitions,
        consoleLines: runtime.consoleLines,
      };
    }

    const outputKind = executeReturnedLuaValue(L, options.input ?? createPipelineValue('text', ''));
    const rawValue = luaValueToJs(L, -1);
    return {
      ok: true,
      diagnostics: [],
      value: normalizePipelineValueOutput(rawValue, options.expectedOutput ?? outputKind ?? 'text'),
      consoleLines: runtime.consoleLines,
    };
  } catch (error) {
    return {
      ok: false,
      value: createPipelineValue('diagnostics', []),
      diagnostics: [
        createLuaDiagnostic('lua.runtime-error', error?.message ?? 'Lua execution failed.', 'error', {
          resource: options.resource,
        }),
      ],
      consoleLines: runtime.consoleLines,
      definitions: [],
    };
  } finally {
    runtime.currentScriptPaths.pop();
  }
}

function syncConsoleRuntimeState(runtime, runOptions = {}, automationDefinitions = [], pipelineDefinitions = []) {
  Object.assign(runtime.limits, createLuaExecutionLimits(runOptions.limits));
  runtime.workspaceIndex = createWorkspaceTextResourceIndex(runOptions.workspace);
  runtime.automationRoot = normalizeWorkspacePath(runOptions.automationRoot ?? defaultAutomationRoot);
  runtime.automationDefinitions = [...automationDefinitions];
  runtime.pipelineDefinitions = [...pipelineDefinitions];
  runtime.invokePipelineStep = runOptions.invokePipelineStep;
  runtime.invokeActionStep = runOptions.invokeActionStep;
  runtime.consoleLines.length = 0;
  runtime.currentScriptPaths.length = 0;
}

function runLuaConsoleCommand(session, command, runOptions = {}, automationDefinitions = [], pipelineDefinitions = []) {
  syncConsoleRuntimeState(session.runtime, runOptions, automationDefinitions, pipelineDefinitions);
  installInstructionHook(session.L, session.runtime.limits);
  const scriptPath = normalizeWorkspacePath(runOptions.scriptPath ?? luaConsoleResourcePath);
  const baseTop = lua.lua_gettop(session.L);

  session.runtime.currentScriptPaths.push(scriptPath);
  try {
    pushPipelineValueTable(session.L, runOptions.input ?? createPipelineValue('text', ''));
    lua.lua_setglobal(session.L, to_luastring('input'));
    loadConsoleChunk(session.L, command, scriptPath);
    const callStatus = lua.lua_pcall(session.L, 0, lua.LUA_MULTRET, 0);
    if (callStatus !== lua.LUA_OK) {
      throw new Error(getLuaErrorMessage(session.L));
    }

    const resultCount = lua.lua_gettop(session.L) - baseTop;
    let rawValue;
    if (resultCount === 1) {
      rawValue = luaValueToJs(session.L, -1);
    } else if (resultCount > 1) {
      rawValue = [];
      for (let index = baseTop + 1; index <= lua.lua_gettop(session.L); index += 1) {
        rawValue.push(luaValueToJs(session.L, index));
      }
    }

    return {
      ok: true,
      diagnostics: [],
      value: resultCount > 0
        ? createPipelineValue('json', cloneJsonSafe(rawValue))
        : undefined,
      consoleLines: [...session.runtime.consoleLines],
    };
  } catch (error) {
    return {
      ok: false,
      value: createPipelineValue('diagnostics', []),
      diagnostics: [
        createLuaDiagnostic('lua.runtime-error', error?.message ?? 'Lua execution failed.'),
      ],
      consoleLines: [...session.runtime.consoleLines],
      definitions: [],
    };
  } finally {
    session.runtime.currentScriptPaths.pop();
    lua.lua_settop(session.L, baseTop);
  }
}

export function runLuaAutomationDefinition(definition, options = {}) {
  const inputValue = options.input?.kind
    ? options.input
    : createPipelineValue('text', options.input ?? '');
  if (!matchesValueContract(definition.input, inputValue.kind)) {
    return {
      ok: false,
      value: createPipelineValue('diagnostics', []),
      diagnostics: [
        createLuaDiagnostic(
          'lua.input-contract',
          `Lua automation "${definition.name}" expects ${definition.input.join(', ')} but received ${inputValue.kind}.`,
        ),
      ],
      consoleLines: [],
    };
  }

  return runLuaScript({
    ...options,
    mode: 'run',
    source: definition.source,
    scriptPath: definition.sourcePath,
    input: inputValue,
    expectedOutput: definition.output,
  });
}

export function discoverLuaAutomations(options = {}) {
  const automationFiles = listLuaAutomationFiles(options.workspace, options);
  const definitions = [];
  const diagnostics = [];
  const seenContributionIds = new Set();

  for (const file of automationFiles) {
    if (!file.enabled) {
      continue;
    }

    const result = runLuaScript({
      mode: 'discover',
      source: file.source,
      scriptPath: file.path,
      sourceResourceId: file.id,
      workspace: options.workspace,
      limits: options.limits,
    });
    if (!result.ok) {
      diagnostics.push(...result.diagnostics);
      continue;
    }

    if (result.definitions.length === 0) {
      diagnostics.push(createLuaDiagnostic(
        'lua.discovery.empty',
        `Lua automation file ${file.path} did not return a valid action descriptor.`,
        'warning',
      ));
    }

    for (const definition of result.definitions) {
      if (seenContributionIds.has(definition.contributionId)) {
        diagnostics.push(createLuaDiagnostic(
          'lua.discovery.duplicate',
          `Duplicate Lua automation contribution ID ${definition.contributionId} discovered in ${file.path}.`,
        ));
        continue;
      }

      seenContributionIds.add(definition.contributionId);
      definitions.push(definition);
    }
  }

  return {
    definitions,
    diagnostics,
  };
}

export function createLuaExecutionService(options = {}) {
  let automationDefinitions = [...(options.automationDefinitions ?? [])];
  let pipelineDefinitions = [...(options.pipelineDefinitions ?? [])];
  const consoleSessions = new Map();

  return {
    getAutomationDefinitions() {
      return [...automationDefinitions];
    },
    setAutomationDefinitions(definitions = []) {
      automationDefinitions = [...definitions];
      return this.getAutomationDefinitions();
    },
    setPipelineDefinitions(definitions = []) {
      pipelineDefinitions = [...definitions];
      return [...pipelineDefinitions];
    },
    runSnippet(runOptions = {}) {
      return runLuaScript({
        ...options,
        ...runOptions,
        automationDefinitions,
        pipelineDefinitions,
      });
    },
    runConsoleCommand(sessionKey, command, runOptions = {}) {
      const normalizedKey = String(sessionKey ?? 'default');
      let session = consoleSessions.get(normalizedKey);
      if (!session) {
        const runtime = createRuntimeContext({
          ...options,
          ...runOptions,
          automationDefinitions,
          pipelineDefinitions,
        });
        session = {
          runtime,
          L: createLuaState(runtime),
        };
        consoleSessions.set(normalizedKey, session);
      }

      return runLuaConsoleCommand(
        session,
        command,
        {
          ...options,
          ...runOptions,
        },
        automationDefinitions,
        pipelineDefinitions,
      );
    },
    runAutomation(automationId, runOptions = {}) {
      const definition = automationDefinitions.find((entry) =>
        entry.id === automationId || entry.contributionId === automationId || entry.name === automationId);
      if (!definition) {
        return {
          output: undefined,
          diagnostics: [createLuaDiagnostic('lua.automation.missing', `Unknown Lua automation: ${automationId}`)],
        };
      }

      const result = runLuaAutomationDefinition(definition, {
        ...options,
        ...runOptions,
        automationDefinitions,
        pipelineDefinitions,
      });
      return {
        output: result.value,
        diagnostics: result.diagnostics,
      };
    },
    discover(workspace, discoverOptions = {}) {
      const discovered = discoverLuaAutomations({
        ...options,
        ...discoverOptions,
        workspace,
      });
      automationDefinitions = [...discovered.definitions];
      return discovered;
    },
    createContributionManifest() {
      return createLuaContributionManifest({
        definitions: automationDefinitions,
        executionService: this,
      });
    },
  };
}
