# TextForge V15n Package-Aware Roadmap

This roadmap interweaves the architecture milestones with the package split. It is intentionally package-oriented: every phase states which packages are created or updated and what each package receives.

For a phase-sequenced cross-package dependency view, see `roadmap/03_package_dependency_activity_diagram.md`. Phase-specific grilling records live under `roadmap/grilling/` and must be consulted when they exist for the active phase.

Architecture references in this roadmap use anchor IDs from `roadmap/02_architecture_paragraph_reference_index.md`. Each anchor maps to an exact paragraph or paragraph-like block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`. Dependency rows use executable pnpm commands whenever a package needs a new workspace or third-party dependency.

The dependency commands deliberately omit hardcoded versions unless the roadmap needs a specific version gate. The implementing agent should let `pnpm-lock.yaml` capture the resolved version, run the security/license gate, and record any deviation in `roadmap/RAPID.md`.

## Repository model used by this roadmap

This roadmap assumes one Git repository with pnpm workspaces. Each phase may update several packages in one branch, but each package keeps its own public API, tests, documentation, and versioning metadata. Changes should be made through package contribution manifests rather than by centralizing feature logic in the app shell. Git submodules are deliberately excluded from the initial rebuild because they make cross-package agentic changes and pull requests unnecessarily fragile.

## Roadmap principle

```text
Stable contracts in the center.
Feature packages contribute through manifests.
The application shell composes packages; it should not own feature logic.
```

## TF-MD phase implementation rule

The TextForge Markdown Profile source specification lives at `roadmap/specs/textforge_markdown_profile.md`. Implement it through existing phases rather than by adding a separate Markdown-profile milestone. The phase mapping is intentionally progressive:

| Phase | TF-MD implementation responsibility | Conformance posture |
|---|---|---|
| Phase 2 | Markdown remains a source-editor language mode only. No TF-MD semantic claim. | Pre-profile editing support. |
| Phase 4 | Establish the TF-MD baseline in `@textforge/markdown`: Markdown-compatible reading, explicit heading anchors, style references, `tf-md` control block scanning, `%metadata`, `%style`, initial diagnostics, local images, and a provisional fenced-block dispatcher for Mermaid, DOT/Graphviz, SVG, JSON, and YAML. | Claims Level 1 and Level 2; preserves unknown fenced blocks. |
| Phase 4.1 | Stabilize the shared diagnostic contract, default-contribution shape, command/action spine, public package API boundaries, and resource-fact/surface-predicate seam that Phase 5 will use. | No new TF-MD conformance level; mandatory stabilization before the Level 4 machinery is implemented. |
| Phase 5 | Replace provisional block dispatch with contribution/capability-aware registration and `%require` diagnostics using package manifests. | Adds Level 4 machinery, but cumulative conformance is not claimed past Level 2 until Phase 9 completes composition. |
| Phase 6 | Add model-aware Markdown by connecting `itm` and `itm-pub` fenced blocks to the ITM parser, diagnostics, model fragments, and publication views. | Adds Level 5 local model-aware capability, while cumulative conformance still waits for Phase 9 Level 3 composition. |
| Phase 9 | Add `%include`, `%repository`, repository-qualified references, circular-include diagnostics, resolved Markdown output, and report-generation behavior. | Completes Level 3 and makes resolved Markdown/report output a first-class pipeline value. |
| Phase 14 | Add optional rich Markdown editing only behind a feature flag, with source fallback and round-trip tests for every TF-MD construct already implemented. | Rich editor must not become the canonical TF-MD parser. |

Do not add a separate phase called "Markdown profile". If implementation details need to move, update the phase rows above and the package guides in the same commit, and append a RAPID decision/progress row.

## Runnable-shell rule

The roadmap distinguishes between a minimally runnable shell, recovery phases that repay deferred roadmap promises, and feature milestones.

The first stable user-facing checkpoint is the one where the app shell can launch without a blank placeholder screen and can present the core chrome that orients the user:

- app branding and frame
- workspace tree or sidebar
- main surface host area
- toolbar or command entry points
- status badges or equivalent shell feedback, including stable document identity badges, a readable overflow-safe workbench pass after Phase 3.4, and focused popup/resizable-panel/chrome cleanup after Phase 3.5
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

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-9-P01..P04`, `ARCH-10-P01..P04`, `ARCH-12.1-P01`, `ARCH-13.2-P01`, `ARCH-13.3-P01..P04`, `ARCH-13.4-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| workspace root | Create pnpm workspace metadata; install root dev tooling only. | `corepack enable`; `pnpm init`; `pnpm add -D -w typescript vitest eslint prettier @changesets/cli` |
| `apps/textforge-web` | Create placeholder app package only; no React/Vite app dependency decision is made here unless the runnable-shell slice is also executed. | `pnpm --filter ./apps/textforge-web add -D vite typescript vitest` |
| `packages/*` placeholders | Create package manifests and scripts; do not add feature libraries yet. | No package-specific install beyond root tooling. |


| Area | Action | Content |
|---|---|---|
| Git repository | Preserve | Tag current implementation as `textforge-v1-final`; create `archive/v1-current`; create `rewrite/v2-monorepo` for the rebuild. |
| Legacy material | Preserve selectively | Move useful docs, specs, examples, fixtures, whitepapers, test notes, and attribution material into `docs/legacy`, `docs/specs`, `docs/design`, and `fixtures/legacy`. Do not bulk-copy the old implementation into the new tree. |
| Rewrite branch | Clean | Remove old implementation files on the rewrite branch after preservation. Keep the project name and Git history. |
| Monorepo skeleton | Create | Add pnpm workspace root, `apps/textforge-web`, package folders, package placeholder manifests, README, and pivot log. |
| Roadmap folder | Create | Add `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, and `roadmap/RAPID.md`. |

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Core contract package; keep runtime dependencies empty unless implementation proves otherwise. | `pnpm --filter @textforge/core add -D typescript vitest` |
| `@textforge/security-profile` | Security profile package consuming core diagnostics/contracts; static license tooling remains dev-only. | `pnpm --filter @textforge/security-profile add @textforge/core@workspace:*`; optional scan tooling: `pnpm --filter @textforge/security-profile add -D license-checker-rseidelsohn` |
| `@textforge/ui` | Initial dependency-light UI contracts and tokens. | `pnpm --filter @textforge/ui add @textforge/core@workspace:*` |
| `@textforge/examples-docs` | Docs/examples package, using core conventions only. | `pnpm --filter @textforge/examples-docs add @textforge/core@workspace:*` |
| `roadmap/` | Documentation-only update. | No pnpm package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Create | Create. Define stable types: Diagnostic, Severity, SourceRange, ResourceRef, ContributionManifest, Command, Capability, PipelineValue, CanonicalPatch placeholders. |
| `@textforge/security-profile` | Create | Create. Define profile files, open-source license gate, CSP/manifest/service-worker check skeletons, remote asset check, forbidden privileged browser API check. |
| `@textforge/ui` | Create | Create. Minimal React primitives, theming tokens, icon conventions, app frame placeholders. |
| `@textforge/examples-docs` | Create | Create. Project docs index, sample workspace conventions, package documentation template. |
| `roadmap/` | Update | Initialize RAPID log and milestone checklist. Commit roadmap folder with Phase 0 skeleton. |

### Phase 1 — Workspace and Stage 1 surface skeleton

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | Workspace contracts and in-memory service; Dexie and fflate stay for later phases. | `pnpm --filter @textforge/workspace add @textforge/core@workspace:*` |
| `@textforge/surfaces` | Surface registry/session/host contracts. | `pnpm --filter @textforge/surfaces add @textforge/core@workspace:* @textforge/ui@workspace:*` |
| `@textforge/ui` | Workspace/surface frame primitives; keep third-party UI libraries out until React recovery. | No new external package. Keep `@textforge/core@workspace:*`; pass workspace/surface data through typed props unless a deliberate package-dependency change is recorded. |
| `@textforge/editors` | CodeMirror source surface. | `pnpm --filter @textforge/editors add @textforge/core@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/search` |
| `@textforge/assets` | Read-only image/SVG/PDF/binary viewers and blob URL lifecycle. | `pnpm --filter @textforge/assets add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* pdfjs-dist` |


| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Create | Create. Virtual files/folders, resource IDs, text/binary resource metadata, Dexie schema, basic create/open/save/delete/rename/move APIs. |
| `@textforge/surfaces` | Create | Create. SurfaceContribution, SurfaceSession, SurfaceRegistry, one main SurfaceHost, popup SurfaceHost, open-with contract. |
| `@textforge/ui` | Update | Update. Workspace tree frame, surface frame, toolbar slots, status badges. |
| `@textforge/editors` | Create | Create. CodeMirrorTextEditorSurface with generic text editing and source range hooks. |
| `@textforge/assets` | Create | Create. Image/SVG/PDF/generic binary read-only surfaces; blob URL lifecycle; workspace asset binding. |

### Phase 2 — Source-editor coverage and language foundation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.6-P01..P04`, `ARCH-6.6-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Language IDs, editor capability IDs, diagnostics bridge. | No new package install. |
| `@textforge/surfaces` | Open-with selection and source-editor fallback indicators. | No new package install. |
| `@textforge/editors` | Language packs and lint support for source editors. | `pnpm --filter @textforge/editors add @codemirror/lang-markdown @codemirror/lang-json @codemirror/lang-xml @codemirror/lang-yaml @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript @codemirror/legacy-modes @codemirror/lint` |


| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Stabilize language IDs, editor capabilities, lint/diagnostic bridge types. |
| `@textforge/surfaces` | Update | Update. Add open-with selection, source editor fallback, basic stale/current indicators. |
| `@textforge/editors` | Update | Update. Add CodeMirror language modes, syntax highlighting, and editor configuration for Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate exchange XML, CSV/TSV, Mermaid, DOT, SVG, YAML. |

### Phase 3 — ZIP workspace import/export

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.9-P01..P05`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | ZIP import/export and manifest support. | `pnpm --filter @textforge/workspace add fflate` |
| `@textforge/security-profile` | Archive-boundary and forbidden-file-API checks. | No new package install unless scan implementation needs dev-only parser tooling; record any added tool in RAPID. |
| `@textforge/assets` | Binary ZIP round-trip validation. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Update | Update. Add fflate ZIP import/export, selected-folder export, full-workspace export, workspace manifest, path normalization, conflict policy. |
| `@textforge/security-profile` | Update | Update. Add generic checks for forbidden privileged filesystem APIs and archive boundary documentation. Do not inspect TextForge internal gateway discipline. |
| `@textforge/assets` | Update | Update. Ensure binary files round-trip through workspace ZIP. |

### Phase 3.1 — React workbench shell and UI recovery

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `apps/textforge-web` | React-rendered app shell and Vite React wiring. | `pnpm --filter ./apps/textforge-web add react react-dom`; `pnpm --filter ./apps/textforge-web add -D @vitejs/plugin-react @types/react @types/react-dom` |
| `@textforge/ui` | Real React workbench primitives and workspace tree component. | `pnpm --filter @textforge/ui add react react-dom react-arborist`; `pnpm --filter @textforge/ui add -D @types/react @types/react-dom` |
| `@textforge/surfaces` | React-consumable host props/state adapters. | `pnpm --filter @textforge/surfaces add react react-dom`; `pnpm --filter @textforge/surfaces add -D @types/react @types/react-dom` |
| `@textforge/editors` | React-shell mounting validation for CodeMirror surfaces. | `pnpm --filter @textforge/editors add react react-dom`; `pnpm --filter @textforge/editors add -D @types/react @types/react-dom` |
| `@textforge/assets` | React-shell mounting validation for asset viewers. | `pnpm --filter @textforge/assets add react react-dom`; `pnpm --filter @textforge/assets add -D @types/react @types/react-dom` |
| `@textforge/security-profile` | Dependency/license and runnable-artifact checks after React adoption. | No new runtime package install. |


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

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | Dexie runtime persistence and migration stores. | `pnpm --filter @textforge/workspace add dexie` |
| `apps/textforge-web` | Hydrate persisted workspace at startup. | No new package install. |
| `@textforge/ui` | Storage/reset/recovery cues only. | No new package install. |
| `@textforge/assets` | Binary rehydration validation through workspace service. | No new package install. |
| `@textforge/security-profile` | Browser-managed storage boundary checks. | No new package install. |


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

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Minimal shell-command substrate. | No new package install. |
| `@textforge/ui` | Command palette/menu/toolbar slots. | No new package install by default; add a palette library only through an explicit RAPID decision. |
| `@textforge/workspace` | Expose existing workspace actions as command contributions. | No new package install. |
| `@textforge/surfaces` | Expose existing surface actions as command contributions. | No new package install. |
| `@textforge/editors` | Expose existing editor actions as command contributions. | No new package install. |
| `@textforge/assets` | Expose existing asset viewer actions as command contributions. | No new package install. |
| `apps/textforge-web` | Compose package commands in shell. | No new package install. |


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

Implementation note: the delivered Phase 3.3 shell slice uses a local command registry and dispatcher in `@textforge/core`, contribution-driven toolbar/menu slots, and a local command palette. It does not introduce external package loading, remote command execution, or plugin-management UX.

### Phase 3.4 — Resource identity badges and workbench readability pass

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Shared document-badge/resource-identity types only if cross-package contracts require them. | No new package install. |
| `@textforge/workspace` | Deterministic badge identity, collision repair, persisted badge metadata, and import/restore uniqueness validation. | No new package install. |
| `@textforge/ui` | Badge primitives, layout hygiene primitives, compact command/menu presentation, panel/drawer chrome, typography/spacing cleanup, inspector/empty-state components, and bundled generic React shell icons through `lucide-react`. | `pnpm --filter @textforge/ui add lucide-react` |
| `@textforge/surfaces` | Badge metadata projection into surface sessions and tab/header chrome; active-surface/readability metadata for common surface chrome. | No new package install. |
| `@textforge/editors` | Validate text-editor chrome/readability after shell layout changes; keep CodeMirror ownership unchanged. | No new package install. |
| `@textforge/assets` | Validate asset-viewer chrome/readability after shell layout changes; keep binary viewer ownership unchanged. | No new package install. |
| `apps/textforge-web` | Integrate the full workbench readability pass: no global horizontal scroll, compact header, stable utility drawer, clearer tree/tabs/editor/inspector layout, active-resource highlighting, badges, and small empty/error/help states. | No new package install. |
| `@textforge/security-profile` | Verify readability/badge changes stay local and deterministic and do not introduce remote badge image/icon loading, filesystem identity assumptions, background sync, or silent local-file probing. | No new package install. |
| `@textforge/examples-docs` | Document the badge style, layout/readability expectations, fixture expectations, and recovery/collision examples. | No new package install. |

Safe follow-on phase after Phase 3.3. Implement this as one coherent Phase 3.4 pass, not as a set of explicit sub-phases. The goal is to turn the now-functional Phase 3.3 shell from a debug/workbench UI into a readable authoring workspace while restoring the old Shapez.io-style document badge idea as a deterministic identity/orientation feature. `lucide-react` is the bundled React icon library for generic shell affordances in this pass; resource identity still comes from the deterministic badge token rather than arbitrary per-file icons.

Recommended components of the single pass, in priority order:

| Priority | Component | Implementation guidance |
|---:|---|---|
| 1 | Remove global horizontal scrolling | Ensure the app frame, sidebars, editor surface, inspector, utility panel, and status areas use `min-width: 0`, bounded flex/grid regions, and internal scrolling instead of page-level horizontal overflow. |
| 2 | Compact the top header/status/debug area | Move low-value counters and verbose storage/debug chips out of prime header space; keep the main header readable and reserve detailed state for the utility panel or compact status strip. |
| 3 | Normalize typography, spacing, and contrast | Apply a small shell-wide cleanup so labels, metadata, buttons, tabs, cards, and editor chrome have consistent readable sizing and spacing. |
| 4 | Add deterministic document/resource badges | Generate stable local badge metadata and render compact Shapez.io-style badges in the workspace tree, main tabs, active resource chrome, and command/search results where useful. The base visual space should use `8 × 8 × 8 × 5 = 2560` placement-based combinations across shape, accent, mark, and placement. |
| 5 | Strengthen active-resource highlighting | Make the same active document obvious in tree, tab strip, editor header, and inspector without relying only on text repetition. |
| 6 | Use the Phase 3.3 command system to calm the toolbar | Keep only high-frequency actions visible and move lower-frequency actions into grouped command/menu affordances or the command palette. |
| 7 | Make the utility area a stable drawer/panel | The utility panel must not disrupt the main layout or create horizontal overflow when opened. |
| 8 | Simplify tree and inspector reading paths | Use badges and grouped cards so the left side answers "what resources exist and which is active" and the right side answers "what is this thing and what can I do with it". |
| 9 | Add small empty/error/help states | Cover no document open, unsupported resource, empty workspace, import failure, storage unavailable, and dirty/unsaved indications where they belong. |

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update if needed | Add only the minimal exported badge/resource identity shape if several packages need the same contract. Keep the contract placement-based rather than rotation-based, and keep visual generation policy, persistence, and shell layout out of core. |
| `@textforge/workspace` | Update | Generate and persist stable badge seeds/assignments from resource identity, path/name, resource kind, and language ID. Use the placement-based `8 × 8 × 8 × 5 = 2560` badge space, preserve badges across reload and ZIP export/import where possible, repair collisions deterministically after restore, duplication, batch upload, or ZIP import, and expose diagnostics when repair changes a badge. |
| `@textforge/ui` | Update | Add compact Shapez.io-style geometric badge primitives and the small layout primitives needed for readability: overflow-safe app regions, compact status/header treatments, grouped command/menu presentation, stable utility drawer chrome, inspector cards, empty-state components, active-resource visual states, accessible labels/tooltips, and bundled `lucide-react` icon affordances for generic folder/file/search/import/export/panel/warning/state controls. |
| `@textforge/surfaces` | Update | Carry source-resource badge metadata into surface sessions, tab models, and surface headers without owning badge generation or persistence. Ensure common surface chrome can show compact identity/state indicators without pulling Phase 13 advanced tab management forward. |
| `@textforge/editors` | Validate/update lightly | Ensure text-editor surfaces fit the cleaned shell, keep the editor area readable, preserve CodeMirror ownership, and expose only existing editor state/metadata needed by the chrome. |
| `@textforge/assets` | Validate/update lightly | Ensure image/SVG/PDF/binary viewers fit the cleaned shell and present resource identity/state consistently without changing binary resource semantics. |
| `apps/textforge-web` | Update | Apply the integrated readability pass in the actual shell: no page-level horizontal scrollbar at normal desktop widths, compact header/status rail, toolbar actions routed through Phase 3.3 command composition, badges in tree/tabs/header, clear active-resource state, stable utility drawer, scannable right inspector, and small empty/error/help states. |
| `@textforge/security-profile` | Update | Add or extend checks/documentation to confirm badges and layout polish do not use remote images, external icon fetches, File System Access API identity, directory handles, background sync, remote sync, or silent local-file probing. |
| `@textforge/examples-docs` | Update | Add a short badge/readability style note and sample workspace fixtures showing stable badges, duplicate-name handling, post-import collision repair, and expected shell layout behavior. |

Acceptance criteria: Phase 3.4 is delivered in one coherent implementation pass; the shell has no global horizontal scrollbar at normal desktop widths; the top chrome is calmer and more compact; text, labels, buttons, panels, tabs, and cards are easier to scan; badges are deterministic for stable resources, use the placement-based `8 × 8 × 8 × 5 = 2560` base space, remain visually compact and accessible through text labels/tooltips, stay stable across reload, are preserved through ZIP export/import where possible, and are repaired deterministically when collisions occur; the active document is visibly consistent across tree, tabs, editor/header, and inspector; the utility panel opens without disrupting the main layout; `lucide-react` is the only React icon library used for generic shell affordances; and focused workspace/UI/surface/app/security tests cover the changes.

Scope boundary: no arbitrary user icon picker, no remote image badges, no React icon library beyond bundled `lucide-react`, no semantic meaning encoded only by color, no document-type taxonomy expansion, no file-system-derived identity, no saved layout/session restore, no split panes, no drag/drop tab management, no Phase 13 advanced tab management, and no new plugin/package-management UX.

### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-4-P04..P06`, `ARCH-5.1-P03`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.3-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | No new core concept by default; consume existing surface/session/placement contracts. Add only tiny public types if existing placement/session contracts cannot express popup focus or panel preference state. | No new package install. |
| `@textforge/surfaces` | Restore popup placement as actual app popup/overlay sessions and keep popup sessions separate from the main document strip. | No new package install. |
| `@textforge/ui` | Bounded popup host chrome, resizable shell side panels, chrome deduplication primitives, screenshot-validation helpers, and panel-size affordances. `react-resizable-panels` is pulled forward only for shell side panels, not IDE split panes. | `pnpm --filter @textforge/ui add react-resizable-panels` |
| `@textforge/editors` | Validate that editor surfaces stay readable after side-panel resize/collapse and popup host changes. | No new package install. |
| `@textforge/assets` | Validate that asset/viewer surfaces stay readable after side-panel resize/collapse and popup host changes. | No new package install. |
| `apps/textforge-web` | Integrate popup overlays, resizable left/right panels, deduplicated active-resource chrome, reduced redundant buttons/titles, and screenshot-based UI checks. | No new package install. |
| `@textforge/security-profile` | Confirm popup hosts and resize state remain local UI state only; no detached browser windows, new permissions, remote assets, background sync, or local filesystem access. | No new package install. |
| `@textforge/examples-docs` | Add screenshot-based validation checklist and before/after evidence guidance for wasted space, awkward scrollbars, duplicate titles, and popup behavior. | No new package install. |

Focused follow-on phase after the completed Phase 3.4 readability pass. Phase 3.5 deliberately does **not** pull Phase 13 forward. It fixes the remaining shell usability problems that are visible in the current screenshot: popup content behaves like a side-panel detail view instead of a popup, side panels are fixed-width, collapsed/secondary regions waste horizontal space, top/header/surface labels repeat the active file too many times, and scrollbars appear in awkward shell-level places.

Recommended components of the single Phase 3.5 pass:

| Component | Implementation guidance |
|---|---|
| Real app popups | Popup sessions should render in a bounded floating popup/overlay host with close/focus behavior. The right inspector or utility panel may summarize popup state, but must not be the popup container. |
| Resizable side panels | Left workspace and right inspector/utility regions should have draggable resize handles, sensible min/max widths, and collapsed states that release real workspace area. Persist widths only if cheap and clearly browser-local. |
| Chrome deduplication | Make the document tab/active surface the primary identity point. Remove or collapse duplicate active-resource cards, selection blocks, repeated paths, and top-level buttons that do not add orientation. Target two or three visible instances of the active file name, not six. |
| Header and command cleanup | Keep app-level commands in the app header, document/session commands near tabs/surfaces, and lower-frequency actions in the Phase 3.3 command system. Avoid equal-weight duplicate buttons. |
| Scrollbar discipline | Shell regions should not create global or cross-shell horizontal scrollbars. Horizontal scroll belongs only inside content that genuinely needs it, such as code/editor text. |
| Screenshot validation | Add checklist-driven screenshot review using `roadmap/04_phase_3_5_screenshot_validation_checklist.md` and the reference anti-pattern screenshot under `roadmap/validation/phase-3-5-reference-antipattern.png`. |

Acceptance criteria: Phase 3.5 is delivered as one focused shell-usability pass; popup sessions render as actual in-app popups/overlays rather than only as right-panel or utility-panel content; left and right side panels are resizable within sensible bounds and collapsed panels release real workspace area; active document/resource identity is deduplicated so the same visible title/path appears no more than three times in the normal shell; top-level buttons and titles are reduced or grouped through the Phase 3.3 command system where appropriate; the editor/main surface remains the dominant visual region at normal desktop widths; there is no page-level horizontal scrollbar and no awkward whole-shell scrollbar like the reference screenshot; panel/content scrollbars visually belong to the region they scroll; screenshots at 1440×900 and, where practical, 1920×1080 pass the Phase 3.5 checklist; and focused UI/surface/app/security documentation/tests cover popup, resize, duplicate-chrome, and screenshot-review behavior.

Scope boundary: no Phase 13 advanced tab groups, tab drag/reorder, split panes, saved layout/session restoration, detached browser windows, multi-monitor workflows, deep tab persistence, or full contribution-pack/plugin-management UX. `react-resizable-panels` is allowed only for bounded shell side panels in this phase; dnd-kit and advanced tab movement remain Phase 13.


### Phase 3.6 — Unified workspace resources and representation-based surface routing

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Replace `text`/`binary` as a public resource-kind ontology with minimal resource content/representation contracts. Keep compatibility aliases only if needed for migration, and do not use them for surface eligibility. | No new package install. |
| `@textforge/workspace` | Collapse text/binary file resources into one workspace resource model with a stored content representation: text or bytes. Folders may remain separate workspace entries. Add Dexie/archive compatibility migration without proliferating persistent metadata. | No new package install. |
| `@textforge/surfaces` | Replace hard-coded resource-kind filtering with compatibility predicates based on stored representation, MIME type, language ID, and path/extension. | No new package install. |
| `@textforge/editors` | Make source-editor compatibility depend on text representation and supported language modes, not on a `kind: text` resource discriminator. | No new package install. |
| `@textforge/assets` | Make image/SVG/PDF/binary viewers consume compatible text or byte resources as appropriate. SVG must be openable as both source text and visual image preview; PNG/JPEG/WebP/GIF/PDF remain byte-stored assets. | No new package install. |
| `@textforge/ui` | Update labels, icons, open-with lists, and inspector wording so they describe representation and available surfaces without turning text/binary into a user-facing resource taxonomy. | No new package install. |
| `apps/textforge-web` | Integrate unified resources, safer import classification, representation-aware open-with routing, and placement choice that is not simply `binary => popup`. | No new package install. |
| `@textforge/security-profile` | Confirm the resource-model migration does not introduce File System Access API, directory handles, background sync, remote sniffing, or silent local-file probing. | No new package install. |
| `@textforge/examples-docs` | Add fixtures and guidance for SVG-as-text, PNG-as-bytes, PDF/image viewing, archive migration, and open-with behavior. | No new package install. |

Focused pre-Phase-4 correction. This phase removes the false ontology created by treating `text` and `binary` as durable file kinds. A workspace file/resource should be represented once and store either text or bytes. Surface eligibility should be computed from the resource's stored representation plus lightweight existing facts such as MIME type, language ID, and path/extension.

Important rule: do **not** replace `kind` with a larger persistent metadata taxonomy. Avoid persisted fields such as `openableAs`, `mediaKind`, `detectedBinarySignature`, or `isUtf8Text` unless a narrow test proves that persistence is necessary. Prefer transient helper functions such as `getResourceRepresentation`, `inferLanguageId`, `canOpenWithSurface`, and `createBlobSourceForResource`.

SVG rule: SVG files are text under the hood and should normally be stored as text resources with `mimeType: image/svg+xml` and `languageId: svg`. The SVG visual viewer must be able to preview text-stored SVG by creating a safe local blob/source binding from the text. PNG, JPEG, WebP, GIF, AVIF, PDF, and other opaque assets should stay byte-stored.

Recommended components of the single Phase 3.6 pass:

| Component | Implementation guidance |
|---|---|
| Resource contract simplification | Remove or deprecate `text`/`binary` from the public resource-kind discriminator. Keep folders as separate workspace entries if that remains simpler for the tree, but files should share one resource shape. |
| Storage migration | Replace separate `textResources` and `binaryResources` assumptions with a unified resource store or a compatibility layer that presents unified resources while migrating safely. Existing archives must still import. |
| Import classification | Classify uploads into text or bytes using MIME type, known language definitions, extension, and safe UTF-8 decoding where appropriate. Do not decode obvious opaque byte formats such as PNG/PDF into text. |
| Surface compatibility | Let surfaces declare or implement compatibility predicates. The text editor accepts text representation; the SVG viewer accepts `image/svg+xml` from text or bytes; image/PDF viewers accept suitable byte resources and any safe generated local binding they explicitly support. |
| Open-with correction | The same resource can have multiple valid surfaces. SVG should show both text editor and SVG viewer. Markdown later can show source and preview. Generated SVG from diagrams should be stored as text SVG and previewed visually. |
| Placement correction | Default placement should come from surface/user intent and contribution priority, not from `text` versus `binary`. Asset viewers must be usable in the main surface as well as popups where supported. |
| Minimal metadata discipline | Persist only stable facts already justified by the workspace model: path/title, timestamps, badge, MIME type, language ID, and optional generated/provenance data where Phase 4 needs it. Compute everything else. |

Acceptance criteria: Phase 3.6 is complete when the workspace public API no longer requires users or surfaces to reason in terms of `kind: text` and `kind: binary`; existing stored workspaces and ZIP archives migrate or import safely; SVG is stored as text by default and can open both as source and visual preview; PNG/JPEG/WebP/GIF/PDF do not get imported as text accidentally; open-with candidates are based on representation/MIME/language/path compatibility rather than a hard-coded kind list; main versus popup placement is not controlled by the old text/binary split; metadata remains intentionally small; and focused tests cover upload/import/export, Dexie hydration, archive round-trip, SVG dual-surface routing, opaque-image/PDF byte storage, and surface compatibility.

Scope boundary: no rich Markdown preview work, no Phase 4 diagram generation, no broad package contribution system, no plugin manager, no advanced tabs, no saved layouts, no file-system mirroring, no remote MIME sniffing, no persistent openability taxonomy, and no context-menu UI beyond preserving existing command entry points.

### Phase 3.7 — Context menus as thin command projections

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Add only the minimal target-aware command-context shape needed for context menus, if the existing selection/active-surface context is insufficient. | No new package install. |
| `@textforge/ui` | Add a small accessible context-menu primitive and keyboard/pointer behavior. It should render existing resolved commands, not define a second command system. | No new package install by default. |
| `@textforge/workspace` | Reuse existing workspace command contributions for tree item context menus; add target-context support only where needed. | No new package install. |
| `@textforge/surfaces` | Reuse existing surface/session commands for tab and popup context menus; add target-context support only where needed. | No new package install. |
| `@textforge/editors` | Reuse existing editor commands where they are already valid for the target resource or active text surface. | No new package install. |
| `@textforge/assets` | Reuse existing asset download/open-with actions where they are valid for the target resource. | No new package install. |
| `apps/textforge-web` | Wire context menus for workspace tree items, main tabs, and popup/session chrome using the Phase 3.3 command registry and Phase 3.6 representation-aware context. | No new package install. |
| `@textforge/security-profile` | Verify context menus remain local UI affordances and do not introduce browser permissions, native shell menus, remote actions, or filesystem access. | No new package install. |
| `@textforge/examples-docs` | Document expected context-menu behavior and provide small usage notes or screenshots for workspace tree and tab commands. | No new package install. |

This phase deliberately separates context menus from the Phase 3.6 resource-model correction. A basic context menu is not conceptually large, but it introduces a new command invocation source and a target distinction: the command may apply to the item under the pointer, not necessarily the globally selected item or active surface.

Recommended components of the single Phase 3.7 pass:

| Component | Implementation guidance |
|---|---|
| Target-aware command context | Add a narrow `target` or equivalent command-context field when needed so context-menu actions can apply to the right-clicked tree item, tab, or popup session without silently mutating selection first. |
| Workspace tree context menu | Provide New folder/resource, upload/import into folder, export folder, rename, delete, download file, and open-with actions when already supported by commands and valid for the target. |
| Tab/session context menu | Provide focus, close, refresh, move to main/popup, open-with, and download actions when already supported and valid for the target session/resource. |
| Thin command projection | Context menu entries must be resolved from the same command registry/dispatcher used by toolbar, menu, and command palette. Avoid duplicate hard-coded business logic. |
| Accessibility and fallback | Support pointer context menu, keyboard invocation, Escape dismissal, focus restoration, and graceful fallback to the command palette or top menu for environments where context menu behavior is awkward. |

Acceptance criteria: Phase 3.7 is complete when workspace tree items and surface tabs/session chrome expose relevant context menus backed by the existing command registry; commands can target the context item without forcing a misleading global selection change; disabled/hidden menu entries follow the same command visibility rules as other shell command affordances; context menus are accessible through pointer and keyboard flows; there are no duplicate command implementations in UI components; and tests cover command targeting for workspace items, tabs, popup sessions, and stale/unsupported resources.

Scope boundary: no plugin manager, no external command packs, no diagnostics aggregation UI, no advanced tab drag/reorder, no split panes, no saved layouts, no native OS context-menu integration, no browser File System Access API, and no broad contribution-system changes beyond the smallest target-context contract needed by the existing command dispatcher.


### Phase 4 — Markdown, local assets, and generated diagram assets

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Precondition: Phase 4 must consume the Phase 3.6 unified resource model and Phase 3.7 target-aware command affordances. Local images and generated diagram assets should not reintroduce the old text/binary resource-kind split. Generated SVG assets should be stored as text SVG and still previewable visually; generated PNG assets should be byte-stored.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/pipeline` | Minimal pipeline contribution registry/runner. | `pnpm --filter @textforge/pipeline add @textforge/core@workspace:* @textforge/workspace@workspace:*` |
| `@textforge/markdown` | TF-MD Level 1/2 baseline, markdown-it preview, diagnostics, and local asset resolution. | `pnpm --filter @textforge/markdown add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* markdown-it markdown-it-anchor markdown-it-footnote markdown-it-katex katex` |
| `@textforge/diagrams` | Mermaid and Graphviz rendering pipelines. | `pnpm --filter @textforge/diagrams add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* mermaid @viz-js/viz` |
| `@textforge/assets` | Generated asset provenance/stale display. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Create | Create. Minimal pipeline contribution registry, pipeline runner, trace, generated resource output type. |
| `@textforge/assets` | Update | Update. Add generated asset provenance, stale-state display, SVG/PNG export actions. |
| `@textforge/markdown` | Create | Create. TF-MD baseline processor and preview surface: Markdown-compatible reader, explicit heading anchors, heading/paragraph/inline style references, `tf-md` control block scanner, `%metadata`, `%style`, diagnostics, workspace-relative image resolver, Markdown toolbar for inserting workspace images/diagram blocks, print-optimized HTML baseline, and provisional fenced-block dispatch for known local block types. |
| `@textforge/diagrams` | Create | Create. Mermaid and Graphviz rendering pipelines, generated SVG resource creation, SVG-to-PNG rasterization pipeline, and Markdown-callable handlers for `mermaid`, `dot`, and `graphviz` fenced blocks. |

Phase 4 scope boundary: do not implement `%include`, `%repository`, full `%require` capability resolution, `itm`/`itm-pub` model-aware rendering, or rich Markdown editing here. Phase 4 should preserve unknown fenced blocks as code, emit diagnostics for unsupported known blocks when the selected output needs them, and keep TF-MD runtime/security policy outside the Markdown profile implementation.

### Phase 4.1 — Foundation stabilization before contribution registries

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Required grilling record: read `roadmap/grilling/phase-4.1-grilling.md` before implementation. Phase 4.1 is a mandatory stabilization gate created from accepted grilling decisions. It converts foundation corrections from implemented Phases 0–4 into implementation contracts, audit checks, and validation gates before Phase 5 expands contribution registries and package composition.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Stabilize shared diagnostic, command/action, contribution/default-contribution, capability-state, and public API boundary contracts. | No new package install. |
| `@textforge/workspace` | Align resource identity/content facts and import diagnostics with contribution-driven surface eligibility. | No new package install. |
| `@textforge/surfaces` | Audit and adapt surface eligibility/open-with routing to resource facts and active capability predicates. | No new package install. |
| `@textforge/pipeline` | Audit Phase 4 pipeline registry/trace/diagnostics against the shared diagnostic and active-capability lookup contracts. | No new package install. |
| `@textforge/markdown` | Isolate the Phase 4 provisional dispatcher and shape built-in Markdown block handlers as default contributions. | No new package install. |
| `@textforge/assets` | Treat asset viewers, generated asset actions, and SVG visual/source eligibility as default contribution candidates. | No new package install. |
| `@textforge/editors` | Treat source editors and language support as default contribution candidates. | No new package install. |
| `@textforge/diagrams` | Treat Mermaid and Graphviz handlers/renderers as default contributions ready for Phase 5 manifests. | No new package install. |
| `@textforge/ui` | Audit toolbar/context-menu/surface actions as projections of one command/action spine. | No new package install. |
| `@textforge/security-profile` | Preserve the local artifact contract: source-owned local launch path, no remote/CDN imports, no module-script regression for the shipped local artifact. | No new package install. |
| `apps/textforge-web` | Remove or explicitly mark temporary shell-owned feature logic before Phase 5. | No new package install. |
| `roadmap/` | Store grilling records, update roadmap/package guidance, and append RAPID entries. | No pnpm package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Define or consolidate the shared `Diagnostic` shape, severity set, diagnostic source identity rules, command/action metadata contract, default-contribution manifest minimum, active/available/disabled/missing/failed capability states, short-name conflict rules, and public package API boundary expectations. |
| `@textforge/workspace` | Update | Ensure resources expose stable identity and content facts separately from viewer/editor eligibility; import/detection problems should use shared diagnostics. |
| `@textforge/surfaces` | Update | Route open-with and surface eligibility through resource facts plus capability predicates, not hard text/binary partitions or shell special cases. |
| `@textforge/pipeline` | Update | Align pipeline step identity, diagnostics, trace entries, and generated/intermediate value metadata with the shared contracts Phase 5 will consume. |
| `@textforge/markdown` | Update | Keep Phase 4 block dispatch explicitly provisional, isolate hardcoded handlers, and prepare Mermaid/DOT/math/default Markdown handlers to be registered as default contributions in Phase 5. |
| `@textforge/assets` | Update | Audit asset viewer and generated asset actions as default contributions; validate SVG can be opened as both source text and visual image where facts allow. |
| `@textforge/editors` | Update | Audit CodeMirror/language surfaces as default contributions and avoid shell-owned language routing. |
| `@textforge/diagrams` | Update | Audit Mermaid and Graphviz rendering handlers as default contributions with stable contribution IDs and shared diagnostics. |
| `@textforge/ui` | Update | Confirm toolbar, context menu, surface action, and command-palette invocations use the same command/action model or a documented temporary adapter. |
| `@textforge/security-profile` | Update | Verify the shipped local artifact path remains source-owned and does not depend on dev-server semantics, root-relative assets, remote/CDN imports, or module-script behavior that breaks local/extension execution. |
| `apps/textforge-web` | Update | Perform a focused migration audit for shell-owned handler tables, feature-specific routing, duplicate command/action concepts, and direct cross-package `src/` imports. |
| `roadmap/` | Update | Keep `roadmap/grilling/phase-4.1-grilling.md` and `roadmap/grilling/phase-5-grilling.md`; append RAPID rows for the new gate and Phase 5 grilling decisions. |

Acceptance criteria: Phase 4.1 is complete when the roadmap points to Phase 4.1 as the next gate after Phase 4; Phase 5 explicitly depends on Phase 4.1 closure; shared diagnostics, command/action metadata, default contribution shape, active capability scope, resource fact/surface predicate separation, public package API boundaries, and local artifact validation are defined or consciously adapted; implemented Phase 0–4 code has been audited for blocking shell coupling, hard resource partitions, duplicate command systems, ad hoc diagnostics, and cross-package source imports; blocking findings are fixed or consciously deferred with RAPID entries; and the validation checks from `roadmap/grilling/phase-4.1-grilling.md` are satisfied or explicitly recorded as remaining gaps.

Scope boundary: Phase 4.1 is not a new product-feature phase. Do not implement runtime plugin loading, remote package fetching, `%include`, `%repository`, ITM publication, a package marketplace, advanced package configuration UI, or broad visual-editor work here. Its job is to stabilize the contracts and implementation seams that Phase 5 will use.

### Phase 5 — Contribution registries and package composition

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Canonical manifests, package/capability/contribution identities, status model, pure document resolver, deterministic ordering, diagnostic source identity, and registry/context read model. | No new package install. |
| `@textforge/surfaces` | Package-provided surface registration, active-context compatibility, and intermediate reopening surface selection. | No new package install. |
| `@textforge/pipeline` | Active-capability-scoped step loading, short/qualified-name resolution, conflict diagnostics, intermediate metadata, and golden resolver fixtures. | No new package install. |
| `@textforge/ui` | Minimal package/capability inspector, grouped diagnostics, deterministic package/status views. | No new package install. |
| `@textforge/markdown` | `%require` as activation/check only, default Markdown capabilities, capability-aware fenced-block handlers, and source-identifiable diagnostics. | No new package install. |
| `@textforge/security-profile` | Verify static bundled package composition and confirm `%require` cannot fetch, install, import, or load remote code. | No new package install. |


Precondition: Phase 4.1 must be closed before Phase 5 starts. Read `roadmap/grilling/phase-5-grilling.md` before implementation.

Phase 5 extends the Phase 3.3 shell-command substrate and the Phase 4 provisional Markdown/diagram dispatch into the broader package contribution system. Do not reimplement the command palette here; use Phase 5 to add the remaining contribution kinds and package-composition rules through a canonical contribution/capability model, document-scoped active capability resolver, deterministic resolution, shared diagnostics, and fixture-driven validation.

Phase 5 is limited to static composition of trusted bundled workspace packages. `%require` is an activation/check directive against available bundled capabilities; it must not fetch, install, import, or load remote code.

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Define the canonical contribution manifest, package identity, capability identity, contribution local names, derived canonical contribution IDs, contribution/package status model, document-scoped pure resolver, deterministic ordering, diagnostic source identity rules, and UI-friendly registry/context read model. |
| `@textforge/surfaces` | Update | Update. Add package-provided surface registration and active-document-context surface compatibility, including surface selection for reopening pipeline intermediate values and safe fallback diagnostics. |
| `@textforge/pipeline` | Update | Update. Add active-capability-scoped step contribution loading, short-name and qualified-name resolution, conflict diagnostics, deterministic resolver fixture coverage, intermediate value representation metadata, and reopening through active compatible surfaces. |
| `@textforge/ui` | Update | Update. Add a minimal package/capability inspector showing package status, provided capabilities, active document capabilities, exposed contributions, conflicts, and grouped diagnostics; keep package installation/configuration out of scope. |
| `@textforge/markdown` | Update | Update. Parse `%require` as capability activation/check only, use the default Markdown capability profile, replace the provisional fenced-block dispatcher with capability-aware block-handler contributions, preserve unknown fenced blocks where appropriate, and emit source-identifiable diagnostics for missing processors/renderers/profiles/block handlers. |
| `@textforge/security-profile` | Update | Update. Add or confirm checks/documentation proving Phase 5 package composition is static/bundled and `%require` has no network, remote import, install, repository, or package-loading behavior. |

Phase 5 acceptance criteria: every Phase 5 contribution registers through the canonical core manifest shape; composed packages are bundled workspace packages only; active capabilities are resolved per document through one pure resolver; Markdown activates base Markdown, Mermaid, math, and Graphviz by default; non-default capabilities are inactive unless explicitly activated; capability and contribution identities remain separate; short names resolve only when unambiguous in the active context; qualified references bind to a specific implementation; active short-name conflicts produce blocking diagnostics while inactive conflicts do not; resolver output is deterministic regardless of import order; fenced-block handlers use the contribution/capability-aware contract; `%require` diagnostics are source-identifiable; `%require` cannot fetch or load code; the package inspector exposes package/capability/contribution status; intermediate values reopen through active compatible surfaces or safe fallback; golden fixture packages/documents cover inactive availability, activation, missing capability, inactive conflict, active conflict, qualified binding, disabled package, and inspector read-model determinism.

Phase 5 scope boundary: keep `%include`, `%repository`, remote package loading, ITM publication, runtime plugin installation, package marketplace behavior, and editable package configuration out of this phase.

### Phase 6 — ITM integration and model/report foundation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Parser/serializer/resolver/selectors/styles/views/rules. | `pnpm --filter @textforge/itm add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/pipeline@workspace:* yaml` |
| `@textforge/pipeline` | ITM model value and transformation step contracts. | No new package install. |
| `@textforge/markdown` | TF-MD model-aware `itm` and `itm-pub` fenced blocks. | `pnpm --filter @textforge/markdown add @textforge/itm@workspace:*` |


| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add ITM model value type and ITM-based transformation step contracts. |
| `@textforge/itm` | Create | Create. Parser/serializer/resolver interfaces, selectors, styles, views/viewpoints, validation diagnostics, profile package loading, workspace include resolver contract. |
| `@textforge/editors` | Update | Update. Add ITM source assistance and diagnostics integration. |
| `@textforge/markdown` | Update | Update. Add TF-MD model-aware `itm` and `itm-pub` fenced blocks, ITM diagnostics projection into Markdown source ranges, local embedded model selection, and ITM-driven report fragments. |

### Phase 7 — ITM visual projections

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Projection APIs and generated asset provenance. | No new package install. |
| `@textforge/diagrams` | ITM-to-graph/mindmap adapters and viewers. | `pnpm --filter @textforge/diagrams add cytoscape graphology sigma jsmind` |


| Package | Action | Content |
|---|---|---|
| `@textforge/surfaces` | Update | Update. Add ITM projection surface registrations. |
| `@textforge/itm` | Update | Update. Add projection APIs for tree, graph, mindmap, catalogue, matrix, and report fragments. |
| `@textforge/diagrams` | Update | Update. Add ITM-to-Mermaid, ITM-to-Graphviz, ITM-to-Cytoscape/Sigma adapters where appropriate. |

### Phase 8 — Lua automation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.15-P01..P04`, `ARCH-6.19-P01..P06`, `ARCH-7.10-P01..P05`, `ARCH-11.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/lua` | Restricted Fengari runtime, API allow-list, Lua console surface. | `pnpm --filter @textforge/lua add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* fengari` |
| `@textforge/pipeline` | Lua script pipeline step type. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add Lua-backed pipeline step type and diagnostics mapping. |
| `@textforge/editors` | Update | Update. Add Lua source editor mode and action/snippet authoring helpers. |
| `@textforge/lua` | Create | Create. Fengari worker, sandbox, tf.* capability bridge, Lua editor/console surfaces, action discovery, pipeline action adapter. |

### Phase 9 — Markdown + ITM report generation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/markdown` | TF-MD include/repository resolver and AST-level report pipeline. | `pnpm --filter @textforge/markdown add unified remark-parse remark-rehype rehype-stringify rehype-sanitize rehype-slug rehype-autolink-headings unist-util-visit` |
| `@textforge/itm` | Report fragment model integration. | No new package install. |
| `@textforge/diagrams` | Report asset embedding integration. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Add report-oriented view extraction and model fragment export APIs. |
| `@textforge/markdown` | Update | Update. Add TF-MD `%include` and `%repository` resolution, repository-qualified references, circular include diagnostics, resolved Markdown output, unified/remark/rehype report pipeline, section generation, local asset embedding/resolution, and report preview surface. |
| `@textforge/diagrams` | Update | Update. Ensure generated SVG/PNG assets can be stored and referenced in reports. |

### Phase 10 — BPMN support and first mature visual editor

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/bpmn` | BPMN XML support, bpmn-js viewer/modeler, controlled write-back. | `pnpm --filter @textforge/bpmn add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/editors@workspace:* @textforge/itm@workspace:* bpmn-js bpmn-moddle` |


| Package | Action | Content |
|---|---|---|
| `@textforge/surfaces` | Update | Update. Ensure controlled-write-back capability is represented in surface chrome. |
| `@textforge/pipeline` | Update | Update. Add BPMN XML value and optional BPMN-to-ITM/ITM-to-BPMN extension points. |
| `@textforge/bpmn` | Create | Create. BPMN XML language integration, bpmn-js viewer/modeler surfaces, controlled edit mode, XML patch preview/apply/discard, diagnostics refresh. |

### Phase 11 — Tables, catalogues, and matrices

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/tables` | Semantic table surfaces, CSV/TSV grid, catalogue/matrix abstractions. | `pnpm --filter @textforge/tables add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @textforge/itm@workspace:* @tanstack/react-table` |
| `@textforge/bpmn` | Optional BPMN catalogues. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Expose node/relationship catalogue and matrix projections. |
| `@textforge/ui` | Update | Update. Common table toolbar/filter/sort components. |
| `@textforge/bpmn` | Update | Update. Add BPMN task/event/gateway catalogue surfaces if useful. |
| `@textforge/tables` | Create | Create. TanStack Table semantic table surfaces, CSV/TSV grid editor, catalogue/matrix abstractions, validation issue table. |

### Phase 12 — Enterprise architecture and ArchiMate foundation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-6.18-P08..P12`, `ARCH-11.2-P01..P02`, `ARCH-11.5-P01..P03`, `ARCH-12.2-P01`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/archimate` | ArchiMate ITM profile, exchange XML import/export, EA catalogues/matrices. | `pnpm --filter @textforge/archimate add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/itm@workspace:* @textforge/tables@workspace:* @textforge/markdown@workspace:* fast-xml-parser` |
| `@textforge/markdown` | EA report blocks. | No new package install. |
| `@textforge/tables` | Reusable EA catalogue/matrix editors. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/itm` | Update | Update. Support ArchiMate profile packaging and validation hooks. |
| `@textforge/markdown` | Update | Update. Add EA report blocks: views, catalogues, matrices, traceability tables. |
| `@textforge/tables` | Update | Update. Reusable EA catalogue/matrix editors. |
| `@textforge/archimate` | Create | Create. ArchiMate ITM profile, element/relationship definitions, validation rules, viewpoints, style rules, exchange XML import/export, EA catalogues and matrices. |

### Phase 13 — Stage 2 advanced tabbed main surfaces

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/surfaces` | Advanced placement/session model. | No new package install. |
| `@textforge/ui` | Advanced tab chrome, movement affordances, group-aware keyboard navigation. Reuse the shell side-panel dependency introduced in Phase 3.5. | `pnpm --filter @textforge/ui add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| `@textforge/core` | Stable session persistence types if needed. | No new package install. |


Phase 3.1 may already provide a narrow main-session document tab strip for usability, and Phase 3.5 may already provide real app popup overlays plus resizable shell side panels. Phase 13 is the later advanced tabbed-surface milestone.

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Add stable session persistence types if needed. |
| `@textforge/surfaces` | Update | Update. Add tab groups, tab movement, richer open-to-main/open-as-popup transitions beyond the Phase 3.5 basic popup overlay, optional pinned state, and advanced session semantics. Splits remain future. |
| `@textforge/ui` | Update | Update. Add advanced tab chrome, movement affordances, group-aware keyboard navigation, and richer tab-state indicators. |

### Phase 14 — Rich Markdown editing, optional and round-trip gated

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.12-P01..P05`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/editors` | Rich-editor capability conventions and unsupported-construct diagnostics for TF-MD. | No new package install. |
| `@textforge/markdown` | Milkdown rich Markdown surface behind feature flag. | `pnpm --filter @textforge/markdown add @milkdown/kit @milkdown/react` |


| Package | Action | Content |
|---|---|---|
| `@textforge/editors` | Update | Update. Define rich-editor capability and unsupported-construct warning conventions for TF-MD constructs. |
| `@textforge/markdown` | Update | Update. Add Milkdown rich Markdown surface behind feature flag; preserve source editor fallback; implement round-trip tests for TF-MD control blocks, anchors, styles, includes/repositories, requirements, fenced ITM/Mermaid/DOT/SVG/KaTeX blocks, front matter, and local images. |

### Phase 15 — Controlled graph, diagram, and pipeline editors

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/pipeline` | Visual pipeline editor schema and controlled write-back patches. | No new package install. |
| `@textforge/itm` | Small-subgraph patch contracts and view-layout deltas. | No new package install. |
| `@textforge/diagrams` | Controlled graph/flowchart editor adapter. | `pnpm --filter @textforge/diagrams add @xyflow/react` |


| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Update | Update. Add visual pipeline editor schema and controlled write-back patches. |
| `@textforge/itm` | Update | Update. Add small-subgraph patch contracts and view-layout delta support. |
| `@textforge/diagrams` | Update | Update. Add React Flow adapter for controlled graph/flowchart/layout-delta editing with explicit patch generation. |

### Phase 16 — ArchiMate visual editing investigation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-5.4-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/security-profile` | Dependency/license review for any ArchiMate visual library. | No package install by default; record investigation result before adding anything. |
| `@textforge/archimate` | Experimental ArchiMate visual editor or React Flow fallback. | Candidate only: `pnpm --filter @textforge/archimate add archimate-js` if the investigation accepts it; otherwise use existing `@xyflow/react` through the diagrams fallback path. |


| Package | Action | Content |
|---|---|---|
| `@textforge/security-profile` | Update | Update. Add dependency/license review notes for any adopted ArchiMate visual library. |
| `@textforge/archimate` | Update | Update. Investigate archimate-js; if acceptable, add experimental ArchiMate view editor; otherwise define React Flow fallback. Keep ITM/profile/exchange XML canonical. |

### Phase 17 — Sketch and annotation resources

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.4-P01..P03`, `ARCH-5.11-P01..P09`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`, `ARCH-14.1-P01..P02`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/assets` | Excalidraw sketch/annotation resource surface. | `pnpm --filter @textforge/assets add @excalidraw/excalidraw` |
| `@textforge/markdown` | Sketch asset insertion in reports. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/assets` | Update | Update. Add Excalidraw sketch/annotation resource surface if still desired; store sketch JSON plus SVG/PNG exports as workspace resources. |
| `@textforge/markdown` | Update | Update. Allow insertion of sketch assets into Markdown reports. |

### Phase 18 — Late PDF generation and PDF annotation

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-5.11-P05..P09`, `ARCH-6.18-P26..P29`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/assets` | Optional PDF annotation layer over PDF.js. | No new package install if implemented over existing `pdfjs-dist`; add annotation helper packages only after a RAPID decision. |
| `@textforge/markdown` | Evaluate local Markdown/HTML-to-PDF generation. | No new package install by default; prefer browser print/save-as-PDF until a reliable client-side package is selected. |


| Package | Action | Content |
|---|---|---|
| `@textforge/assets` | Update | Update. Optional PDF annotation layer over PDF.js; store annotations as separate workspace resources/deltas. |
| `@textforge/markdown` | Update | Update. Evaluate local Markdown/HTML-to-PDF pipeline after print HTML stabilizes. |

### Phase 19 — Release-envelope verification and accreditation evidence

#### Architecture and pnpm implementation anchors

Architecture paragraphs to consider: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.20-P01..P07`, `ARCH-11.4-P01`, `ARCH-14-P01..P03`. Resolve these IDs through `roadmap/02_architecture_paragraph_reference_index.md`, which maps each anchor to the exact paragraph/block and line range in `roadmap/textforge_rebuild_whitepaper_main.md`.

Package dependency actions for this phase:

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/security-profile` | Finalize reusable browser-envelope checks and evidence artifacts. | No new package install by default; any additional scanner must pass the license gate and be recorded in RAPID. |
| `@textforge/examples-docs` | Release checklist, sample artifacts, tutorial workspace. | No new package install. |


| Package | Action | Content |
|---|---|---|
| `@textforge/security-profile` | Update | Update. Finalize reusable browser-envelope checks for static/extension/PWA targets and generate evidence artifacts. |
| `@textforge/examples-docs` | Update | Update. Add release checklist, example accreditation output, sample build artifacts, and end-to-end tutorial workspace. |
