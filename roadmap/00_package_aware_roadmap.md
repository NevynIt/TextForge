# TextForge V15b Package-Aware Roadmap

This roadmap interweaves the architecture milestones with the package split. It is intentionally package-oriented: every phase states which packages are created or updated and what each package receives.

For a phase-sequenced cross-package dependency view, see `roadmap/03_package_dependency_activity_diagram.md`.

## Repository model used by this roadmap

This roadmap assumes one Git repository with pnpm workspaces. Each phase may update several packages in one branch, but each package keeps its own public API, tests, documentation, and versioning metadata. Changes should be made through package contribution manifests rather than by centralizing feature logic in the app shell. Git submodules are deliberately excluded from the initial rebuild because they make cross-package agentic changes and pull requests unnecessarily fragile.

## Roadmap principle

```text
Stable contracts in the center.
Feature packages contribute through manifests.
The application shell composes packages; it should not own feature logic.
```

## Runnable-shell rule

The roadmap distinguishes between a minimally runnable shell, recovery phases that repay deferred roadmap promises, and feature milestones.

The first stable user-facing checkpoint is the one where the app shell can launch without a blank placeholder screen and can present the core chrome that orients the user:

- app branding and frame
- workspace tree or sidebar
- main surface host area
- toolbar or command entry points
- status badges or equivalent shell feedback
- contribution registration and open-with routing for the registered surfaces

When that checkpoint must also remain runnable as a direct local `file://` artifact, do not define the shipped local path around `<script type="module">` and do not rely on post-build HTML rewriting to fix a generated module entry later. The runnable local artifact should be source-owned: a canonical file-launch HTML document, a dedicated loader entry, and focused checks that reject runtime ES module syntax in the emitted local bundle.

Phase 1 and later milestones add substantive workbench behavior. They do not replace the need for a first runnable shell.

Operationally, treat this as Phase 0.5: the first runnable shell sits between the repository pivot and Phase 1 workspace/surface skeleton work. Recovery phases may be inserted later when implementation deliberately deferred promised value; those phases must be explicit, package-scoped, and must not silently pull unrelated later milestones forward.


## Agent operating model

The roadmap is not only a planning document. In the repository, it must live in the `roadmap/` folder together with an `AGENTS_START_HERE.md` instruction and a continuously maintained `RAPID.md`.

Every agent run must:

```text
1. Read AGENTS_START_HERE.md.
2. Read RAPID.md.
3. Determine the current phase.
4. Implement the next coherent phase or phase slice.
5. Commit after the phase slice, or more frequently if a task is risky or logically complete.
6. Update RAPID.md with choices, assumptions, deviations, and clarifications.
7. Review the next roadmap step and update instructions if implementation reality has changed.
```

During implementation, the agent should build, test, lint, or typecheck progressively using the narrowest relevant commands that exist for the changed slice. Before any phase-slice commit, the agent should run the best available verification for that phase scope and record any remaining verification gap in `RAPID.md`.

Low-risk assumptions may be made explicitly and recorded. High-impact assumptions about architecture, security, licensing, package boundaries, canonical formats, public APIs, or visual-editor write-back must stop the work and trigger a clarification request.

Facade closures are not accepted. A phase cannot be claimed complete when the implementation only preserves the promised API shape or substitutes a browser-native shim for the promised behavior. Do not revise the phase claim downward to avoid completing the promised work; if the promised value is not implemented and validated, the phase remains open. Before claiming a phase or phase-slice closure, validate the delivered behavior against the roadmap promise itself and record that validation in `RAPID.md`.

Instruction updates are part of the work product. If a phase changes the plan, include the roadmap update in the same commit so the evolution of the plan is traceable.

## Milestones

### Phase -1 — Repository pivot and archival preservation

