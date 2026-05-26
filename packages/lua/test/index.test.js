import assert from 'node:assert/strict';
import test from 'node:test';

import { createPipelineValue } from '@textforge/core';
import { createWorkspaceService } from '@textforge/workspace';

import {
  createLuaContributionManifest,
  createLuaExecutionService,
  defaultLuaExecutionLimits,
  discoverLuaAutomations,
  isLuaAutomationPath,
  listLuaAutomationFiles,
  resolveLuaModuleCandidatePaths,
  runLuaScript,
} from '../src/index.js';

function createWorkspace() {
  return createWorkspaceService({
    workspaceId: 'lua-tests',
    name: 'Lua Tests',
    now: () => '2026-05-26T00:00:00.000Z',
  });
}

test('lua module resolution prefers sibling modules before shared workspace roots', () => {
  const candidates = resolveLuaModuleCandidatePaths('/lua/main.lua', 'helpers');
  assert.deepEqual(candidates, [
    '/lua/helpers.lua',
    '/lua/helpers/init.lua',
    '/lua/helpers.lua',
    '/lua/helpers/init.lua',
    '/lib/helpers.lua',
    '/lib/helpers/init.lua',
    '/.textforge/automation/lua/helpers.lua',
    '/.textforge/automation/lua/helpers/init.lua',
  ].filter((candidate, index, values) => values.indexOf(candidate) === index));
});

test('manual Lua execution can require workspace modules and emit text output', () => {
  const workspace = createWorkspace();
  workspace.createFolder({ path: '/lua', title: 'lua' });
  workspace.createTextResource({
    path: '/lua/helpers.lua',
    text: 'return { shout = function(text) return string.upper(text) end }',
    languageId: 'lua',
    mimeType: 'text/x-lua',
  });

  const result = runLuaScript({
    workspace,
    scriptPath: '/lua/main.lua',
    source: [
      'local helpers = require("helpers")',
      'return function(input)',
      '  return input:emit_text("lua", helpers.shout(input.text))',
      'end',
    ].join('\n'),
    input: createPipelineValue('text', 'hello'),
  });

  assert.equal(result.ok, true);
  assert.equal(result.value?.kind, 'text');
  assert.equal(result.value?.value, 'HELLO');
});

test('automation discovery only scans the reserved automation root and subfolders', () => {
  const workspace = createWorkspace();
  workspace.createFolder({ path: '/lua', title: 'lua' });
  workspace.createFolder({ path: '/.textforge', title: '.textforge' });
  workspace.createFolder({ path: '/.textforge/automation', title: 'automation' });
  workspace.createFolder({ path: '/.textforge/automation/lua', title: 'lua' });
  workspace.createFolder({ path: '/.textforge/automation/lua/transforms', title: 'transforms' });
  workspace.createTextResource({
    path: '/lua/main.lua',
    text: 'return function(input) return input end',
    languageId: 'lua',
    mimeType: 'text/x-lua',
  });
  workspace.createTextResource({
    path: '/.textforge/automation/lua/transforms/uppercase.lua',
    text: [
      'return {',
      '  id = "uppercase-itm",',
      '  name = "Uppercase ITM",',
      '  input = "text",',
      '  output = "text",',
      '  run = function(input)',
      '    return input:emit_text("lua", string.upper(input.text))',
      '  end',
      '}',
    ].join('\n'),
    languageId: 'lua',
    mimeType: 'text/x-lua',
  });

  assert.equal(isLuaAutomationPath('/lua/main.lua'), false);
  assert.equal(listLuaAutomationFiles(workspace).length, 1);

  const discovered = discoverLuaAutomations({ workspace });
  assert.equal(discovered.diagnostics.length, 0);
  assert.equal(discovered.definitions.length, 1);
  assert.equal(discovered.definitions[0]?.name, 'Uppercase ITM');
  assert.equal(discovered.definitions[0]?.sourcePath, '/.textforge/automation/lua/transforms/uppercase.lua');
});

test('runtime reports blocked modules, blocked globals, and hard instruction limits', () => {
  const blockedRequire = runLuaScript({
    scriptPath: '/lua/blocked.lua',
    source: 'return require("socket")',
  });
  assert.equal(blockedRequire.ok, false);
  assert.equal(blockedRequire.diagnostics[0]?.code, 'lua.runtime-error');
  assert.match(blockedRequire.diagnostics[0]?.message ?? '', /Blocked Lua module request: socket/i);

  const blockedGlobal = runLuaScript({
    scriptPath: '/lua/browser.lua',
    source: 'return fetch("https://example.com")',
  });
  assert.equal(blockedGlobal.ok, false);
  assert.match(blockedGlobal.diagnostics[0]?.message ?? '', /Blocked browser API: fetch/i);

  const timeout = runLuaScript({
    scriptPath: '/lua/loop.lua',
    source: 'while true do end',
    limits: {
      ...defaultLuaExecutionLimits,
      maxInstructions: 10_000,
      instructionHookInterval: 100,
    },
  });
  assert.equal(timeout.ok, false);
  assert.match(timeout.diagnostics[0]?.message ?? '', /instruction limit/i);
});

