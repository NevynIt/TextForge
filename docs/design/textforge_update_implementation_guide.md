# TextForge Update Implementation Guide

## Purpose

This guide is for an implementation agent updating `NevynIt/TextForge` after the code-health review and follow-up decisions.

The objective is to make TextForge more maintainable, more explicit in plugin/pipeline behavior, and better aligned with the external `@textforge/itm` package.

## Decisions to implement

1. Keep ITM as an npm package dependency.
2. Remove the `external/ITM` Git submodule.
3. Move TextForge to `@textforge/itm` version `0.3.0`.
4. Pipeline ID conflicts are errors, not override points.
5. Users must be able to selectively enable/disable pipelines from plugins.
6. On plugin load, conflicting pipelines must be automatically disabled and surfaced as diagnostics/messages.
7. The Diagnostics and Plugins buttons must visibly indicate that something needs attention.
8. Remove the unused `disabled-plugin` status.
9. Linters must be discovered from declared contribution kind, not by `-linter` suffix.
10. ITM `%include` resolution belongs in the ITM library, with TextForge providing resolver functions.
11. Remove legacy local ITM parsing helpers that are no longer used.
12. All document changes, including filename/language/metadata changes, must increment document version.
13. Move toward a renderer registry and split the current viewer god module into submodules.
14. Include `verify:browser-no-network` in the default check path.
15. Refactor `App.tsx` early, before adding visual editing or write-back.

---

## Work package 1 — Remove the ITM submodule and use npm only

### Files likely affected

- `.gitmodules`
- `external/ITM`
- `package.json`
- `package-lock.json`
- docs mentioning the submodule, if any

### Required changes

1. Remove `.gitmodules`.
2. Remove `external/ITM` from the repository.
3. Update `package.json` dependency:

```json
"@textforge/itm": "^0.3.0"
```

4. Regenerate `package-lock.json`.
5. Ensure imports continue to use:

```ts
import { ... } from "@textforge/itm";
```

Do not import from `external/ITM`.

### Acceptance criteria

- No `.gitmodules` remains.
- No `external/ITM` path remains.
- `npm install` resolves `@textforge/itm@0.3.x`.
- `npm run check` passes.
- A repository search for `external/ITM` returns no code references.

---

## Work package 2 — Remove pipeline override behavior and introduce explicit pipeline conflict handling

### Current issue

`PluginRegistry.registerManifest()` currently writes pipelines into a map using `set()`. This silently overwrites duplicate IDs.

The new rule is:

> Pipeline IDs must be globally unique. If conflicts exist, TextForge must not silently override. The user must explicitly choose which pipeline is enabled.

### Desired behavior

When registering packaged manifests or loading plugins:

1. If a pipeline ID is already registered by another plugin, do not override it.
2. Keep the first registered pipeline active by default.
3. Register the conflicting pipeline as known but disabled.
4. Emit a plugin diagnostic or plugin warning explaining the conflict.
5. Show a visible attention indicator on the Plugins button.
6. If the conflict affects the active document or available actions, also make the Diagnostics button show attention.
7. In the Plugin Manager, allow the user to enable/disable individual pipelines.
8. If the user enables a disabled conflicting pipeline, automatically disable the other pipeline with the same ID, and show a clear message.

### Important distinction

Do **not** reintroduce `disabled-plugin`.

Plugin state remains about plugin loading. Pipeline enabled/disabled state is separate.

### Suggested model changes

Add a pipeline registry record instead of storing only `PipelineContribution`.

```ts
export interface RegisteredPipeline {
  pipeline: PipelineContribution;
  pluginId: string;
  enabled: boolean;
  disabledReason?: "user" | "conflict";
  conflictWith?: Array<{
    pluginId: string;
    pipelineId: string;
    pipelineName: string;
  }>;
}
```

Add plugin/pipeline diagnostics:

```ts
export interface PluginDiagnostic {
  id: string;
  source: "plugin-registry";
  severity: "error" | "warning" | "information" | "observation";
  pluginId?: string;
  pipelineId?: string;
  message: string;
  createdAt: string;
  acknowledged?: boolean;
}
```

