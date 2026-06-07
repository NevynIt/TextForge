import {
  contributions as coreContributions,
  createCommandRegistry,
  createContributionRegistry,
} from '@textforge/core';
import { contributions as workspaceContributionPack } from '@textforge/workspace';
import { createSurfaceContributionManifest, createSurfaceRegistry } from '@textforge/surfaces';
import { contributions as editorContributionPack } from '@textforge/editors';
import { contributions as assetContributionPack } from '@textforge/assets';
import { contributions as bpmnContributionPack } from '@textforge/bpmn';
import { contributions as eaViewerContributionPack } from '@textforge/ea-viewer';
import { contributions as pipelineContributionPack } from '@textforge/pipeline';
import { contributions as diagramContributionPack } from '@textforge/diagrams';
import { contributions as markdownContributionPack } from '@textforge/markdown';
import { contributions as itmContributionPack } from '@textforge/itm';
import { contributions as tablesContributionPack } from '@textforge/tables';
import { contributions as cytoscapeRendererContributionPack } from '@textforge/renderer-cytoscape';
import { contributions as jsmindRendererContributionPack } from '@textforge/renderer-jsmind';
import { contributions as sigmaRendererContributionPack } from '@textforge/renderer-sigma';
import { contributions as securityProfileContributionPack } from '@textforge/security-profile';
import { contributions as luaContributionPack } from '@textforge/lua';
import { contributions as uiContributionPack } from '@textforge/ui';

export function createWorkbenchRegistries() {
  const contributionRegistry = createContributionRegistry([
    coreContributions,
    workspaceContributionPack,
    editorContributionPack,
    assetContributionPack,
    bpmnContributionPack,
    eaViewerContributionPack,
    pipelineContributionPack,
    diagramContributionPack,
    markdownContributionPack,
    itmContributionPack,
    tablesContributionPack,
    cytoscapeRendererContributionPack,
    jsmindRendererContributionPack,
    sigmaRendererContributionPack,
    luaContributionPack,
    uiContributionPack,
    securityProfileContributionPack,
  ]);
  const resolvedDefaultContributions = contributionRegistry.resolve();
  const surfaceRegistry = createSurfaceRegistry(
    resolvedDefaultContributions.surfaces.filter((contribution) =>
      contribution.status !== 'failed' && contribution.status !== 'disabled'),
  );
  contributionRegistry.registerManifest(createSurfaceContributionManifest(surfaceRegistry.list()));
  const commandRegistry = createCommandRegistry(contributionRegistry.listManifests());

  return {
    commandRegistry,
    contributionRegistry,
    resolvedDefaultContributions,
    surfaceRegistry,
  };
}