test('console sessions keep globals across commands and treat bare expressions as results', () => {
  const workspace = createWorkspace();
  const service = createLuaExecutionService();

  const printed = service.runConsoleCommand('console', 'print(2 + 2)', {
    workspace,
    scriptPath: '/.textforge/runtime/lua-console.session',
  });
  assert.equal(printed.ok, true);
  assert.deepEqual(printed.diagnostics, []);
  assert.equal(printed.consoleLines[0]?.text, '4');
  assert.equal(printed.value, undefined);

  const assigned = service.runConsoleCommand('console', 'a = 5', {
    workspace,
    scriptPath: '/.textforge/runtime/lua-console.session',
  });
  assert.equal(assigned.ok, true);
  assert.deepEqual(assigned.diagnostics, []);
  assert.equal(assigned.value, undefined);

  const evaluated = service.runConsoleCommand('console', 'a', {
    workspace,
    scriptPath: '/.textforge/runtime/lua-console.session',
  });
  assert.equal(evaluated.ok, true);
  assert.deepEqual(evaluated.diagnostics, []);
  assert.equal(evaluated.value?.kind, 'json');
  assert.equal(evaluated.value?.value, 5);
});

test('execution service materializes discovered automations into contribution manifests', () => {
  const workspace = createWorkspace();
  workspace.createFolder({ path: '/.textforge', title: '.textforge' });
  workspace.createFolder({ path: '/.textforge/automation', title: 'automation' });
  workspace.createFolder({ path: '/.textforge/automation/lua', title: 'lua' });
  workspace.createTextResource({
    path: '/.textforge/automation/lua/uppercase.lua',
    text: [
      'return {',
      '  id = "uppercase",',
      '  name = "Uppercase",',
      '  input = "text",',
      '  output = "text",',
      '  run = function(input)',
      '    return input:emit_text("lua", string.upper(input.text))',
      '  end',
      '}',
    ].join('\n'),
    languageId: 'lua',
    mimeType: 'text/x-lua',
  });

  const service = createLuaExecutionService();
  const discovered = service.discover(workspace);
  assert.equal(discovered.definitions.length, 1);

  const manifest = service.createContributionManifest();
  assert.equal(manifest.packageId, '@textforge/lua');
  assert.equal(manifest.pipelines.length, 1);

  const directManifest = createLuaContributionManifest({
    definitions: discovered.definitions,
    executionService: service,
  });
  assert.equal(directManifest.commands.some((command) => command.id === 'lua.open-console'), true);
});

test('bundled tf modules run nested pipelines and actions and surface console inspection', () => {
  const workspace = createWorkspace();
  const result = runLuaScript({
    workspace,
    scriptPath: '/lua/main.lua',
    source: [
      'local tf = require("tf")',
      'local pipeline = require("tf.pipeline")',
      'local actions = require("tf.actions")',
      'local console = require("tf.console")',
      'return function(input)',
      '  local doubled = pipeline.run("double-text", input)',
      '  local final = actions.run("append-bang", doubled)',
      '  console.inspect({ pipelines = pipeline.list(), actions = actions.list() })',
      '  return tf.emit_json({',
      '    value = final.value,',
      '    pipelineKind = doubled.kind,',
      '    actionKind = final.kind,',
      '  })',
      'end',
    ].join('\n'),
    input: createPipelineValue('text', 'go'),
    pipelineDefinitions: [{
      id: 'double-text',
      contributionId: '@textforge/lua/automation-double-text',
      localName: 'double-text',
      name: 'Double text',
      category: 'Lua Automation',
      input: ['text'],
      output: 'text',
      description: 'Duplicate the incoming text.',
      sourcePath: '/.textforge/automation/lua/double-text.lua',
      source: 'return function(input) return input:emit_text("plaintext", input.text .. input.text) end',
    }],
    automationDefinitions: [{
      id: 'append-bang',
      contributionId: '@textforge/lua/automation-append-bang',
      localName: 'append-bang',
      name: 'Append bang',
      category: 'Lua Automation',
      input: ['text'],
      output: 'text',
      description: 'Append punctuation to the incoming text.',
      sourcePath: '/.textforge/automation/lua/append-bang.lua',
      source: 'return function(input) return input:emit_text("plaintext", input.text .. "!") end',
    }],
  });

  assert.equal(result.ok, true);
  assert.equal(result.value?.kind, 'json');
  assert.equal(result.value?.value?.value, 'gogo!');
  assert.equal(result.value?.value?.pipelineKind, 'text');
  assert.equal(result.value?.value?.actionKind, 'text');
  assert.equal(result.consoleLines[0]?.kind, 'inspect');
  assert.match(result.consoleLines[0]?.text ?? '', /Double text/);
  assert.match(result.consoleLines[0]?.text ?? '', /append-bang/);
});
