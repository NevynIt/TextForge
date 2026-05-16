# TextForge V1 Refinement Whitepaper

## Purpose

This whitepaper captures the agreed refinements for Version 1 of TextForge. It is intended to guide implementation work on the existing repository without changing the core concept of the application.

The current TextForge implementation already provides a strong foundation: a local-first text workbench, multi-document editing, language-aware plugins, explicit pipelines, viewer popups, diagnostics, and several built-in viewers for text, trees, tables, mind maps, and graphs.

The refinements described here focus on improving document identity, plugin loading behaviour, diagnostics, and viewer usability while postponing full visual editing/write-back to a later phase.

---

## 1. Preserve Explicit Pipeline Transformations

### Current situation

TextForge uses explicit pipelines composed of ordered steps. For example, a document may be transformed from source text into an intermediate model and then rendered by a viewer.

Some possible simplification ideas would hide these transformations and let viewers internally adapt source formats directly.

### Decision

Explicit transformations should remain visible and remain part of the core TextForge concept.

The pipeline is not merely an implementation detail. It is one of the key ideas of the application: users should be able to see how text becomes a model, how the model becomes a view, and which contribution performs each step.

### Implementation guidance

Do not collapse transformer steps into opaque viewer internals.

A pipeline such as:

```text
Indented tree text → tree model → tree viewer
Indented tree text → graph model → Cytoscape viewer
Markdown text → HTML → HTML viewer
```

should remain visible as an explicit processing chain.

Viewers may still contain small rendering adapters where technically necessary, but semantically meaningful transformations should stay registered as transformer contributions.

### Rationale

Keeping transformations explicit supports:

- transparency;
- debugging;
- diagnostics per step;
- reuse of intermediate models;
- user understanding of what the workbench is doing;
- future pipeline inspection and editing.

---

## 2. Remove Duplicate Filename Rewriting

### Current situation

When opening documents with the same file name, TextForge currently avoids duplicate display names by adding suffixes such as:

```text
file.md
file (2).md
file (3).md
```

This was intended to reduce confusion, but it changes the name chosen by the user and may imply that the application is performing file identity management that it should not own.

### Decision

TextForge should allow multiple documents with the same visible file name.

It should not automatically rename or suffix files merely because another tab already has the same name.

Opening the same file name twice should be allowed. The user may intentionally want two separate working copies, experiments, or variants.

### Required replacement mechanism

Instead of renaming duplicates, TextForge should give every open document a clear visual identity.

That identity should include:

1. a unique document color;
2. a compact badge or avatar-like marker;
3. consistent use of that identity across tabs, document headers, viewer windows, and viewer controls.

### Badge concept

The badge should behave like the small anonymous-user identity markers used in chats and forums: compact, visually distinct, and easy to associate with one source.

Possible badge forms:

```text
A coloured dot + short code
A numbered pill
A small generated symbol
A geometric avatar
A two-character identifier
```

Example:

```text
[blue badge: A7]  notes.md
[green badge: C2] notes.md
```

The filename remains unchanged, but the user can still distinguish the two open documents.

### Implementation guidance

Each document should receive a stable `documentIdentity` object when created/opened:

```ts
type DocumentIdentity = {
  color: string;
  badgeLabel: string;
  badgeKind?: string;
};
```

This should be stored with the open document state and reused wherever the document is referenced.

The identity should be stable for the lifetime of the open workspace session. If workspace restoration is supported, restoring the same open documents should also restore their assigned colours and badges.

### UI locations

The document identity should appear in:

- editor tabs;
- active document header;
- popup viewer title/header;
- popup viewer control panels;
- diagnostics panels where diagnostics are grouped by document;
- pipeline trace views where a source document is referenced.

### Rationale

This preserves user intent and avoids false assumptions about filenames while still solving the practical problem of distinguishing documents.

---

## 3. Clarify Popup Window Model

### Current situation

The current implementation has popup-like viewer panels inside the main application window.