Alternatively, reuse the existing `Diagnostic` shape, but it should be clear that these diagnostics are repository/plugin-level, not document-level.

### Files likely affected

- `src/core/pluginRegistry.ts`
- `src/domain/types.ts`, or split domain files if doing the refactor first
- `src/core/storage.ts`
- `src/components/PopupHost.tsx`
- Plugin Manager component, probably in `src/components` or `src/components/viewers.tsx`
- `src/app/App.tsx`
- tests for plugin registration and pipeline listing

### Required registry behavior

`PluginRegistry` should track:

- loaded plugins;
- contributions;
- all declared pipelines;
- active/enabled pipeline per pipeline ID;
- disabled/conflicting pipelines;
- plugin diagnostics.

Recommended API additions:

```ts
listPipelinesForLanguage(languageId: string): PipelineContribution[];
listRegisteredPipelines(): RegisteredPipeline[];
setPipelineEnabled(pluginId: string, pipelineId: string, enabled: boolean): void;
listPluginDiagnostics(): PluginDiagnostic[];
acknowledgePluginDiagnostic(id: string): void;
hasUnacknowledgedPluginDiagnostics(): boolean;
```

When `setPipelineEnabled(pluginId, pipelineId, true)` is called:

- enable the selected pipeline;
- find other registered pipelines with the same `pipeline.id`;
- disable them with reason `conflict`;
- emit/refresh a diagnostic explaining the active choice.

When disabling a pipeline manually:

- mark it disabled with reason `user`;
- remove it from `listPipelinesForLanguage()`.

### Storage requirements

Persist user pipeline enable/disable preferences.

Add to `PluginPreferences`:

```ts
export interface PluginPreferences {
  autoloadPluginIds: string[];
  disabledPipelines?: Array<{
    pluginId: string;
    pipelineId: string;
    reason?: "user" | "conflict";
  }>;
}
```

On startup:

1. Load plugin preferences.
2. Register manifests.
3. Apply stored pipeline preferences.
4. Load autoload plugins.
5. Resolve conflicts deterministically.
6. Surface any conflicts as plugin diagnostics.

### Conflict policy

Use deterministic default behavior:

- First registered pipeline wins.
- Later pipeline with same ID is disabled.
- Diagnostic explains which plugin/pipeline was disabled and which one remains active.

Example diagnostic message:

> Pipeline `view-itm-inspector` from plugin `itm-core` conflicts with pipeline `view-itm-inspector` from plugin `viewer-core`. The `itm-core` pipeline was disabled. Open Plugins to choose which pipeline should be active.

### Acceptance criteria

- Duplicate pipeline IDs are never silently overwritten.
- Only one pipeline with a given ID can be enabled at a time.
- Conflicting pipelines are visible in the Plugin Manager.
- User can explicitly choose which conflicting pipeline is enabled.
- Pipeline choices persist across reload.
- A conflict creates a visible plugin diagnostic.
- The Plugins button indicates unacknowledged plugin diagnostics.
- The Diagnostics button indicates there is something to verify when a conflict affects available actions.
- Tests cover duplicate pipeline registration and user enable/disable behavior.

---

## Work package 3 — Clarify `view-itm-inspector` ownership

### Decision rule

- If the contribution defines a generic viewer, it belongs in `viewer-core`.
- If the contribution transforms or parses ITM into an in-memory ITM model, it belongs in `itm-core`.

### Practical resolution

The pipeline `view-itm-inspector` consists of:

```ts
steps: ["itm-parse", "itm-inspector-viewer"]
```

This is a composed pipeline: ITM parsing comes from `itm-core`; the viewer comes from `viewer-core`.

Recommended ownership:

- `itm-inspector-viewer` contribution belongs in `viewer-core`, because it is a viewer.
- `itm-parse` belongs in `itm-core`, because it creates the in-memory ITM model.
- The pipeline definition should live in `itm-core`, because the pipeline is ITM-specific and depends on `itm-parse`.

Therefore:

