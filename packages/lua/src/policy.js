export const packageId = '@textforge/lua';
export const luaLanguageId = 'lua';
export const defaultAutomationRoot = '/.textforge/automation/lua';
export const defaultInstructionHookInterval = 1_000;

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
