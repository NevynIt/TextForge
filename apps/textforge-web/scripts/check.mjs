import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createBrowserStorageBoundaryCheck,
  createForbiddenBrowserApiCheck,
  createForbiddenFilesystemApiCheck,
  createLocalCommandDispatchCheck,
  createLocalUiStateBoundaryCheck,
  createOpenSourceLicenseGate,
  createVisualIdentityBoundaryCheck,
  defaultSecurityProfile,
} from '@textforge/security-profile';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const indexHtml = await readFile(resolve(rootDir, 'index.html'), 'utf8');
const fileIndexHtml = await readFile(resolve(rootDir, 'public/index.html'), 'utf8');
const mainJs = await readFile(resolve(rootDir, 'src/main.js'), 'utf8');
const scriptLoaderJs = await readFile(resolve(rootDir, 'src/scriptLoader.js'), 'utf8');
const workbenchJs = await readFile(resolve(rootDir, 'src/workbench.js'), 'utf8');
const viteConfig = await readFile(resolve(rootDir, 'vite.config.mjs'), 'utf8');
const packageJson = await readFile(resolve(rootDir, 'package.json'), 'utf8');
const uiPackageJson = await readFile(resolve(rootDir, '..', '..', 'packages', 'ui', 'package.json'), 'utf8');
const storageBoundaryDoc = await readFile(resolve(rootDir, '..', '..', 'docs', 'specs', 'browser-managed-workspace-storage.md'), 'utf8');
const commandDispatchDoc = await readFile(resolve(rootDir, '..', '..', 'docs', 'specs', 'local-command-dispatch.md'), 'utf8');
const localUiStateDoc = await readFile(resolve(rootDir, '..', '..', 'docs', 'specs', 'local-shell-ui-state.md'), 'utf8');
const resourceIdentityDoc = await readFile(resolve(rootDir, '..', '..', 'docs', 'specs', 'resource-identity-badges.md'), 'utf8');

if (!indexHtml.includes('./src/scriptLoader.js')) {
  throw new Error('index.html must load ./src/scriptLoader.js as the development entrypoint');
}

if (indexHtml.includes('type="module"') && indexHtml.includes('./src/scriptLoader.js') && fileIndexHtml.includes('type="module"')) {
  throw new Error('public/index.html must not use module scripts for the file-launch artifact');
}

if (!fileIndexHtml.includes('./assets/textforge-loader.js')) {
  throw new Error('public/index.html must load the classic textforge loader bundle');
}

if (!fileIndexHtml.includes('./assets/textforge.css')) {
  throw new Error('public/index.html must load the built shell stylesheet');
}

if (!scriptLoaderJs.includes('./styles.css') || !scriptLoaderJs.includes('./main.js') || !scriptLoaderJs.includes('DOMContentLoaded')) {
  throw new Error('scriptLoader.js must own shell styles and defer the main bootstrap until the DOM is ready');
}

if (!mainJs.includes('./workbench.js') || !mainJs.includes('bootTextForgeShell') || !mainJs.includes('mountTextForgeShell')) {
  throw new Error('main.js must expose the package-driven workbench bootstrap helper');
}

if (!viteConfig.includes("base: './'")) {
  throw new Error('vite.config.mjs must use base ./ so the built shell works from file://');
}

if (!viteConfig.includes("formats: ['iife']") || !viteConfig.includes("fileName: () => 'assets/textforge-loader.js'")) {
  throw new Error('vite.config.mjs must emit a deterministic classic loader bundle for file:// launch');
}

if (!viteConfig.includes('cssCodeSplit: false') || !viteConfig.includes("cssFileName: 'textforge'")) {
  throw new Error('vite.config.mjs must emit a single stylesheet for the file-launch artifact');
}

for (const requiredImport of [
  '@textforge/workspace',
  '@textforge/surfaces',
  '@textforge/editors',
  '@textforge/assets',
  '@textforge/pipeline',
  '@textforge/diagrams',
  '@textforge/markdown',
  '@textforge/lua',
  '@textforge/ui',
  '@textforge/security-profile',
]) {
  if (requiredImport !== '@textforge/security-profile' && !workbenchJs.includes(requiredImport)) {
    throw new Error(`workbench.js must import ${requiredImport}`);
  }
}

for (const requiredReactSignal of [
  "from 'react'",
  "from 'react-dom/client'",
  'useSyncExternalStore',
  'createContributionRegistry',
  'createCommandRegistry',
  'createCommandDispatcher',
  'TextForgeAppFrame',
  'TextForgeCallout',
  'TextForgeCommandPalette',
  'TextForgePopupHost',
  'TextForgeTopBar',
  'TextForgeWorkspaceSidebar',
  'TextForgeUtilityPane',
  'createMainSessionTabStrip',
  'markdownPreviewSurfaceContribution',
  'renderMarkdownDocument',
]) {
  if (!workbenchJs.includes(requiredReactSignal)) {
    throw new Error(`workbench.js must include ${requiredReactSignal} for the React shell`);
  }
}