| Area | Action | Content |
|---|---|---|
| Git repository | Preserve | Tag current implementation as `textforge-v1-final`; create `archive/v1-current`; create `rewrite/v2-monorepo` for the rebuild. |
| Legacy material | Preserve selectively | Move useful docs, specs, examples, fixtures, whitepapers, test notes, and attribution material into `docs/legacy`, `docs/specs`, `docs/design`, and `fixtures/legacy`. Do not bulk-copy the old implementation into the new tree. |
| Rewrite branch | Clean | Remove old implementation files on the rewrite branch after preservation. Keep the project name and Git history. |
| Monorepo skeleton | Create | Add pnpm workspace root, `apps/textforge-web`, package folders, package placeholder manifests, README, and pivot log. |
| Roadmap folder | Create | Add `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, and `roadmap/RAPID.md`. |

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Create | Create. Define stable types: Diagnostic, Severity, SourceRange, ResourceRef, ContributionManifest, Command, Capability, PipelineValue, CanonicalPatch placeholders. |
| `@textforge/security-profile` | Create | Create. Define profile files, open-source license gate, CSP/manifest/service-worker check skeletons, remote asset check, forbidden privileged browser API check. |
| `@textforge/ui` | Create | Create. Minimal React primitives, theming tokens, icon conventions, app frame placeholders. |
| `@textforge/examples-docs` | Create | Create. Project docs index, sample workspace conventions, package documentation template. |
| `roadmap/` | Update | Initialize RAPID log and milestone checklist. Commit roadmap folder with Phase 0 skeleton. |

### Phase 1 — Workspace and Stage 1 surface skeleton

| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Create | Create. Virtual files/folders, resource IDs, text/binary resource metadata, Dexie schema, basic create/open/save/delete/rename/move APIs. |
| `@textforge/surfaces` | Create | Create. SurfaceContribution, SurfaceSession, SurfaceRegistry, one main SurfaceHost, popup SurfaceHost, open-with contract. |
| `@textforge/ui` | Update | Update. Workspace tree frame, surface frame, toolbar slots, status badges. |
| `@textforge/editors` | Create | Create. CodeMirrorTextEditorSurface with generic text editing and source range hooks. |
| `@textforge/assets` | Create | Create. Image/SVG/PDF/generic binary read-only surfaces; blob URL lifecycle; workspace asset binding. |

### Phase 2 — Source-editor coverage and language foundation

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Stabilize language IDs, editor capabilities, lint/diagnostic bridge types. |
| `@textforge/surfaces` | Update | Update. Add open-with selection, source editor fallback, basic stale/current indicators. |
| `@textforge/editors` | Update | Update. Add CodeMirror language modes, syntax highlighting, and editor configuration for Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate exchange XML, CSV/TSV, Mermaid, DOT, SVG, YAML. |

### Phase 3 — ZIP workspace import/export

| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Update | Update. Add fflate ZIP import/export, selected-folder export, full-workspace export, workspace manifest, path normalization, conflict policy. |
| `@textforge/security-profile` | Update | Update. Add generic checks for forbidden privileged filesystem APIs and archive boundary documentation. Do not inspect TextForge internal gateway discipline. |
| `@textforge/assets` | Update | Update. Ensure binary files round-trip through workspace ZIP. |

### Phase 3.1 — React workbench shell and UI recovery

Recovery phase. This repays the deferred React workbench and still-model-only `@textforge/ui` promise. It is a usability and shell-foundation phase, not a domain-feature phase.

| Package | Action | Content |
|---|---|---|
| `apps/textforge-web` | Update | Introduce `react` and `react-dom`; replace the imperative browser-native workbench bootstrap with a React-rendered shell while preserving the supported local/static or extension-hosted runnable path. |
| `@textforge/ui` | Update | Convert chrome contracts into real React primitives: app frame, top bar, collapsible workspace tree region, dominant main surface frame, compact status rail, main-session tab strip, and utility/debug pane hidden by default. Add baseline accessibility and keyboard behaviour. |
| `@textforge/surfaces` | Update | Preserve the current registry/session/host contracts while adapting host props and state to React. Expose the narrow main-session tab model needed by the refreshed shell and keep popup sessions out of the main document strip. |
| `@textforge/editors` | Update | Validate that existing CodeMirror editor surfaces mount through the React shell without changing source-editor behaviour or pulling rich-editor work forward. |
| `@textforge/assets` | Update | Validate that existing image/SVG/PDF/generic binary viewer surfaces mount through the React shell without changing asset semantics. |
| `@textforge/security-profile` | Update | Re-check dependency/license and runnable-artifact constraints after React adoption; preserve the no-network and no privileged filesystem API posture. |

Scope boundary: no command palette or contribution-driven menus yet; no Dexie persistence; no advanced Phase 13 tab groups, drag-reorder, split panes, saved layout state, or domain feature work.

### Phase 3.2 — Dexie workspace persistence recovery

Recovery phase. This repays the workspace persistence promise that was represented as schema/model surface earlier but not yet delivered as a real browser persistence backend.

| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Update | Add Dexie as a real runtime dependency. Implement versioned IndexedDB stores for folders, text resources, binary resources, metadata, language IDs, workspace manifest data, and schema versioning. Hydrate workspace state on startup and persist create/save/rename/move/delete/import/export flows. |
| `apps/textforge-web` | Update | Wire the shell to the persisted workspace service, including startup hydration, explicit reset/recovery affordances, and clear handling of storage initialization failures. |
| `@textforge/ui` | Update | Add any small storage-boundary cues needed by the shell, such as browser-managed workspace wording and reset/clear-storage confirmation chrome. |
| `@textforge/assets` | Update | Ensure binary resources persist and rehydrate correctly, with blob URL lifecycle still owned by the asset layer after Dexie hydration. |
| `@textforge/security-profile` | Update | Document and check the browser-managed storage boundary. Confirm that persistence still does not use File System Access API, directory handles, background sync, remote sync, or silent local file access. |

Scope boundary: no session-layout restore, no open-tab restore, no remote sync, no filesystem mirroring, and no command palette/menu work.

### Phase 3.3 — Command palette and contribution-driven shell commands

Deliberate pull-forward. This moves the shell-facing command palette and menu/toolbar composition slice from Phase 5 so the React shell stops depending on hard-coded toolbar/menu behaviour. It does not pull the full Phase 5 contribution system forward.

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Finalize the minimal command manifest, command registry, command context, command handler, and command contribution contracts needed for shell commands. |
| `@textforge/ui` | Update | Add command palette UI, command search/filter/execute behaviour, and contribution-driven toolbar/menu slot rendering. |
| `@textforge/workspace` | Update | Expose existing workspace actions such as import/export, new folder/resource, rename, delete, and selected-folder ZIP export as shell command contributions where applicable. |
| `@textforge/surfaces` | Update | Expose existing surface actions such as open-with, close, refresh/current-state display, and move main/popup as shell command contributions where applicable. |
| `@textforge/editors` | Update | Expose only existing editor actions that are already part of the source-editor surface as command descriptors; do not add rich editing or new domain authoring features. |
| `@textforge/assets` | Update | Expose only existing asset viewer actions that already exist as command descriptors; do not add generated asset workflows early. |
| `apps/textforge-web` | Update | Replace hard-coded primary toolbar/menu conditionals with registry-driven command composition and palette invocation. |

Scope boundary: no full pipeline contribution loading, no diagnostics aggregation UI, no plugin manager, no deep context-menu proliferation, no advanced permissions model, and no later domain packages. Phase 5 remains responsible for the broader contribution-pack system.

### Phase 4 — Markdown, local assets, and generated diagram assets

| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Create | Create. Minimal pipeline contribution registry, pipeline runner, trace, generated resource output type. |
| `@textforge/assets` | Update | Update. Add generated asset provenance, stale-state display, SVG/PNG export actions. |
| `@textforge/markdown` | Create | Create. markdown-it preview surface, workspace-relative image resolver, Markdown toolbar for inserting workspace images/diagram blocks, print-optimized HTML baseline. |
| `@textforge/diagrams` | Create | Create. Mermaid and Graphviz rendering pipelines, generated SVG resource creation, SVG-to-PNG rasterization pipeline. |

### Phase 5 — Contribution registries and package composition

Phase 5 extends the Phase 3.3 shell-command substrate into the broader package contribution system. Do not reimplement the command palette here; use Phase 5 to add the remaining contribution kinds and package-composition rules.

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Extend the Phase 3.3 command contracts into the full contribution pack manifest shape, dependency declarations, capability declarations, and package composition rules. |
| `@textforge/surfaces` | Update | Update. Add package-provided surface registration and capability-filtered commands beyond the base shell actions delivered in Phase 3.3. |
| `@textforge/pipeline` | Update | Update. Add step contribution loading, diagnostics aggregation, intermediate value reopening. |
| `@textforge/ui` | Update | Update. Extend contribution-driven menu/toolbar slots for feature packages, diagnostics, and package-composition feedback without broadening Phase 3.3 retroactively. |

### Phase 6 — ITM integration and model/report foundation

| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add ITM model value type and ITM-based transformation step contracts. |
| `@textforge/itm` | Create | Create. Parser/serializer/resolver interfaces, selectors, styles, views/viewpoints, validation diagnostics, profile package loading, workspace include resolver contract. |
| `@textforge/editors` | Update | Update. Add ITM source assistance and diagnostics integration. |
| `@textforge/markdown` | Update | Update. Add embedded ITM publication blocks and ITM-driven report fragments. |

### Phase 7 — ITM visual projections

| Package | Action | Content |
|---|---|---|
| `@textforge/surfaces` | Update | Update. Add ITM projection surface registrations. |
| `@textforge/itm` | Update | Update. Add projection APIs for tree, graph, mindmap, catalogue, matrix, and report fragments. |
| `@textforge/diagrams` | Update | Update. Add ITM-to-Mermaid, ITM-to-Graphviz, ITM-to-Cytoscape/Sigma adapters where appropriate. |

### Phase 8 — Lua automation

| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add Lua-backed pipeline step type and diagnostics mapping. |
| `@textforge/editors` | Update | Update. Add Lua source editor mode and action/snippet authoring helpers. |
| `@textforge/lua` | Create | Create. Fengari worker, sandbox, tf.* capability bridge, Lua editor/console surfaces, action discovery, pipeline action adapter. |

### Phase 9 — Markdown + ITM report generation

| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Add report-oriented view extraction and model fragment export APIs. |
| `@textforge/markdown` | Update | Update. unified/remark/rehype report pipeline, section generation, local asset embedding/resolution, report preview surface. |
| `@textforge/diagrams` | Update | Update. Ensure generated SVG/PNG assets can be stored and referenced in reports. |

### Phase 10 — BPMN support and first mature visual editor

| Package | Action | Content |
|---|---|---|
| `@textforge/surfaces` | Update | Update. Ensure controlled-write-back capability is represented in surface chrome. |
| `@textforge/pipeline` | Update | Update. Add BPMN XML value and optional BPMN-to-ITM/ITM-to-BPMN extension points. |
| `@textforge/bpmn` | Create | Create. BPMN XML language integration, bpmn-js viewer/modeler surfaces, controlled edit mode, XML patch preview/apply/discard, diagnostics refresh. |

### Phase 11 — Tables, catalogues, and matrices

| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Expose node/relationship catalogue and matrix projections. |
| `@textforge/ui` | Update | Update. Common table toolbar/filter/sort components. |
| `@textforge/bpmn` | Update | Update. Add BPMN task/event/gateway catalogue surfaces if useful. |
| `@textforge/tables` | Create | Create. TanStack Table semantic table surfaces, CSV/TSV grid editor, catalogue/matrix abstractions, validation issue table. |

### Phase 12 — Enterprise architecture and ArchiMate foundation

| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Support ArchiMate profile packaging and validation hooks. |
| `@textforge/markdown` | Update | Update. Add EA report blocks: views, catalogues, matrices, traceability tables. |
| `@textforge/tables` | Update | Update. Reusable EA catalogue/matrix editors. |
| `@textforge/archimate` | Create | Create. ArchiMate ITM profile, element/relationship definitions, validation rules, viewpoints, style rules, exchange XML import/export, EA catalogues and matrices. |

### Phase 13 — Stage 2 advanced tabbed main surfaces

Phase 3.1 may already provide a narrow main-session document tab strip for usability. Phase 13 is the later advanced tabbed-surface milestone.

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Add stable session persistence types if needed. |
| `@textforge/surfaces` | Update | Update. Add tab groups, tab movement, richer open-to-main/open-as-popup transitions, optional pinned state, and advanced session semantics. Splits remain future. |
| `@textforge/ui` | Update | Update. Add advanced tab chrome, movement affordances, group-aware keyboard navigation, and richer tab-state indicators. |

### Phase 14 — Rich Markdown editing, optional and round-trip gated

| Package | Action | Content |
|---|---|---|
| `@textforge/editors` | Update | Update. Define rich-editor capability and unsupported-construct warning conventions. |
| `@textforge/markdown` | Update | Update. Add Milkdown rich Markdown surface behind feature flag; preserve source editor fallback; implement round-trip tests for fenced ITM/Mermaid/DOT/KaTeX/front matter/local images. |

### Phase 15 — Controlled graph, diagram, and pipeline editors

| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add visual pipeline editor schema and controlled write-back patches. |
| `@textforge/itm` | Update | Update. Add small-subgraph patch contracts and view-layout delta support. |
| `@textforge/diagrams` | Update | Update. Add React Flow adapter for controlled graph/flowchart/layout-delta editing with explicit patch generation. |

### Phase 16 — ArchiMate visual editing investigation

| Package | Action | Content |
|---|---|---|
| `@textforge/security-profile` | Update | Update. Add dependency/license review notes for any adopted ArchiMate visual library. |
| `@textforge/archimate` | Update | Update. Investigate archimate-js; if acceptable, add experimental ArchiMate view editor; otherwise define React Flow fallback. Keep ITM/profile/exchange XML canonical. |

### Phase 17 — Sketch and annotation resources

| Package | Action | Content |
|---|---|---|
| `@textforge/assets` | Update | Update. Add Excalidraw sketch/annotation resource surface if still desired; store sketch JSON plus SVG/PNG exports as workspace resources. |
| `@textforge/markdown` | Update | Update. Allow insertion of sketch assets into Markdown reports. |

### Phase 18 — Late PDF generation and PDF annotation

| Package | Action | Content |
|---|---|---|
| `@textforge/assets` | Update | Update. Optional PDF annotation layer over PDF.js; store annotations as separate workspace resources/deltas. |
| `@textforge/markdown` | Update | Update. Evaluate local Markdown/HTML-to-PDF pipeline after print HTML stabilizes. |

### Phase 19 — Release-envelope verification and accreditation evidence

| Package | Action | Content |
|---|---|---|
| `@textforge/security-profile` | Update | Update. Finalize reusable browser-envelope checks for static/extension/PWA targets and generate evidence artifacts. |
| `@textforge/examples-docs` | Update | Update. Add release checklist, example accreditation output, sample build artifacts, and end-to-end tutorial workspace. |
