import {
  createCommand,
  createContributionManifest,
} from '@textforge/core';

export const workspaceCommandContributions = [
  createCommand('workspace.new-folder', 'New folder...', {
    category: 'workspace',
    description: 'Create a folder in the selected workspace context.',
    keywords: ['workspace', 'create', 'folder', 'directory'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 10 },
    toolbar: { order: 20, kind: 'primary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.new-resource', 'New resource...', {
    category: 'workspace',
    description: 'Create a text resource in the selected workspace context.',
    keywords: ['workspace', 'create', 'resource', 'file', 'text'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 20 },
    toolbar: { order: 30, kind: 'primary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.upload-file', 'Upload file to selected folder...', {
    category: 'workspace',
    description: 'Upload a local file into the selected workspace folder without replacing the whole workspace.',
    keywords: ['workspace', 'upload', 'file', 'import'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 25 },
    toolbar: { order: 35, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.import-workspace', 'Import workspace dump ZIP...', {
    category: 'workspace',
    description: 'Import a workspace archive into the browser-managed workspace.',
    keywords: ['workspace', 'import', 'zip', 'archive', 'dump'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 30 },
    toolbar: { order: 40, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.import-folder-zip', 'Import ZIP as folder...', {
    category: 'workspace',
    description: 'Import a plain ZIP file into the selected folder context without requiring a TextForge workspace manifest.',
    keywords: ['workspace', 'import', 'folder', 'zip', 'upload'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 35 },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-workspace', 'Download workspace dump ZIP', {
    category: 'workspace',
    description: 'Export the current browser-managed workspace as a ZIP archive.',
    keywords: ['workspace', 'export', 'zip', 'archive', 'download', 'dump'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 40 },
    toolbar: { order: 50, kind: 'secondary' },
    when: { workspaceReady: true },
  }),
  createCommand('workspace.export-selected-folder', 'Download selected folder as ZIP', {
    category: 'workspace',
    description: 'Download the selected folder subtree as a plain ZIP file tree without TextForge workspace metadata.',
    keywords: ['workspace', 'export', 'folder', 'zip', 'archive', 'download'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 50 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder'],
      selectionCapabilityIds: ['resource.export'],
    },
  }),
  createCommand('workspace.download-selected-file', 'Download selected file', {
    category: 'workspace',
    description: 'Download the selected workspace file directly without exporting the whole workspace.',
    keywords: ['workspace', 'download', 'export', 'file'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 55 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionCapabilityIds: ['resource.export'],
    },
  }),
  createCommand('workspace.copy-selected-resource', 'Copy selected resource into workspace', {
    category: 'workspace',
    description: 'Create an editable workspace copy of the selected provider-backed resource.',
    keywords: ['workspace', 'copy', 'resource', 'provider', 'bundled'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 58 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['resource'],
      selectionCapabilityIds: ['resource.copy'],
    },
  }),
  createCommand('workspace.rename-selected', 'Rename selected item...', {
    category: 'workspace',
    description: 'Rename the currently selected folder or resource.',
    keywords: ['workspace', 'rename', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 60 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder', 'resource'],
      selectionCapabilityIds: ['resource.rename'],
    },
  }),
  createCommand('workspace.delete-selected', 'Delete selected item...', {
    category: 'workspace',
    description: 'Delete the currently selected folder or resource.',
    keywords: ['workspace', 'delete', 'remove', 'selected'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 70 },
    when: {
      workspaceReady: true,
      selectionRequired: true,
      selectionKinds: ['folder', 'resource'],
      selectionCapabilityIds: ['resource.delete'],
    },
  }),
  createCommand('workspace.reset-storage', 'Reset browser workspace...', {
    category: 'workspace',
    description: 'Open the explicit browser-storage reset flow for the persisted workspace.',
    keywords: ['workspace', 'storage', 'reset', 'recovery'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 80 },
    when: { runtimeStatuses: ['ready', 'error'] },
  }),
  createCommand('workspace.retry-storage', 'Retry workspace load', {
    category: 'workspace',
    description: 'Retry browser-managed workspace initialization after a storage failure.',
    keywords: ['workspace', 'retry', 'storage', 'recovery'],
    menu: { id: 'workspace', label: 'Workspace', groupOrder: 10, order: 90 },
    when: { runtimeStatuses: ['error'] },
  }),
];

export function createWorkspaceContributionManifest() {
  return createContributionManifest('@textforge/workspace', {
    commands: workspaceCommandContributions,
  });
}

export const workspaceContribution = createWorkspaceContributionManifest();

export const contributions = workspaceContribution;
