import {
  createCapability,
  createCommand,
  createContributionManifest,
  createPipelineContribution,
  createResourcePredicate,
} from '@textforge/core';

import {
  luaConsoleResourceMimeType,
  luaConsoleSurfaceContribution,
} from './console.js';
import {
  createLuaExecutionService,
} from './execution-service.js';
import {
  luaCapabilityIds,
  luaLanguageId,
  packageId,
} from './policy.js';

export const luaCommandContributions = [
  createCommand('lua.open-console', 'Open Lua console', {
    category: 'lua',
    description: 'Open the local Lua console surface.',
    keywords: ['lua', 'console', 'prompt'],
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