These behave as internal popups rather than actual operating-system-level windows.

### Decision

TextForge should distinguish between two kinds of popups:

1. **External viewer windows** managed by the operating system/browser window manager.
2. **Internal viewer control panels** displayed inside a viewer window or viewer surface.

These are different concepts and should not be conflated.

---

## 4. External Viewer Windows

### Intent

When the user opens a renderer or preview, the preferred long-term behaviour is that it can appear in a real separate browser window, not merely as an overlay within the same application window.

This lets users arrange editors and renderers using the operating system window manager.

For example:

```text
Main TextForge window: source editor
Separate OS window 1: Markdown preview
Separate OS window 2: Cytoscape graph
Separate OS window 3: Tree view
```

### Implementation guidance

External viewer windows should maintain a live association with their source document.

Each external viewer window should know:

```ts
type ViewerWindowBinding = {
  viewerWindowId: string;
  sourceDocumentId: string;
  sourceDocumentVersion: number;
  pipelineId: string;
  contributionIds: string[];
};
```

The external window should display the document identity badge and colour prominently so the user knows which source it is rendering.

When the source document changes, the viewer should either:

- auto-refresh if configured to follow the source; or
- show a stale indicator if it is pinned to an earlier version.

### Communication model

The implementation will need a communication channel between the main application and external viewer windows.

Potential browser mechanisms include:

- `window.open` for creating the viewer window;
- `postMessage` for communication;
- `BroadcastChannel` for same-origin coordination;
- local IndexedDB/session state for recoverable state transfer where appropriate.

The exact mechanism can be selected during implementation, but the architectural requirement is that viewers remain linked to their source document and pipeline state.

### Security note

Because TextForge targets local and extension-style deployment with strict CSP constraints, external viewer windows must preserve the same security posture. They should not introduce network access or load arbitrary remote resources.

---

## 5. Internal Viewer Control Panels

### Intent

Separate from external viewer windows, each viewer should be able to expose an internal control panel for visualization settings.

This is especially important for graph and structured viewers.

The goal is to provide capabilities similar to a lightweight Gephi-style visual exploration interface, but embedded in TextForge viewers.

### Scope for V1 refinement

The immediate priority is not full visual editing or write-back.

The priority is better viewer control:

- layout selection;
- node size controls;
- edge size controls;
- label visibility;
- filtering;
- grouping options;
- basic styling options;
- reset-to-default view;
- fit-to-screen;
- possibly export current view later.

### Affected viewers

The first candidates are:

- Cytoscape graph viewer;
- Sigma/Graphology graph viewer;
- tree viewer;
- mind map viewer;
- table viewer where filtering/sorting is useful;
- future BPMN/UML/mind map viewers.

### Control panel behaviour

A viewer should be able to declare that it supports configurable visualization controls.

A generic host can then show a small internal popup, side panel, drawer, floating toolbar, or settings panel inside that viewer.

Example control categories:

```text
Layout
- cose
- breadthfirst
- circle
- concentric
- grid

Node style
- size by degree
- fixed size
- label size
- show/hide labels

Edge style
- width
- arrows
- curve style

Filters
- node kind
- edge kind
- text search
- degree threshold
- class/tag
```

### Implementation guidance

Viewer contributions should optionally expose a visualization controls schema.

Example:

```ts
type ViewerControlDefinition = {
  id: string;
  label: string;
  type: "select" | "boolean" | "number" | "range" | "text" | "multi-select";
  defaultValue: unknown;
  options?: Array<{ label: string; value: unknown }>;
  group?: string;
};
```

A viewer contribution could then expose:

```ts
type ViewerContribution = {
  id: string;
  label: string;
  accepts: string[];
  render: ViewerRenderFunction;
  controls?: ViewerControlDefinition[];
};
```

The viewer host should own the generic UI for displaying controls, while the viewer implementation should own the meaning of each setting.

The host passes the current control state into the viewer render/update function.

