# TextForge V15 Package-Aware Roadmap

This roadmap interweaves the architecture milestones with the package split. It is intentionally package-oriented: every phase states which packages are created or updated and what each package receives.

## Repository model used by this roadmap

This roadmap assumes one Git repository with pnpm workspaces. Each phase may update several packages in one branch, but each package keeps its own public API, tests, documentation, and versioning metadata. Changes should be made through package contribution manifests rather than by centralizing feature logic in the app shell. Git submodules are deliberately excluded from the initial rebuild because they make cross-package agentic changes and pull requests unnecessarily fragile.

## Roadmap principle

```text
Stable contracts in the center.
Feature packages contribute through manifests.
The application shell composes packages; it should not own feature logic.
```


## Agent operating model

The roadmap is not only a planning document. In the repository, it must live in the `roadmap/` folder together with an `AGENTS_START_HERE.md` instruction and a continuously maintained `RAPID.md`.

Every agent run must:

```text
1. Read AGENTS_START_HERE.md.
2. Read RAPID.md.
3. Determine the current milestone.
4. Implement the next coherent milestone or sub-milestone.
5. Commit after the milestone, or more frequently if a task is risky or logically complete.
6. Update RAPID.md with choices, assumptions, deviations, and clarifications.
7. Review the next roadmap step and update instructions if implementation reality has changed.
```

During implementation, the agent should build, test, lint, or typecheck progressively using the narrowest relevant commands that exist for the changed slice. Before any milestone commit, the agent should run the best available verification for that milestone scope and record any remaining verification gap in `RAPID.md`.

Low-risk assumptions may be made explicitly and recorded. High-impact assumptions about architecture, security, licensing, package boundaries, canonical formats, public APIs, or visual-editor write-back must stop the work and trigger a clarification request.

Instruction updates are part of the work product. If a milestone changes the plan, include the roadmap update in the same commit so the evolution of the plan is traceable.

## Milestones

### Phase -1 — Repository pivot and archival preservation

| Area | Action | Content |
|---|---|---|
| Git repository | Preserve | Tag current implementation as `textforge-v1-final`; create `archive/v1-current`; create `rewrite/v2-monorepo` for the rebuild. |
| Legacy material | Preserve selectively | Move useful docs, specs, examples, fixtures, whitepapers, test notes, and attribution material into `docs/legacy`, `docs/specs`, `docs/design`, and `fixtures/legacy`. Do not bulk-copy the old implementation into the new tree. |
| Rewrite branch | Clean | Remove old implementation files on the rewrite branch after preservation. Keep the project name and Git history. |
| Monorepo skeleton | Create | Add pnpm workspace root, `apps/textforge-web`, package folders, package placeholder manifests, README, and pivot log. |
| Roadmap folder | Create | Add `roadmap/AGENTS_START_HERE.md`, `roadmap/00_package_aware_roadmap.md`, `roadmap/01_repository_and_package_strategy.md`, `roadmap/02_repository_pivot_instruction.md`, and `roadmap/RAPID.md`. |
| Pivot instruction | Follow | Execute `roadmap/02_repository_pivot_instruction.md` before feature implementation begins. |

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
| `@textforge/editors` | Update | Update. Add CodeMirror language modes/configuration for Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate exchange XML, CSV/TSV, Mermaid, DOT, SVG, YAML. |

### Phase 3 — ZIP workspace import/export

| Package | Action | Content |
|---|---|---|
| `@textforge/workspace` | Update | Update. Add fflate ZIP import/export, selected-folder export, full-workspace export, workspace manifest, path normalization, conflict policy. |
| `@textforge/security-profile` | Update | Update. Add generic checks for forbidden privileged filesystem APIs and archive boundary documentation. Do not inspect TextForge internal gateway discipline. |
| `@textforge/assets` | Update | Update. Ensure binary files round-trip through workspace ZIP. |

### Phase 4 — Markdown, local assets, and generated diagram assets

| Package | Action | Content |
|---|---|---|
| `@textforge/pipeline` | Create | Create. Minimal pipeline contribution registry, pipeline runner, trace, generated resource output type. |
| `@textforge/assets` | Update | Update. Add generated asset provenance, stale-state display, SVG/PNG export actions. |
| `@textforge/markdown` | Create | Create. markdown-it preview surface, workspace-relative image resolver, Markdown toolbar for inserting workspace images/diagram blocks, print-optimized HTML baseline. |
| `@textforge/diagrams` | Create | Create. Mermaid and Graphviz rendering pipelines, generated SVG resource creation, SVG-to-PNG rasterization pipeline. |

### Phase 5 — Contribution registries and package composition

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Finalize contribution pack manifest shape and dependency declarations. |
| `@textforge/surfaces` | Update | Update. Add package-provided surface registration and capability-filtered commands. |
| `@textforge/pipeline` | Update | Update. Add step contribution loading, diagnostics aggregation, intermediate value reopening. |
| `@textforge/ui` | Update | Update. Add command palette and contribution-driven menu/toolbar slots. |

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

### Phase 13 — Stage 2 tabbed main surfaces

| Package | Action | Content |
|---|---|---|
| `@textforge/core` | Update | Update. Add stable session persistence types if needed. |
| `@textforge/surfaces` | Update | Update. Add tabbed main surface groups, tab movement, open-to-main/open-as-popup transitions. Splits remain future. |
| `@textforge/ui` | Update | Update. Add tab chrome and keyboard navigation. |

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