1. Keep `itm-inspector-viewer` in `viewer-core`.
2. Keep `itm-parse` in `itm-core`.
3. Define `view-itm-inspector` only once, in `itm-core`.
4. Remove the duplicate pipeline definition from `viewer-core`.

### Acceptance criteria

- Only one `view-itm-inspector` pipeline is declared.
- The viewer contribution remains reusable.
- The ITM-specific pipeline is owned by ITM Core.

---

## Work package 4 — Remove `disabled-plugin`

### Files likely affected

- `src/domain/types.ts`
- `src/core/pluginRegistry.ts`
- `src/core/pipelineRunner.ts`
- UI code that displays plugin/pipeline status

### Required changes

1. Remove `"disabled-plugin"` from `PipelineStatus`.
2. Remove logic branches that mention disabled plugins.
3. Use pipeline-level enabled/disabled state instead.
4. Keep plugin states focused on loading only:

```ts
status: "available" | "loaded" | "failed"
```

### Acceptance criteria

- Search for `disabled-plugin` returns no active code references.
- Pipeline disabled state is represented separately.
- Tests still pass.

---

## Work package 5 — Discover linters by declared kind

### Current issue

Linters are discovered by contribution ID suffix, such as `-linter`.

### Required changes

Change `PluginRegistry.resolveLinters()` so it uses registered or declared contribution metadata, not ID naming.

Recommended approach:

1. Track contribution descriptors by ID at manifest registration time.
2. When a plugin is loaded, index actual contributions by `kind`.
3. For unloaded plugins, load candidate plugin if its manifest declares linter contribution IDs or contribution metadata.
4. Prefer improving `PluginManifestEntry` so it can declare contribution kinds:

```ts
contributions?: Array<{
  id: string;
  kind: ContributionKind;
}>;
```

For backward compatibility, support `contributionIds` during transition, but avoid relying on suffixes.

### Acceptance criteria

- A linter named `validate-json` works even without `-linter` suffix.
- Existing linters still work.
- Tests cover non-suffix linter IDs.

---

## Work package 6 — Wire TextForge to ITM include resolvers

### Target behavior

ITM include resolution is implemented in `@textforge/itm`.

TextForge provides resolver functions that allow the ITM library to resolve includes from open workspace documents and later from other sources.

### Required TextForge changes

In `src/parsers/itm.ts`, replace unused `includeDocuments` handling with a resolver bridge.

Suggested TextForge-side resolver shape:

```ts
function createWorkspaceItmResolver(documents: TextDocument[]): ItmIncludeResolver {
  return {
    async resolveInclude(request) {
      const document = findMatchingOpenDocument(request.target, documents);
      if (!document) {
        return undefined;
      }

      return {
        uri: document.fileName,
        text: document.text,
        metadata: {
          documentId: document.id,
          languageId: document.languageId,
          version: document.version
        }
      };
    }
  };
}
```

The exact type should come from the ITM library after the ITM guide is implemented.

### Required adapter behavior

`parseItmValue()` should pass the resolver to `@textforge/itm`:

```ts
parseDocumentResult(text, {
  uri: options.currentFileName,
  strict: false,
  includeResolver: createWorkspaceItmResolver(options.includeDocuments || [])
});
```

Use the actual ITM API name after implementation.

### Acceptance criteria

- TextForge no longer resolves includes itself.
- TextForge passes open documents to the ITM library through a resolver.
- `%include` works for open workspace documents.
- Circular/missing include diagnostics come from the ITM library.
- Tests cover include resolution from open TextForge documents.

---

## Work package 7 — Remove legacy local ITM parser helpers

### Current issue

`src/parsers/itm.ts` delegates parsing to `@textforge/itm`, but still contains older helpers for local parsing and include/style parsing.

### Required changes

Remove helpers that are no longer used after the ITM library is the source of truth.

Likely candidates, if unused:

- `parseNodeContent`
- `parseLinks`
- `parseAttributes`
- `collectStyleBlock`
- `parseStyleDirective`
- `parseStyleDeclarations`
- `parseIncludeTarget`
- `findIncludedDocument`
- include key helpers, if replaced by ITM resolver bridge