if (!workbenchJs.includes('createOpenWithSelection') || !workbenchJs.includes('listTextEditorLanguageModes') || !workbenchJs.includes('TextForgeSelectField')) {
  throw new Error('workbench.js must preserve package-backed open-with and language control chrome');
}

for (const requiredPhase5Signal of ['resolveDocumentContext', 'createContributionInspectorModel', 'parseMarkdownCapabilityRequirements', 'Registry overview', 'Active capability routing', 'Inspector diagnostics', '%require']) {
  if (!workbenchJs.includes(requiredPhase5Signal)) {
    throw new Error(`workbench.js must surface ${requiredPhase5Signal} for the WP-05B/WP-05D capability inspector flow`);
  }
}

for (const requiredPhase34Signal of ['TextForgeResourceBadge', 'TextForgeInspectorCard', 'TextForgeEmptyState', 'badge repair']) {
  if (!workbenchJs.includes(requiredPhase34Signal)) {
    throw new Error(`workbench.js must surface ${requiredPhase34Signal} for the Phase 3.4 readability pass`);
  }
}

if (!workbenchJs.includes('createContributionRegistry') || !workbenchJs.includes('createSurfaceContributionManifest')) {
  throw new Error('workbench.js must build the shell command registry from registered package contribution manifests');
}

for (const forbiddenPhase41Bypass of ['createWorkspaceContributionManifest', 'createEditorContributionManifest', 'createAssetContributionManifest', 'createMarkdownContributionManifest', 'createDiagramFenceHandlers']) {
  if (workbenchJs.includes(forbiddenPhase41Bypass)) {
    throw new Error(`workbench.js must not bypass the Phase 4.1 registration path with ${forbiddenPhase41Bypass}`);
  }
}

if (!workbenchJs.includes('createPersistedWorkspaceService') || !workbenchJs.includes('resetWorkspaceDexieStorage')) {
  throw new Error('workbench.js must hydrate the workspace through the persisted Dexie service and expose reset recovery flow');
}

if (!workbenchJs.includes("utilityPaneOpen: true") || !workbenchJs.includes("workspaceTreeCollapsed: false") || !workbenchJs.includes("utilitySectionId: 'inspector'")) {
  throw new Error('workbench.js must initialize the right panel open on the inspector section and the workspace tree expanded');
}

for (const requiredPhase35Signal of ['Popup Summary', 'Browser Storage', 'closeActivePopupSurface', 'toggleWorkspaceFolder']) {
  if (!workbenchJs.includes(requiredPhase35Signal)) {
    throw new Error(`workbench.js must surface ${requiredPhase35Signal} for the Phase 3.5 shell usability pass`);
  }
}

for (const requiredPhase4Signal of ['Markdown preview', 'generated diagram', 'TF-MD', 'local image resolution']) {
  if (!workbenchJs.includes(requiredPhase4Signal)) {
    throw new Error(`workbench.js must surface ${requiredPhase4Signal} for the Phase 4 Markdown/diagram slice`);
  }
}

for (const requiredLuaSignal of ['Lua Console', 'Reload Lua automation pipelines', 'xterm', 'lua.open-console']) {
  if (!workbenchJs.includes(requiredLuaSignal)) {
    throw new Error(`workbench.js must surface ${requiredLuaSignal} for WP-LUA`);
  }
}

for (const requiredDependency of ['"react"', '"react-dom"', '"@textforge/security-profile"', '"@textforge/workspace"', '"@textforge/lua"']) {
  if (!packageJson.includes(requiredDependency)) {
    throw new Error(`package.json must declare ${requiredDependency} for the Phase 3.1 shell`);
  }
}

for (const requiredUiDependency of ['"lucide-react"', '"react-resizable-panels"']) {
  if (!uiPackageJson.includes(requiredUiDependency)) {
    throw new Error(`@textforge/ui must declare ${requiredUiDependency} for the delivered shell chrome`);
  }
}

if (packageJson.includes('"lucide-react"') || workbenchJs.includes("lucide-react")) {
  throw new Error('apps/textforge-web must consume icon-bearing UI components instead of directly importing lucide-react');
}

for (const forbiddenApi of ['showOpenFilePicker', 'showDirectoryPicker', 'showSaveFilePicker', 'navigator.serviceWorker.register', 'BackgroundSync']) {
  if (workbenchJs.includes(forbiddenApi)) {
    throw new Error(`workbench.js must not introduce ${forbiddenApi}`);
  }
}

for (const requiredStorageSignal of ['IndexedDB', 'browser-managed', 'Reset Browser Workspace']) {
  if (!workbenchJs.includes(requiredStorageSignal)) {
    throw new Error(`workbench.js must surface ${requiredStorageSignal} storage-boundary wording`);
  }
}

