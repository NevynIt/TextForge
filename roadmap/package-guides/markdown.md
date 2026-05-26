# @textforge/markdown — Package Implementation Guide

## Purpose

Markdown preview, TF-MD profile processing, report pipeline, workspace image resolution, embedded diagrams, embedded ITM publication blocks, resolved Markdown output, and print-optimized HTML.

## Ownership rule

`@textforge/markdown` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/workspace`
- `@textforge/surfaces`
- `@textforge/pipeline`
- `@textforge/assets`
- `@textforge/diagrams`
- `@textforge/itm`

Third-party candidates: markdown-it, unified/remark/rehype, KaTeX integration hooks. All third-party dependencies must pass the open-source license gate.

## Public surface

Markdown preview/report surfaces, TF-MD parser/diagnostics interfaces, Markdown pipelines, local asset resolver integration, fenced-block handler integration, resolved Markdown output, and report block contribution APIs.

## Milestone plan

### Phase 3.1–3.3 — Recovery-phase compatibility

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`, `ARCH-6.7-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


No direct Markdown feature work. These phases establish React shell usability, Dexie persistence, and shell-command composition. This package should not be started early, but later work must consume the resulting workspace, surface, and command contracts through public interfaces.

### Phase 3.6–3.7 — Pre-Markdown resource and shell readiness

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`.
- pnpm packages: No direct package install in these compatibility phases.

No direct Markdown feature work. Phase 4 must consume the unified resource model from Phase 3.6: SVG assets should be text-stored and still visually previewable, opaque images/PDF should be byte-stored, and local Markdown image resolution should rely on representation-aware workspace/surface contracts. Phase 3.7 context menus may later expose Markdown commands, but this package should not start the Markdown preview/report implementation before Phase 4.

### Phase 4 — Markdown, local assets, and generated diagram assets

TF-MD responsibility: implement the baseline profile slice from `roadmap/specs/textforge_markdown_profile.md`, including Level 1 anchors/style references and Level 2 `tf-md` control blocks with `%metadata`, `%style`, and diagnostics. This is a Markdown-profile baseline phase, not a complete composition/report phase.

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 4: `pnpm --filter @textforge/markdown add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* markdown-it markdown-it-anchor markdown-it-footnote markdown-it-katex katex`


Create. TF-MD baseline processor and markdown-it preview surface: Markdown-compatible reader, explicit heading anchors, heading/paragraph/inline style references, `tf-md` control block scanner, `%metadata`, `%style`, diagnostics, workspace-relative image resolver, Markdown toolbar for inserting workspace images/diagram blocks, print-optimized HTML baseline, and provisional fenced-block dispatch for known local block types. Preserve unknown fenced blocks as code.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Keep the Phase 4 fenced-block dispatcher explicitly provisional. Isolate hardcoded handlers and shape built-in Markdown, Mermaid, DOT/Graphviz, math, SVG/JSON/YAML, and local asset behaviors as default contributions with stable IDs, capability associations, shared diagnostics, and local-artifact compatibility notes.

### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Parse `%require` as capability activation/check only against bundled registered capabilities. Replace the Phase 4 provisional fenced-block dispatcher with capability-aware block-handler contributions resolved through the document capability context. Use the default Markdown capability profile for base Markdown, Mermaid, math, and Graphviz; preserve unknown fenced blocks where appropriate; emit source-identifiable diagnostics for missing processors, renderers, profiles, or block handlers. Do not implement `%include`, `%repository`, remote package loading, or ITM publication in this phase.

### Phase 6 — ITM integration and model/report foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`.
- pnpm packages: Phase 6: `pnpm --filter @textforge/markdown add @textforge/itm@workspace:*`


Update. Add TF-MD model-aware `itm` and `itm-pub` fenced blocks, ITM diagnostics projected into Markdown source ranges, local embedded model selection, and ITM-driven report fragments.

