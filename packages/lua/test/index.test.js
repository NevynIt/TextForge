import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createPipelineValue } from '@textforge/core';
import { createWorkspaceService } from '@textforge/workspace';

import {
  applyLuaConsoleInputEdit,
  createLuaContributionManifest,
  createLuaExecutionService,
  defaultLuaExecutionLimits,
  discoverLuaAutomations,
  isLuaAutomationPath,
  normalizeLuaConsoleCursorOffset,
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

test('lua console input edits support cursor movement and in-line insertion', () => {
  const inserted = applyLuaConsoleInputEdit({
    currentInput: 'print()',
    cursorOffset: 6,
  }, {
    type: 'insert-text',
    text: '"ok"',
  });
  assert.equal(inserted.currentInput, 'print("ok")');
  assert.equal(inserted.cursorOffset, 10);

  const movedLeft = applyLuaConsoleInputEdit(inserted, {
    type: 'move-cursor',
    delta: -2,
  });
  assert.equal(movedLeft.cursorOffset, 8);

  const removed = applyLuaConsoleInputEdit(movedLeft, {
    type: 'backspace',
  });
  assert.equal(removed.currentInput, 'print("k")');
  assert.equal(removed.cursorOffset, 7);

  const deleted = applyLuaConsoleInputEdit({
    currentInput: 'abc',
    cursorOffset: 1,
  }, {
    type: 'delete-forward',
  });
  assert.equal(deleted.currentInput, 'ac');
  assert.equal(deleted.cursorOffset, 1);
});

test('lua console cursor offsets clamp to the available input range', () => {
  assert.equal(normalizeLuaConsoleCursorOffset('hello', undefined), 5);
  assert.equal(normalizeLuaConsoleCursorOffset('hello', -4), 0);
  assert.equal(normalizeLuaConsoleCursorOffset('hello', 99), 5);
});

test('power sessions self-elevate and expose approved host objects per console session', () => {
  const workspace = createWorkspace();
  workspace.createFolder({ path: '/docs', title: 'docs' });
  const service = createLuaExecutionService();
  const powerStates = [];
  const powerSession = {
    hostObjects: {
      workspace: {
        label: 'Workspace',
        description: 'Workspace mutation helpers',
        api: {
          createTextResource(input) {
            return workspace.createTextResource({
              ...input,
              languageId: input.languageId ?? 'plaintext',
              mimeType: input.mimeType ?? 'text/plain',
            });
          },
          getEntryByPath(path) {
            return workspace.getEntryByPath(path);
          },
        },
      },
    },
    onStateChange(state) {
      powerStates.push(state);
    },
  };

  const beforeElevation = service.runConsoleCommand('power-console', 'return require("tf.power").status()', {
    workspace,
    scriptPath: '/.textforge/runtime/lua-console.session',
    powerSession,
  });
  assert.equal(beforeElevation.ok, true);
  assert.equal(beforeElevation.session?.elevated, false);
  assert.equal(beforeElevation.session?.availableHostObjects[0]?.id, 'workspace');

  const elevated = service.runConsoleCommand('power-console', [
    'local power = require("tf.power")',
    'power.elevate()',
    'local ws = power.workspace()',
    'ws.createTextResource({ path = "/docs/power-note.md", title = "power-note.md", text = "hello power", languageId = "markdown", mimeType = "text/markdown" })',
    'local resource = ws.getEntryByPath("/docs/power-note.md")',
    'return resource.path',
  ].join('\n'), {
    workspace,
    scriptPath: '/.textforge/runtime/lua-console.session',
    powerSession,
  });
  assert.equal(elevated.ok, true);
  assert.equal(elevated.value?.value, '/docs/power-note.md');
  assert.equal(elevated.session?.elevated, true);
  assert.equal(workspace.getEntryByPath('/docs/power-note.md')?.text, 'hello power');
  assert.equal(powerStates.at(-1)?.elevated, true);
  assert.equal(service.getConsoleSessionState('power-console')?.elevated, true);
  assert.equal(service.getConsoleSessionState('sandbox-console'), undefined);
});

test('tf.pipeline.list only reflects supplied active pipeline definitions', () => {
  const result = runLuaScript({
    scriptPath: '/lua/list-pipelines.lua',
    source: [
      'local tf = require("tf")',
      'local pipeline = require("tf.pipeline")',
      'return function()',
      '  return tf.emit_json(pipeline.list())',
      'end',
    ].join('\n'),
    pipelineDefinitions: [{
      id: '@textforge/example/render-html',
      contributionId: '@textforge/example/render-html',
      localName: 'render-html',
      name: 'Render HTML',
      category: '@textforge/example',
      input: ['text'],
      output: 'html',
      description: 'Render the current document as HTML.',
      sourcePath: 'bundled:@textforge/example/render-html',
    }, {
      id: '@textforge/example/export-pdf',
      contributionId: '@textforge/example/export-pdf',
      localName: 'export-pdf',
      name: 'Export PDF',
      category: '@textforge/example',
      input: ['html'],
      output: 'pdf',
      description: 'Export the current document as PDF.',
      sourcePath: 'bundled:@textforge/example/export-pdf',
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
  assert.deepEqual(result.value?.value, ['render-html', 'export-pdf']);
});

test('console sessions refresh tf.pipeline.list when pipelineDefinitions change', () => {
  const service = createLuaExecutionService();
  const first = service.runConsoleCommand('console', 'return require("tf.pipeline").list()', {
    scriptPath: '/.textforge/runtime/lua-console.session',
    pipelineDefinitions: [{
      id: '@textforge/example/render-html',
      contributionId: '@textforge/example/render-html',
      localName: 'render-html',
      name: 'Render HTML',
      category: '@textforge/example',
      input: ['text'],
      output: 'html',
      sourcePath: 'bundled:@textforge/example/render-html',
    }],
  });
  const second = service.runConsoleCommand('console', 'return require("tf.pipeline").list()', {
    scriptPath: '/.textforge/runtime/lua-console.session',
    pipelineDefinitions: [{
      id: '@textforge/example/export-pdf',
      contributionId: '@textforge/example/export-pdf',
      localName: 'export-pdf',
      name: 'Export PDF',
      category: '@textforge/example',
      input: ['html'],
      output: 'pdf',
      sourcePath: 'bundled:@textforge/example/export-pdf',
    }],
  });

  assert.equal(first.ok, true);
  assert.deepEqual(first.value?.value, ['render-html']);
  assert.equal(second.ok, true);
  assert.deepEqual(second.value?.value, ['export-pdf']);
});

test('bundled pipeline definitions list in Lua but do not run unless a synchronous bridge is wired', () => {
  const unavailable = runLuaScript({
    scriptPath: '/lua/run-pipeline.lua',
    source: [
      'local pipeline = require("tf.pipeline")',
      'return function(input)',
      '  return pipeline.run("render-html", input)',
      'end',
    ].join('\n'),
    input: createPipelineValue('text', 'Hello'),
    pipelineDefinitions: [{
      id: '@textforge/example/render-html',
      contributionId: '@textforge/example/render-html',
      localName: 'render-html',
      name: 'Render HTML',
      category: '@textforge/example',
      input: ['text'],
      output: 'html',
      sourcePath: 'bundled:@textforge/example/render-html',
    }],
  });

  assert.equal(unavailable.ok, false);
  assert.match(unavailable.diagnostics[0]?.message ?? '', /not available in the current Lua runtime/i);

  const wired = runLuaScript({
    scriptPath: '/lua/run-pipeline.lua',
    source: [
      'local pipeline = require("tf.pipeline")',
      'return function(input)',
      '  return pipeline.run("render-html", input)',
      'end',
    ].join('\n'),
    input: createPipelineValue('text', 'Hello'),
    pipelineDefinitions: [{
      id: '@textforge/example/render-html',
      contributionId: '@textforge/example/render-html',
      localName: 'render-html',
      name: 'Render HTML',
      category: '@textforge/example',
      input: ['text'],
      output: 'html',
      sourcePath: 'bundled:@textforge/example/render-html',
    }],
    invokePipelineStep({ id, value }) {
      assert.equal(id, 'render-html');
      assert.equal(value?.text, 'Hello');
      return createPipelineValue('html', '<article>Hello</article>');
    },
  });

  assert.equal(wired.ok, true);
  assert.equal(wired.value?.kind, 'html');
  assert.equal(wired.value?.value, '<article>Hello</article>');
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
  assert.match(result.consoleLines[0]?.text ?? '', /double-text/);
  assert.match(result.consoleLines[0]?.text ?? '', /append-bang/);
});

test('power-session registry host objects return cloned read-only snapshots and listings', () => {
  const sharedRegistrySnapshot = {
    summary: {
      packageCount: 1,
      pipelineCount: 1,
    },
    document: {
      resourceId: 'doc-1',
    },
  };
  const sharedCommands = [{
    id: 'lua.open-console',
    kind: 'commands',
    label: 'Open Lua console',
  }];
  const sharedPipelines = [{
    id: '@textforge/example/render-html',
    kind: 'pipelines',
    label: 'Render HTML',
  }];
  const service = createLuaExecutionService();

  const result = service.runConsoleCommand('registry-console', [
    'local power = require("tf.power")',
    'power.elevate()',
    'local registry = power.registry()',
    'local snapshot = registry.snapshot()',
    'snapshot.summary.packageCount = 999',
    'local commands = registry.listCommands()',
    'commands[1].label = "mutated"',
    'local pipelines = registry.listPipelines()',
    'pipelines[1].label = "mutated pipeline"',
    'return {',
    '  snapshot = registry.snapshot(),',
    '  commands = registry.listCommands(),',
    '  pipelines = registry.listPipelines(),',
    '}',
  ].join('\n'), {
    scriptPath: '/.textforge/runtime/lua-console.session',
    powerSession: {
      hostObjects: {
        registry: {
          label: 'Registry',
          description: 'Read-only registry snapshot',
          api: {
            snapshot() {
              return sharedRegistrySnapshot;
            },
            listCommands() {
              return sharedCommands;
            },
            listPipelines() {
              return sharedPipelines;
            },
          },
        },
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.value?.value?.snapshot?.summary?.packageCount, 1);
  assert.equal(result.value?.value?.commands?.[0]?.label, 'Open Lua console');
  assert.equal(result.value?.value?.pipelines?.[0]?.label, 'Render HTML');
  assert.equal(sharedRegistrySnapshot.summary.packageCount, 1);
  assert.equal(sharedCommands[0]?.label, 'Open Lua console');
  assert.equal(sharedPipelines[0]?.label, 'Render HTML');
});

test('Lua guide only documents the shipped Lua surface', () => {
  const guide = readFileSync(new URL('../../../docs/guides/lua-guide.md', import.meta.url), 'utf8');

  for (const requiredSnippet of [
    'require("tf")',
    'tf.pipeline.list()',
    'tf.actions.list()',
    'tf.console.inspect(value)',
    'tf.power.registry()',
    'input:emit_text(languageId, text)',
    'input:emit_json(value)',
    'input:diagnostic(severity, message)',
    '1,000,000 instructions',
    '500 ms wall time',
    '2 MiB of console output',
    '8 nested Lua calls',
  ]) {
    assert.match(guide, new RegExp(requiredSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const unsupportedSnippet of [
    'tf.tree',
    'tf.graph',
    'tf.table',
    'tf.stringx',
    'tf.itm',
    'tf.markdown',
    'input:parse_itm',
    'input:parse_markdown',
    'input:parse_csv',
    'input:emit_itm',
    'input:emit_csv',
    'run_action(',
    'action("action-id")',
    'parse_itm()',
    'parse_markdown()',
    'parse_csv(delimiter?)',
  ]) {
    assert.equal(guide.includes(unsupportedSnippet), false);
  }
});
