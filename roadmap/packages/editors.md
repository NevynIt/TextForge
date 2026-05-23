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

Create. CodeMirrorTextEditorSurface with generic text editing and source range hooks.

### Phase 2 — Source-editor coverage and language foundation

Update. Add CodeMirror language modes, syntax highlighting, and editor configuration for Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate exchange XML, CSV/TSV, Mermaid, DOT, SVG, YAML.

### Phase 3.1 — React workbench shell and UI recovery

Update only as needed to ensure existing CodeMirror source-editor surfaces mount correctly through the React shell and preserve source selection/range hooks. Do not add rich editing, new language features, or domain authoring helpers here.

### Phase 3.3 — Command palette and contribution-driven shell commands

Update only to expose existing source-editor actions as command descriptors where they already exist. Do not add new editor behaviour simply to populate the command palette.

### Phase 6 — ITM integration and model/report foundation

Update. Add ITM source assistance and diagnostics integration.

### Phase 8 — Lua automation

Update. Add Lua source editor mode and action/snippet authoring helpers.

### Phase 14 — Rich Markdown editing, optional and round-trip gated

Update. Define rich-editor capability and unsupported-construct warning conventions.

## Tests and definition of done

Language mode smoke tests, lint bridge tests, source navigation tests, fallback source editor tests, React-shell mounting smoke tests after Phase 3.1, and command descriptor tests after Phase 3.3 where applicable.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 1 closure note

The current runnable shell uses `@codemirror/state` and `@codemirror/view` through `createCodeMirrorTextEditorSurface`. The surface mounts a real CodeMirror 6 `EditorView`, exposes the mounted engine marker for validation, and keeps source-range/selection state synchronized from CodeMirror updates.

## Phase 2 progress note

The package now consumes the shared language definitions from `@textforge/core`, exposes the Phase 2 language-mode metadata for every registered source language, mounts parser-backed CodeMirror integrations for Markdown, Lua, JSON, XML-family formats, SVG, and YAML, and applies a package-owned dark syntax highlighting palette in the shell. ITM, CSV/TSV, Mermaid, and DOT remain explicit metadata-only/source-fallback modes until a suitable parser-backed integration is adopted.