Keep helpers that are still required for projection to TextForge models:

- `parseItmValue`
- `parseIndentedTree`
- `indentedTreeToGraph`
- ITM-to-TextForge diagnostic mapping
- ITM-to-Tree/Graph projection
- style projection if still not handled by the ITM library

### Acceptance criteria

- `noUnusedLocals` can be enabled without ITM adapter failures.
- ITM parsing remains package-backed.
- Tree/graph projections still work.
- ITM pipeline tests pass.

---

## Work package 8 — Increment document version on all document changes

### Current issue

Text changes and language changes increment version, but filename changes do not.

### Required changes

In `WorkspaceManager`:

- `updateText()` increments `version`.
- `updateLanguage()` increments `version`.
- `updateFileName()` must also increment `version`.
- Any future metadata/identity update function must increment `version`.

### Acceptance criteria

- Renaming a document increments version.
- Popup follow-source refresh works after rename.
- Tests cover rename version increment.

---

## Work package 9 — Add visible attention indicators for Diagnostics and Plugins

### Required behavior

The UI must visibly show when there is something to verify.

Examples:

- Diagnostics button shows a badge/dot/count when document diagnostics or plugin diagnostics exist.
- Plugins button shows a badge/dot/count when plugin diagnostics exist, especially conflicts.
- The status bar may also show a short warning.

### Suggested UI state

Add derived values:

```ts
const hasPluginAttention = services.plugins.hasUnacknowledgedPluginDiagnostics();
const hasDiagnosticsAttention = hasDocumentDiagnostics || hasPluginAttention;
```

Potential button labels:

- `Diagnostics ●`
- `Plugins ●`

Or a small badge:

```tsx
<button class={hasDiagnosticsAttention ? "attention" : ""}>Diagnostics</button>
<button class={hasPluginAttention ? "attention" : ""}>Plugins</button>
```

### Required UX

Clicking Plugins should show the conflicting pipelines and the relevant diagnostic.

Clicking Diagnostics should show either document diagnostics or a combined diagnostics view including plugin/system diagnostics.

### Acceptance criteria

- Loading a conflicting plugin changes the Plugins button visually.
- The Diagnostics button also shows attention when the conflict needs verification.
- The Plugin Manager explains the conflict.
- The user can acknowledge or resolve the conflict.
- The indicator disappears only after the issue is resolved or acknowledged, according to the chosen UX.

---

## Work package 10 — Move toward a renderer registry

### Current issue

Viewer rendering appears centralized in broad viewer/popup modules. New viewer kinds currently tend to require edits to shared unions and central rendering logic.

### Target architecture

Introduce a renderer registry:

```ts
export interface ViewerRenderer<T = ViewerResult> {
  kind: string;
  canRender(result: ViewerResult): boolean;
  render(props: ViewerRendererProps<T>): JSX.Element;
}
```

Renderer modules register themselves:

```ts
registerViewerRenderer(htmlRenderer);
registerViewerRenderer(svgRenderer);
registerViewerRenderer(treeRenderer);
registerViewerRenderer(tableRenderer);
registerViewerRenderer(cytoscapeRenderer);
registerViewerRenderer(sigmaRenderer);
registerViewerRenderer(itmTreeRenderer);
registerViewerRenderer(bpmnRenderer);
```

### Suggested folder structure

```text
src/viewers/
  registry.ts
  types.ts
  html/
    HtmlViewer.tsx
    renderer.ts
  svg/
    SvgViewer.tsx
    renderer.ts
  tree/
    TreeViewer.tsx
    renderer.ts
  graph/
    cytoscape/
    sigma/
  itm/
    tree/
    mindmap/
    graph/
    inspector/
  bpmn/
```

### Required migration approach

1. Create renderer registry.
2. Move existing viewer render branches into renderer modules.
3. Keep a compatibility layer so existing `ViewerResult` still works.
4. Gradually reduce the central viewer god module.
5. Do not change plugin contribution behavior yet unless necessary.