```ts
type ViewerRenderContext = {
  documentId: string;
  documentIdentity: DocumentIdentity;
  controls: Record<string, unknown>;
};
```

### Rationale

This avoids hard-coding Cytoscape-specific controls into the application shell while still allowing viewers to become more interactive and useful.

Each viewer can expose controls appropriate to its own domain.

---

## 6. Plugin Manager: Load and Autoload, Not Unload

### Current situation

The plugin manager currently shows plugin-related information. A richer manager could allow users to load, unload, and configure plugins.

### Decision

The plugin manager should focus on:

1. listing known plugins;
2. allowing manual loading of plugins;
3. allowing plugins to be marked for autoload at startup.

It should not prioritize unloading plugins.

### Rationale

Unloading a plugin is complicated and not clearly useful in the current model.

Once a plugin has registered languages, viewers, transformers, diagnostics, or pipelines, unloading it may leave open documents, active viewers, traces, or diagnostics referring to contributions that no longer exist.

Instead of supporting complex unload semantics, V1 should keep the model simple:

```text
Known plugin → not loaded
Known plugin → loaded manually
Known plugin → loaded automatically at startup
```

### Implementation guidance

The plugin manager should expose plugin state such as:

```ts
type PluginLoadState = "available" | "loaded" | "failed";

type PluginAutoloadState = {
  pluginId: string;
  autoload: boolean;
};
```

User actions:

```text
Load now
Enable autoload
Disable autoload
View plugin details
View load errors
```

Avoid implementing:

```text
Unload plugin
Reload plugin in place
Force-remove plugin contributions
```

Reload may be reconsidered later for development mode, but it should not be part of the ordinary user-facing V1 behaviour.

---

## 7. Diagnostics From All Pipeline Steps

### Current situation

Diagnostics are associated mainly with linters.

However, TextForge pipelines contain several kinds of processing steps: transformers, viewers, editors, exporters in future, and possibly terminal pipeline steps.

Any of these may discover useful warnings or errors.

### Decision

Diagnostics should become a shared application service used by all contributions, not only linters.

Any pipeline step should be able to report diagnostics.

### Examples

A transformer may report:

```text
Warning: unsupported Mermaid edge style was ignored.
```

A viewer may report:

```text
Error: graph contains an edge referencing a missing node.
```

A parser may report:

```text
Error: invalid indentation at line 17.
```

A table viewer may report:

```text
Observation: 12 rows are hidden by the current filter.
```

A future visual editor may report:

```text
Warning: this visual change cannot be safely written back to source.
```

### Diagnostic shape

Diagnostics should include enough context to identify the source document, pipeline step, contribution, and affected language/model.

Recommended shape:

```ts
type DiagnosticSeverity = "error" | "warning" | "information" | "observation";

type TextForgeDiagnostic = {
  id?: string;
  source: string;
  severity: DiagnosticSeverity;
  message: string;

  documentId?: string;
  documentVersion?: number;
  languageId?: string;

  pipelineId?: string;
  pipelineRunId?: string;
  pipelineStepId?: string;
  contributionId?: string;

  from?: number;
  to?: number;
  line?: number;
  column?: number;

  modelPath?: string;
  fixAction?: unknown;
};
```

### Implementation guidance

The pipeline runner should collect diagnostics from every step result.

Step results may therefore include:

```ts
type PipelineStepResult = {
  value: unknown;
  valueType: string;
  diagnostics?: TextForgeDiagnostic[];
};
```

The diagnostics service should merge diagnostics from:

- standalone linters;
- parsers;
- transformers;
- viewers;
- visual controls where relevant;
- future editors/exporters.

Diagnostics should be grouped and filterable by:

- document;
- severity;
- source contribution;
- pipeline run;
- language/model type.

### Rationale

This makes diagnostics part of the whole workbench, not just a code-linting feature.

It also supports the explicit pipeline concept: every transformation or rendering step can explain what it did, what it ignored, and what failed.

