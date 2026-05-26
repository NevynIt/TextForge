# @textforge/editors — Package Implementation Guide

## Purpose

CodeMirror-based source editor surfaces, language modes, lint bridge, source navigation hooks, and low-risk authoring helpers.

## Ownership rule

`@textforge/editors` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/surfaces`
- `@textforge/ui`

Third-party candidates: CodeMirror 6. All third-party dependencies must pass the open-source license gate.

## Public surface

Source editor surfaces, language mode registry, lint bridge, editor commands, source navigation helpers.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Implementation anchors:

- Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 1: `pnpm --filter @textforge/editors add @textforge/core@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/search`


Create. CodeMirrorTextEditorSurface with generic text editing and source range hooks.

### Phase 2 — Source-editor coverage and language foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.6-P01..P04`, `ARCH-6.6-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 2: `pnpm --filter @textforge/editors add @codemirror/lang-markdown @codemirror/lang-json @codemirror/lang-xml @codemirror/lang-yaml @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript @codemirror/legacy-modes @codemirror/lint`


Update. Add CodeMirror language modes, syntax highlighting, and editor configuration for Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate exchange XML, CSV/TSV, Mermaid, DOT, SVG, YAML.

### Phase 3.1 — React workbench shell and UI recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.1: `pnpm --filter @textforge/editors add react react-dom`; `pnpm --filter @textforge/editors add -D @types/react @types/react-dom`


Update only as needed to ensure existing CodeMirror source-editor surfaces mount correctly through the React shell and preserve source selection/range hooks. Do not add rich editing, new language features, or domain authoring helpers here.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install.


Update only to expose existing source-editor actions as command descriptors where they already exist. Do not add new editor behaviour simply to populate the command palette.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Validate/update lightly. Ensure the text-editor surface fits the cleaned workbench layout, keeps the CodeMirror area readable, preserves existing editor ownership, and exposes only existing editor state/metadata needed by common chrome. Do not add rich editing, new document types, or new command semantics in this phase.

### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.6-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.5: No new package install.


Validate/update lightly. Keep the text-editor surface readable when shell side panels resize or collapse, and reduce duplicate editor-header identity where needed without changing CodeMirror ownership, language behavior, or the existing source-editor workflow.

### Phase 3.6 — Unified workspace resources and representation-based surface routing

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.6: No new package install.


Update. Make the source editor compatible with resources whose stored representation is text and whose language mode is supported or can fall back to plaintext. Do not require `kind: text`.

SVG is a required validation case: `.svg`/`image/svg+xml` should be edited as source text through the SVG language mode and also remain available to the visual SVG viewer. Opaque assets such as PNG or PDF should not be coerced into source-editor resources unless a user explicitly creates/imports text content.

### Phase 3.7 — Context menus as thin command projections

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.7: No new package install.


Update only as needed to let existing editor commands resolve against an explicit context target when the target is a text-representation resource or active text surface. Do not add rich editing, source transformations, or new language behavior in this phase.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Audit CodeMirror source editor surfaces and language support as default contribution candidates with stable contribution IDs and capability associations. Ensure source-editor eligibility is based on resource facts and capability predicates rather than app-shell file-type branches.

### Phase 6 — ITM integration and model/report foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Add ITM source assistance and diagnostics integration.

### Phase 8 — Lua automation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.15-P01..P04`, `ARCH-6.19-P01..P06`, `ARCH-7.10-P01..P05`, `ARCH-11.1-P01..P02`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Add Lua source editor mode and action/snippet authoring helpers.

### Phase 14 — Rich Markdown editing, optional and round-trip gated

Implementation anchors:

- Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.12-P01..P05`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 14: No new package install.


Update. Define rich-editor capability and unsupported-construct warning conventions for TF-MD constructs, including control blocks, includes/repositories, requirements, fenced model/diagram blocks, and local asset references.


## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Language mode smoke tests, lint bridge tests, source navigation tests, fallback source editor tests, React-shell mounting smoke tests after Phase 3.1, command descriptor tests after Phase 3.3 where applicable, text-editor fit/readability checks after Phase 3.4, screenshot/layout checks after Phase 3.5, text-representation compatibility tests after Phase 3.6, and context-target editor command checks after Phase 3.7.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 1 closure note

The current runnable shell uses `@codemirror/state` and `@codemirror/view` through `createCodeMirrorTextEditorSurface`. The surface mounts a real CodeMirror 6 `EditorView`, exposes the mounted engine marker for validation, and keeps source-range/selection state synchronized from CodeMirror updates.

## Phase 2 progress note

The package now consumes the shared language definitions from `@textforge/core`, exposes the Phase 2 language-mode metadata for every registered source language, mounts parser-backed CodeMirror integrations for Markdown, Lua, JSON, XML-family formats, SVG, and YAML, and applies a package-owned dark syntax highlighting palette in the shell. ITM, CSV/TSV, Mermaid, and DOT remain explicit metadata-only/source-fallback modes until a suitable parser-backed integration is adopted.

## Phase 3.1 closure note

No new editor behaviour was pulled forward for this phase. The existing CodeMirror surface still mounts through `createCodeMirrorTextEditorSurface(...)`, and the React shell continues to drive package-owned language-mode and open-with controls instead of duplicating editor logic in the app.

Browser validation of the recovered shell confirmed that the CodeMirror editor still mounts, remains editable inside the React frame, and preserves the established source-editor workflow without broadening the package scope.

## Phase 3.3 closure note

The package now exposes the existing source-editor language-mode changes as shell command descriptors rather than only through the surface-side select control. No new editor behavior was added to populate the palette; the command layer simply routes the already-supported language-mode change path through the shared shell command substrate.

## Phase 3.5 closure note

The editor surface keeps the same CodeMirror ownership and language workflow, but its shared header now uses a generic `Source editor` label so the surrounding shell can keep visible active-title repetition within the Phase 3.5 bounds. Browser validation at the required desktop states confirms the text surface remains the dominant region while the resized shell rails and popup overlay chrome stay outside the editor's behavior contract.

## Phase 4.1 closure note

The package now exposes the CodeMirror source editor and language-mode actions as default-active contributions with stable capability IDs so the shell can consume them through registration rather than bespoke editor lists. The runtime persistence wiring in the app remains an explicitly marked temporary adapter for Phase 5, but the editor-facing metadata and selection of active built-ins is now package-registered.

## WP-05C progress note

The CodeMirror source-editor contribution now owns its registered opening path as well as its metadata. The shell provides persistence callbacks and current-session state, but it no longer switches on the editor contribution ID to decide how to mount the runtime surface.
