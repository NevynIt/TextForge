import {
  createLuaDiagnostic,
} from './diagnostics.js';
import {
  runLuaScript,
} from './runtime.js';
import {
  listLuaAutomationFiles,
} from './workspace-modules.js';

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