---

## 8. Postpone Full Visual Editing and Write-Back

### Current situation

Some visual editor contributions exist as skeletons or placeholders.

A possible future direction is to allow editing through visual views and writing changes back to the source document.

### Decision

This remains desirable, but it should be treated as a second-stage capability.

The immediate priority is better visualization control, not full visual editing.

### Future direction

A future visual editing phase may include:

- editing a tree visually and generating source patches;
- editing graph nodes and edges;
- validating whether visual edits can be represented in the source language;
- showing proposed patches before applying them;
- preserving user control over write-back;
- reporting diagnostics when write-back is lossy or impossible.

### Why defer it

Visual editing with source write-back is substantially more complex than visualization controls.

It requires:

- source mapping;
- patch generation;
- conflict handling;
- round-trip constraints;
- validation;
- user review;
- failure modes for edits that cannot be represented in the source format.

For V1 refinement, improving viewer exploration gives substantial value without introducing write-back risk.

---

## 9. Document Identity and Viewer Binding as a Cross-Cutting Concern

Several of the above changes depend on the same principle: every document must have a stable identity independent of its filename.

The filename is a user-facing label. It is not sufficient as the internal identity.

TextForge should consistently distinguish:

```text
Document ID: internal unique identity
Document name: user-visible filename/title
Document badge: compact visual marker
Document color: visual identity cue
Document version: changing source state
```

Viewer windows and pipeline runs should bind to `documentId`, not filename.

The filename can be shown everywhere, but it should not be used as the unique key.

---

## 10. Recommended Implementation Order

### Step 1: Document identity refinement

- Remove duplicate filename suffixing.
- Add document colour and badge generation.
- Display identity in tabs and headers.
- Persist identity in workspace state.

### Step 2: Viewer identity propagation

- Pass document identity into viewer host/render context.
- Display document badge and colour in viewer popup headers.
- Ensure pipeline traces and diagnostics identify source documents clearly.

### Step 3: Plugin manager load/autoload

- Add load state display.
- Add manual load action.
- Add autoload toggle.
- Persist autoload preferences.
- Do not implement unload.

### Step 4: Pipeline-wide diagnostics

- Extend pipeline step result shape to include diagnostics.
- Allow transformers/viewers to report diagnostics.
- Merge those diagnostics into the shared diagnostics service.
- Display diagnostics by document, step, and severity.

### Step 5: Internal viewer control panels

- Define generic viewer control schema.
- Add viewer-host UI for internal controls.
- Implement controls first for Cytoscape and Sigma graph viewers.
- Extend later to tree, mind map, and table viewers.

### Step 6: External viewer windows

- Introduce real external viewer windows using browser window APIs.
- Add robust main-window-to-viewer communication.
- Preserve strict security constraints.
- Keep source document identity and stale/current status visible.

### Step 7: Future visual editing

- Keep skeletons, but do not prioritize full write-back yet.
- Later define patch model, validation model, and write-back diagnostics.

---

## 11. Summary of Decisions

The following decisions should guide implementation:

| Topic | Decision |
|---|---|
| Duplicate filenames | Allow them; do not rename automatically |
| Document distinction | Use stable colour and badge identity |
| Pipeline transformations | Keep explicit and visible |
| Plugin manager | Support load and autoload, not unload |
| Diagnostics | Allow all pipeline steps to report diagnostics |
| Viewer popups | Move toward real external OS/browser windows for viewers |
| Viewer controls | Add internal control panels inside viewers |
| Visual editing | Defer full edit/write-back to a later phase |

---

## 12. Architectural Principle

TextForge should remain a transparent text-processing workbench.

The user should be able to see:

```text
which document is being used,
which language it has,
which pipeline is running,
which transformations are applied,
which viewer is rendering the result,
which diagnostics were produced,
and which visualization settings affect the current view.
```

The refinements in this whitepaper are intended to strengthen that principle without overcomplicating Version 1.