### Phase 9 — Markdown + ITM report generation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 9: `pnpm --filter @textforge/markdown add unified remark-parse remark-rehype rehype-stringify rehype-sanitize rehype-slug rehype-autolink-headings unist-util-visit`


Update. Add TF-MD `%include` and `%repository` resolution, repository-qualified references, circular include diagnostics, resolved Markdown output, unified/remark/rehype report pipeline, section generation, local asset embedding/resolution, and report preview surface.

### Phase 12 — Enterprise architecture and ArchiMate foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-6.18-P08..P12`, `ARCH-11.2-P01..P02`, `ARCH-11.5-P01..P03`, `ARCH-12.2-P01`.
- pnpm packages: Phase 12: No new package install.


Update. Add EA report blocks: views, catalogues, matrices, traceability tables.

### Phase 14 — Rich Markdown editing, optional and round-trip gated

Implementation anchors:

- Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.12-P01..P05`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 14: `pnpm --filter @textforge/markdown add @milkdown/kit @milkdown/react`


Update. Add Milkdown rich Markdown surface behind feature flag; preserve source editor fallback; implement round-trip tests for TF-MD control blocks, anchors, styles, includes/repositories, requirements, fenced ITM/Mermaid/DOT/SVG/KaTeX blocks, front matter, and local images.

### Phase 17 — Sketch and annotation resources

Implementation anchors:

- Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-5.11-P01..P09`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 17: No new package install.


Update. Allow insertion of sketch assets into Markdown reports.

### Phase 18 — Late PDF generation and PDF annotation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.11-P05..P09`, `ARCH-6.18-P26..P29`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 18: No new package install by default; prefer browser print/save-as-PDF until a reliable client-side package is selected.


Update. Evaluate local Markdown/HTML-to-PDF pipeline after print HTML stabilizes.

## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Markdown rendering tests, TF-MD profile fixture tests, `tf-md` directive diagnostics, workspace image resolution tests against Phase 3.6 unified resources, fenced-block preservation tests, `%require` capability diagnostics after Phase 5, `itm`/`itm-pub` integration tests after Phase 6, include/resolved Markdown/report pipeline tests after Phase 9, and rich-editor round-trip tests after Phase 14.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 4 closure note

The package now delivers the Phase 4 TF-MD baseline: a Markdown preview surface, `%metadata` and `%style` control-block parsing, explicit heading anchors plus heading/paragraph/inline style references, workspace-relative image resolution against unified resources, provisional fenced-block dispatch for the known local block set, and print-optimized HTML export. Unknown fences are still preserved as code, while `%include`, `%repository`, `%require`, and ITM publication remain deferred to their planned later phases.

## Phase 4.1 closure note

The package now keeps the fenced-block dispatcher explicitly provisional by shaping its built-ins as default contribution records with stable IDs, capability associations, and structured diagnostics. Markdown preview resolution now consumes the shared contribution registry for active fence handlers, reports active handler conflicts or unavailable registered handlers through the shared diagnostic shape, and preserves the local-artifact-safe preview path.

## WP-05B progress note

The package now parses `%require` as capability activation input for the shared document resolver instead of reporting it as an unsupported TF-MD directive. Markdown preview consumes the resolved document capability context, keeps Mermaid/math/Graphviz plus base Markdown defaults active for Markdown resources, and leaves SVG/JSON/YAML fenced-block renderers inactive until the document explicitly activates them.

## WP-05C progress note

The package now resolves active fence handlers directly from the current document contribution context and creates a document-scoped pipeline runner for fence execution. Mermaid and Graphviz blocks therefore run through canonical active pipeline contributions rather than ad hoc shell runtime adapters, while the preview surface itself now opens through package-owned contribution execution instead of a shell-local `contributionId` branch.


## V16 backend-optional responsibilities

`@textforge/markdown` must preserve TF-MD document semantics independently from optional backend capabilities. `%include` and `%repository` resolution must use provider/repository contracts and diagnostics. Missing backend/GitLab/AI/service capabilities may disable actions or emit diagnostics, but must not change how Markdown is parsed.