### Acceptance criteria

- Adding a new viewer does not require editing a giant central `viewers.tsx` branch.
- Existing viewers still work.
- PopupHost delegates rendering through registry.
- Tests or smoke tests cover at least HTML, SVG, ITM tree, and graph viewer rendering.

---

## Work package 11 — Refactor `App.tsx` early

### Goal

Reduce `App.tsx` from orchestration god component to composition shell.

### Suggested hooks/services

```text
src/app/
  App.tsx
  useAppServices.ts
  useWorkspacePersistence.ts
  usePipelineActions.ts
  usePopupManager.ts
  useLuaActions.ts
  useSourceSelectionBridge.ts
  useAttentionState.ts
```

### Suggested components

```text
src/components/shell/
  TopBar.tsx
  DocumentTabs.tsx
  ActionBar.tsx
  EditorPane.tsx
  StatusBar.tsx
```

### Extraction targets

From `App.tsx`, extract:

- service creation;
- storage initialization;
- workspace persistence;
- document open/close/reorder/rename;
- Lua action discovery and execution;
- pipeline run/refresh logic;
- popup upsert/update/refresh logic;
- attention indicators;
- resource opening;
- source selection bridge.

### Acceptance criteria

- `App.tsx` mostly composes hooks and components.
- No behavior regression.
- Existing smoke test passes.
- Future write-back/edit-mode work has clear integration points.

---

## Work package 12 — Include browser no-network smoke test in check

### Required change

Update `package.json`:

```json
"check": "npm run test && npm run build && npm run verify:file && npm run verify:security && npm run verify:browser-no-network"
```

If ordering matters, place `verify:browser-no-network` after build.

### Acceptance criteria

- `npm run check` runs the browser no-network smoke test.
- CI fails if network use is detected.

---

## Suggested implementation order

1. Remove submodule and bump `@textforge/itm`.
2. Fix duplicate `view-itm-inspector` ownership.
3. Add pipeline registry model and conflict diagnostics.
4. Add pipeline enable/disable UI and persistence.
5. Add visible Diagnostics/Plugins attention indicators.
6. Remove `disabled-plugin`.
7. Fix linter discovery.
8. Implement TextForge-side ITM resolver bridge after ITM library resolver API exists.
9. Remove legacy ITM adapter helpers.
10. Increment document version on all changes.
11. Add browser no-network check to default `check`.
12. Split viewer rendering via renderer registry.
13. Refactor `App.tsx`.

---

## Tests to add or update

### Plugin/pipeline tests

- Duplicate pipeline IDs do not override.
- Later conflicting pipeline is disabled.
- User can enable one conflicting pipeline and disable the other.
- Pipeline disable preference persists.
- Plugin diagnostics are emitted for conflicts.

### UI tests

- Plugins button shows attention for plugin diagnostics.
- Diagnostics button shows attention for plugin/system diagnostics.
- Plugin Manager displays conflicting pipelines.

### ITM/TextForge integration tests

- ITM include resolves from an open TextForge document.
- Missing include emits a diagnostic from the ITM library.
- Circular include emits a diagnostic from the ITM library.
- ITM tree and graph pipelines still work.

### Workspace tests

- Rename increments document version.
- Language change increments document version.
- Text change increments document version.

### Security/build tests

- `npm run check` includes `verify:browser-no-network`.

---

## Definition of done

The TextForge update is complete when:

- ITM is consumed only through npm.
- TextForge uses `@textforge/itm ^0.3.0`.
- No pipeline silently overrides another.
- Conflicting pipelines are disabled, visible, and user-resolvable.
- Plugin and diagnostic buttons visibly show attention when needed.
- `disabled-plugin` no longer exists.
- Linters are discovered by declared kind.
- TextForge delegates include resolution to the ITM library through resolvers.
- Legacy local ITM parsing helpers are removed.
- All document changes increment version.
- Viewer rendering has a registry path.
- `App.tsx` is substantially reduced.
- `npm run check` includes the browser no-network smoke test.
