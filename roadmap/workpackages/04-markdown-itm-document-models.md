# 04 — Markdown, ITM, and Document Models

This cluster covers TextForge Markdown, ITM, report generation, packages, repositories, validation, and document-model semantics.

## Workpackages

| WP | Title | Depends on | Notes |
|---|---|---|---|
| WP-ITM-01 | ITM parser/model foundation | WP-05A recommended | Parser/model foundation with explicit public APIs, diagnostics taxonomy, and downstream phase contracts. |
| WP-ITM-02 | ITM directives, packages, validation, diagnostics | WP-ITM-01, WP-05B | `%require` and package/capability evaluation on top of WP-ITM-01 parser/model contracts. |
| WP-REPO-01 | Repository reference and include resolver | WP-RES-01, WP-ITM-01 | Provider-resolved `%repository`/`%include`. |
| WP-MD-REPORT | Markdown + ITM report generation | Markdown base, WP-ITM-01, WP-REPO-01 | Keeps the old Phase 9 report role separate from backend work. |
| WP-MD-RICH | Rich Markdown editing | Markdown/report baseline | Optional and round-trip gated. |
| WP-PDF-EXPORT | PDF generation/export | WP-MD-REPORT | Optional late export capability. |

## WP-ITM-01 implementation foundation

Implementation anchors for this workpackage:

- Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`.
- Bootstrap dependency action:

```sh
pnpm --filter @textforge/itm add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/pipeline@workspace:* yaml
```

WP-ITM-01 owns the package foundation required by downstream phases:

- Parse/serialize interfaces for canonical ITM source text.
- Resolver interfaces for declarations and include flows (provider-driven, not direct frontend fetch).
- Selector/style/view/viewpoint/profile interfaces for stable projection and publication contracts.
- Validation diagnostics and diagnostic taxonomy that downstream packages can consume consistently.
- Public APIs needed by `@textforge/markdown` to parse `itm` blocks, project diagnostics, and render `itm-pub` publication views.

## WP-ITM-01 public API scope and downstream bindings

WP-ITM-01 is intentionally broader than "parser only" but narrower than directive/package execution:

- Export stable contracts for parse, serialize, resolve, validate, and project operations.
- Expose selector/style/viewpoint/profile interfaces without binding to app-shell internals.
- Keep package integrations on public exports and contribution manifests, not private imports.

The workpackage must preserve downstream compatibility for these follow-on consumers:

- Phase 7 (`WP-ITM-VISUALS`): projection APIs for tree/graph/mindmap/catalogue/matrix/report fragments.
- Phase 9 (`WP-MD-REPORT`): report-oriented extraction and model fragment export for resolved Markdown publication.
- Phase 11 (`WP-TABLES`): node/relationship catalogue and matrix projections.
- Phase 12 (`WP-ARCHIMATE-SEM`): profile packaging and validation hooks for ArchiMate semantic profiles.
- Phase 15 (`WP-GRAPH-EDIT`): small-subgraph patch contracts and view-layout delta support.

## WP-ITM-01 and WP-ITM-02 scope boundary

WP-ITM-01 and WP-ITM-02 are split to avoid scope creep and to keep activation semantics tied to Phase 5 contracts:

- WP-ITM-01 owns parser/model/resolver public interfaces, selectors/styles/views abstractions, diagnostics taxonomy, and compatibility contracts.
- WP-ITM-02 owns `%require` directive handling, package/capability evaluation, selector/rule validation execution, and diagnostics derived from active capability context.
- WP-ITM-02 depends on `WP-05B` because resolver context and capability activation are part of directive/package semantics.

## WP-ITM-01 acceptance criteria and invariants

Definition-of-done expectations for WP-ITM-01:

- Parser/serializer round-trip tests for canonical ITM fixtures.
- Resolver tests that include unresolved, unsupported, unauthorized, unavailable, conflicting alias, and version/capability mismatch outcomes.
- Selector/style/view tests and profile fixture coverage.
- Validation diagnostics coverage with stable error categories consumable by Markdown and surface layers.

Backend-optional invariants that must hold:

- `%repository` values are provider-resolved declarations, not direct frontend fetch instructions.
- Local/offline mode does not convert repository hints into arbitrary network access.
- Optional backend capabilities may hide/disable actions or emit diagnostics, but do not alter canonical document semantics.

## Recovery-phase compatibility note

WP-ITM-01 should begin only after the recovery baseline from Phases 3.1-3.3 is usable: React shell, Dexie workspace persistence, and shell command composition must already expose stable public contracts that ITM integrations consume.

## Canonical specs

- `specs/architecture/textforge-markdown-profile.md`
- `specs/architecture/backend-optional-architecture.md`
- `package-guides/markdown.md`
- `package-guides/itm.md`
- `grilling/backend-grilling.md`

## Key constraints

- The canonical source remains text.
- Rich editors are optional and must be round-trip gated.
- Includes and repositories are resolved by active providers; frontend does not fetch arbitrary URLs in local/offline mode.
- Document semantics do not change when optional backend capabilities are unavailable.