for (const requiredCommandSignal of ['Command palette', 'local command', 'contribution-driven']) {
  if (!workbenchJs.includes(requiredCommandSignal)) {
    throw new Error(`workbench.js must surface ${requiredCommandSignal} command-layer wording`);
  }
}

for (const requiredUiStateSignal of ['popup overlays', 'local ui state', 'resizable right panel']) {
  if (!workbenchJs.toLowerCase().includes(requiredUiStateSignal)) {
    throw new Error(`workbench.js must surface ${requiredUiStateSignal} wording for Phase 3.5`);
  }
}

for (const requiredDocSignal of ['IndexedDB', 'File System Access API', 'background sync', 'remote sync']) {
  if (!storageBoundaryDoc.includes(requiredDocSignal)) {
    throw new Error(`browser-managed-workspace-storage.md must document ${requiredDocSignal}`);
  }
}

for (const requiredDocSignal of ['local command', 'external packages', 'remote commands', 'plugin manager']) {
  if (!commandDispatchDoc.toLowerCase().includes(requiredDocSignal)) {
    throw new Error(`local-command-dispatch.md must document ${requiredDocSignal}`);
  }
}

for (const requiredDocSignal of ['popup overlays', 'panel sizing', 'detached browser windows', 'remote sync']) {
  if (!localUiStateDoc.toLowerCase().includes(requiredDocSignal)) {
    throw new Error(`local-shell-ui-state.md must document ${requiredDocSignal}`);
  }
}

for (const requiredDocSignal of ['lucide-react', 'deterministic', 'remote images', 'filesystem-derived identity', 'user-provided images']) {
  if (!resourceIdentityDoc.toLowerCase().includes(requiredDocSignal)) {
    throw new Error(`resource-identity-badges.md must document ${requiredDocSignal}`);
  }
}

assertSecurityEnvelope();

console.info('TextForge web shell checks passed.');

function assertSecurityEnvelope() {
  const dependencies = [
    { name: 'react', license: 'MIT' },
    { name: 'react-dom', license: 'MIT' },
  ];

  if (!createOpenSourceLicenseGate().run({
    profile: defaultSecurityProfile,
    dependencies,
  }).passed) {
    throw new Error('React dependencies must satisfy the security profile license gate');
  }

  if (createForbiddenBrowserApiCheck().run({
    profile: defaultSecurityProfile,
    privilegedApis: [],
  }).passed !== true) {
    throw new Error('The shell should not require privileged browser APIs');
  }

  if (createForbiddenFilesystemApiCheck().run({
    profile: defaultSecurityProfile,
    filesystemApis: [],
  }).passed !== true) {
    throw new Error('The shell should not require privileged filesystem APIs');
  }

  if (createBrowserStorageBoundaryCheck().run({
    profile: defaultSecurityProfile,
    storageBoundary: {
      documented: true,
      browserManaged: true,
      mechanism: 'indexeddb',
      driver: 'dexie',
      databaseName: 'textforge-workspace',
      usesFilesystemAccess: false,
      usesDirectoryHandles: false,
      usesBackgroundSync: false,
      usesRemoteSync: false,
      usesSilentLocalFileAccess: false,
      notesUri: 'docs/specs/browser-managed-workspace-storage.md',
    },
  }).passed !== true) {
    throw new Error('The shell must keep the workspace inside the browser-managed storage boundary');
  }

  if (createVisualIdentityBoundaryCheck().run({
    profile: defaultSecurityProfile,
    visualIdentity: {
      documented: true,
      deterministic: true,
      usesLocalIcons: true,
      usesRemoteIcons: false,
      usesRemoteImages: false,
      usesFilesystemDerivedIdentity: false,
      usesUserProvidedImages: false,
      notesUri: 'docs/specs/resource-identity-badges.md',
    },
  }).passed !== true) {
    throw new Error('The shell must keep Phase 3.4 badges and icons local, deterministic, and browser-bounded');
  }

  if (createLocalCommandDispatchCheck().run({
    profile: defaultSecurityProfile,
    commandDispatch: {
      documented: true,
      localOnly: true,
      usesPluginExecution: false,
      usesRemoteExecution: false,
      notesUri: 'docs/specs/local-command-dispatch.md',
    },
  }).passed !== true) {
    throw new Error('The shell must keep Phase 3.3 command dispatch local and bundled');
  }

  if (createLocalUiStateBoundaryCheck().run({
    profile: defaultSecurityProfile,
    localUiState: {
      documented: true,
      localOnly: true,
      coversPopupOverlays: true,
      coversPanelSizing: true,
      usesDetachedWindows: false,
      usesRemoteContent: false,
      usesBackgroundSync: false,
      usesRemoteSync: false,
      usesFilesystemAccess: false,
      notesUri: 'docs/specs/local-shell-ui-state.md',
    },
  }).passed !== true) {
    throw new Error('The shell must keep popup and panel behavior inside local UI state only');
  }
}
