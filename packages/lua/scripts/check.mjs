import assert from 'node:assert/strict';

import {
  createLuaContributionManifest,
  createLuaExecutionService,
  defaultLuaExecutionLimits,
  luaBlockedGlobals,
  luaBlockedModules,
} from '../src/index.js';

assert.equal(createLuaContributionManifest().packageId, '@textforge/lua');
assert.equal(createLuaExecutionService().getAutomationDefinitions().length, 0);
assert.equal(defaultLuaExecutionLimits.maxInstructions > 0, true);
assert.equal(luaBlockedGlobals.includes('fetch'), true);
assert.equal(luaBlockedModules.includes('socket'), true);

console.info('lua package checks passed');
