# WP-MDPP-BASIC - Basic md++ parser and embedded renderer

## Registry

- Workpackage ID: `WP-MDPP-BASIC`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-MARKDOWN-ITM`
- ADRs: `ADR-0001`

## Outcome

TextForge can open and preview useful md++ documents through the existing local Markdown preview pipeline without adopting the complete md++ runtime, worker, plugin manifest, page-model, or office-import architecture.

## Scope

- Preserve md++ v0.14 reference specs and examples under `docs/reference/specs/mdpp/v0.14/`.
- Add source-order `[md:*]:` directive parsing for metadata, requirements, repositories, includes, themes, stylesheets, and layouts as declared resources.
- Resolve relative and repository-qualified includes/resources through the existing workspace resolver.
- Render md++ through embedded TextForge handlers for Markdown, math, Mermaid, DOT/Graphviz, SVG/data blocks, and model-backed DOT render blocks.
- Produce stable mdpp diagnostics for the implemented parser, include, model, theme, stylesheet, and HTML-contract subset.

## Non-goals

- Full md++ runtime artifacts, worker RPC, plugin manifests, source maps, patches, interactions, visual editing, page model, pagination, PDF export, page furniture, or Office import.
- Replacing TF-MD or changing existing plain Markdown behavior.

## Package Impact

- `@textforge/markdown`
- `@textforge/diagrams`
- `@textforge/workspace`
- `@textforge/core`
- `apps/textforge-web`

## Interfaces / Contracts Changed

- Markdown rendering accepts md++ resource resolution callbacks for includes, stylesheets, and themes.
- Markdown render results expose the detected profile and basic md++ processing metadata.
- Existing Markdown capability requirements include md++ `[md:require]` entries.

## Validation Criteria

See `validation/checklists/workpackages/WP-MDPP-BASIC-basic-mdpp-parser-renderer.md`.

## Evidence Required

- Focused Markdown package tests for md++ directive, include, model, theme, and HTML rendering.
- Focused web integration tests for workspace-backed md++ resource resolution.
- Roadmap generated views refreshed from `roadmap-state.yaml`.
- No headless browser UI validation; request manual checks only for visual preview confirmation.

## Open Decisions

- None for the basic embedded parser/renderer slice.

## Archive Trace

- docs/reference/specs/mdpp/v0.14/
- docs/reference/specs/markdown_profile.md
- roadmap/modules/markdown-itm.md
