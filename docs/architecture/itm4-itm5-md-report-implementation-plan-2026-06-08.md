# ITM4, ITM5, and MD Report Implementation Plan

Snapshot timestamp: **2026-06-08 Europe/Paris**

This document is a planning snapshot. It is not a replacement for `roadmap/roadmap-state.yaml`, which remains authoritative for workpackage status, dependencies, releases, and ADR links.

## Authority and scope

Primary authority used for this plan:

- `roadmap/roadmap-state.yaml`
- `roadmap/workpackages/WP-ITM-04.md`
- `roadmap/workpackages/WP-ITM-05.md`
- `roadmap/workpackages/WP-MD-REPORT.md`
- `roadmap/validation/checklists/workpackages/WP-ITM-04-itm-validation-and-conformance-modules.md`
- `roadmap/validation/checklists/workpackages/WP-ITM-05-parameterized-itm-reports-and-dashboards.md`
- `roadmap/decisions/ADR-0008-itm-validation-and-conformance-modules.md`
- `roadmap/decisions/ADR-0009-parameterized-itm-reports-and-dashboards.md`

Supporting implementation context:

- `docs/architecture/value-oriented-implementation-sequence-2026-06-07.md`
- `docs/architecture/rebuild.md`
- `docs/architecture/itm_markdown_integration_implementation_guidance.md`
- `docs/reference/specs/itm-format.md`
- `docs/reference/specs/markdown_profile.md`
- `packages/itm/test/index.test.js`
- `packages/markdown/test/index.test.js`
- `apps/textforge-web/test/markdownWorkbenchIntegration.test.js`

## Dependency correction

The requested discussion order is `WP-ITM-04`, `WP-ITM-05`, then `WP-MD-REPORT`, but the authoritative dependency order is different.

- `WP-ITM-04` depends on `WP-ITM-02` and `WP-ITM-03`.
- `WP-MD-REPORT` depends on `WP-ITM-01` and `WP-REPO-01`.
- `WP-ITM-05` depends on `WP-ITM-03`, `WP-ITM-04`, `WP-MD-REPORT`, and `WP-ITM-PUB-VISUAL-01`.

That means the executable implementation order must be:

1. `WP-ITM-04`
2. `WP-MD-REPORT`
3. `WP-ITM-05`

The value-oriented planning sequence also places `WP-MD-REPORT` ahead of `WP-ITM-04` and `WP-ITM-05` for product-value reasons, but this document keeps `WP-ITM-04` first because that is the requested workpackage ordering and because `WP-ITM-05` cannot start without it.

## Current implementation baseline

The current repo already provides a meaningful base.

- `packages/itm` already exposes parse, load, validate, projection, visual-target, and `itm-pub` publication paths.
- `packages/markdown` already renders `itm` and `itm-pub` fences through the contribution system.
- `apps/textforge-web` already proves Markdown preview integration for report and mindmap smoke profiles.
- Existing tests already cover repository-backed include resolution, package-rule diagnostics, report-style publication output, and visual publication parity for current non-parameterized flows.

The major missing pieces are:

- `WP-ITM-04` canonical validation model and conformance-module surface.
- `WP-MD-REPORT` explicit active-roadmap acceptance contract and full named-cell/default-import/report-stream implementation boundary.
- `WP-ITM-05` first-class parameter declarations, bounded substitution, transient effective-document execution, generic analytical lenses, and UI parameter execution history.

## WP-ITM-04

### Exact requirements

`WP-ITM-04` must add a deterministic ITM validation and conformance model to `@textforge/itm`.

Required deliverables:

- Canonical `%rule` shape and canonical pipeline-step object form.
- Tolerant shorthand parsing with normalization before execution.
- Strict rejection of ambiguous string pseudo-steps.
- Built-in validation vocabulary for node, relationship, document, type-system, and view validation.
- Automatic declaration-derived constraints from `%entitytype` and `%relationshiptype`.
- Regulated relationship cardinality vocabulary and canonical expanded form.
- Polymorphic type matching by default plus explicit exact-type checks.
- Pattern validation with safe regex semantics.
- Qualified plugin/domain validation steps through `%require`.
- Enforcement that `%begin` / `%end` remain activation-only and reject declaration directives inside scoped blocks.
- Deterministic validation execution order.
- Minimal, standard, and extended diagnostic provenance layers.
- Standard validation modes: `authoring`, `strict`, `publishing`, `export`.
- Conformance-module graph and compliance declaration shape for parsers, backends, and editors.

### Open gates before implementation

- `ADR-0008` is still proposed and should be accepted, revised, or rejected before implementation starts.
- The plugin validation provider manifest shape remains open.
- The initial packaging shape of `itm.validation.builtins` remains open.

### Primary code touch points

- `packages/itm/src/validation.ts`
- `packages/itm/src/loader.ts`
- `packages/itm/src/internal.ts`
- `packages/itm/src/index.ts`
- `packages/itm/test/index.test.js`
- `docs/reference/specs/itm-format.md`
- `docs/examples/`

### Recommended implementation sequence

1. Lock the spec contract for rule shape, execution order, diagnostics, modes, and conformance modules.
2. Add parser/model normalization for canonical pipeline steps and strict-mode invalid forms.
3. Add declaration-derived constraints and built-in validator execution.
4. Add pattern, cardinality, polymorphic, and exact-type semantics.
5. Add plugin-qualified validation-step resolution and missing-capability diagnostics.
6. Add conformance declarations and host-facing support reporting.
7. Audit and migrate examples to canonical validation syntax.
8. Write `roadmap/validation/evidence/WP-ITM-04.md`.

### Validation and evidence

Implementation should satisfy all checklist criteria in:

- `roadmap/validation/checklists/workpackages/WP-ITM-04-itm-validation-and-conformance-modules.md`

Required evidence:

- `docs/reference/specs/itm-format.md`
- `packages/itm/test/index.test.js`
- `docs/examples/`
- `roadmap/validation/evidence/WP-ITM-04.md`

## WP-ITM-05

### Exact requirements

`WP-ITM-05` must make ITM and ITM-in-Markdown reports reusable through host-supplied parameters.

Required deliverables:

- `%param` parsing and model exposure.
- Requiredness inferred from default presence, not a separate `required` field.
- Runtime parameter validation using the v1 parameter type contract.
- `${name}` substitution only in supported locations:
  - directive arguments
  - directive-body scalar values
  - `itm-pub` YAML request fields
- Diagnostics for unsupported substitution locations.
- Loader support for parameter values and transient effective-document generation without source mutation.
- Diagnostics for missing, duplicate, unknown, invalid, unused, rejected, cyclic, unresolved, and out-of-scope parameters.
- Shared effective parameter sets between `.itm`, Markdown `itm`, and `itm-pub`.
- Generic analytical lenses via `itm_lenses.viewpoints`.
- First-class `analyse` pipeline operation.
- Generated parameter forms in the web workbench.
- Local run history stored in session/workspace state, not written into source by default.

### Dependency and scope notes

`WP-ITM-05` must not absorb work from `WP-ITM-EXPLORATION-01`.

It depends directly on:

- `WP-ITM-03`
- `WP-ITM-04`
- `WP-MD-REPORT`
- `WP-ITM-PUB-VISUAL-01`

It also inherits the `ADR-0008` rule that parameterized execution must not reintroduce per-rule disable syntax.

### Open gates before implementation

- `ADR-0009` is still proposed and should be accepted, revised, or rejected before implementation starts.
- Stable output contracts for generic lenses should be fixed before downstream dashboards rely on them.
- Whether CLI/report entry points belong here or in a follow-on remains open.

### Primary code touch points

- `packages/itm/src/loader.ts`
- `packages/itm/src/publication.ts`
- `packages/itm/src/fences.ts`
- `packages/itm/src/internal.ts`
- `packages/itm/test/index.test.js`
- `packages/markdown/test/index.test.js`
- `apps/textforge-web/src/workbench/controller/`
- `apps/textforge-web/test/markdownWorkbenchIntegration.test.js`
- `docs/reference/specs/itm-format.md`

### Recommended implementation sequence

1. Add `%param` parsing, model exposure, and duplicate-declaration diagnostics.
2. Add loader parameter validation and bounded substitution.
3. Extend Markdown and `itm-pub` execution to use the same effective parameter set.
4. Introduce `itm_lenses.viewpoints` and `analyse`.
5. Add UI parameter forms.
6. Add local run history and rerun behavior.
7. Write `roadmap/validation/evidence/WP-ITM-05.md`.

### Validation and evidence

Implementation should satisfy all checklist criteria in:

- `roadmap/validation/checklists/workpackages/WP-ITM-05-parameterized-itm-reports-and-dashboards.md`

Required evidence:

- `docs/reference/specs/itm-format.md`
- `packages/itm/test/index.test.js`
- Markdown / `itm-pub` tests
- `roadmap/validation/evidence/WP-ITM-05.md`

Manual/UI validation is required for parameter forms and run history. Repository guidance prohibits relying on headless browser checks here.

## WP-MD-REPORT

### Exact active-roadmap requirement

`WP-MD-REPORT` is the Markdown + ITM report-generation foundation in `MOD-MARKDOWN-ITM`. It is separate from backend work and is the base for later visual publication parity, rich Markdown authoring, PDF export, and AI Markdown assistance.

The active WP page is intentionally thin, and `roadmap-state.yaml` currently sets `validation_checklist` to `null`. That means implementation planning must draw its detailed acceptance shape from the active adjacent architecture guidance rather than from a missing current checklist.

### Recovered implementation contract

From `docs/architecture/rebuild.md` and `docs/architecture/itm_markdown_integration_implementation_guidance.md`, the practical deliverables are:

- Markdown AST-based report-processing path rather than preview-only HTML treatment.
- ITM block extraction.
- Named ITM model cells.
- At most one default imported model cell.
- Deterministic explicit import graph independent of Markdown block order.
- `itm-pub` block handling for publication logic.
- `%render` and `%inject` support for report sections, tables, diagrams, and injected Markdown.
- Duplicate named-cell diagnostics.
- Derived report artifacts rather than hidden source mutation.
- Report preview/export flow as a report-generation concern, without pulling PDF work into this WP.

### Planning gap

Before implementation starts, this WP needs a first-class active validation checklist. Without that, `WP-MD-REPORT` is the loosest contract in this sequence and risks scope bleed into `WP-ITM-PUB-VISUAL-01`, `WP-MD-RICH`, and `WP-ITM-05`.

### Primary code touch points

- `packages/markdown/src/`
- `packages/itm/src/fences.ts`
- `packages/itm/src/publication.ts`
- `packages/pipeline/` if report orchestration needs package-owned pipeline utilities
- `apps/textforge-web/test/markdownWorkbenchIntegration.test.js`
- `docs/reference/specs/markdown_profile.md`
- `docs/architecture/itm_markdown_integration_implementation_guidance.md`

### Recommended implementation sequence

1. Create an active `WP-MD-REPORT` checklist in `roadmap/validation/checklists/workpackages/`.
2. Freeze the acceptance contract for named cells, default import, import graph, `%render`, `%inject`, diagnostics, and derived output.
3. Implement deterministic document-level ITM cell indexing and import resolution.
4. Implement `itm-pub` report-stream behavior over those resolved sources.
5. Add report-generation diagnostics and generated-artifact output behavior.
6. Expand package and workbench integration tests.
7. Write `roadmap/validation/evidence/WP-MD-REPORT.md`.

### Validation and evidence

Current active requirements are generic only:

- Focused tests/checks for touched packages.
- Updated validation evidence when implementation state changes.
- RAPID entries for material decisions, progress, issues, or risks.

This plan recommends adding an explicit checklist before starting implementation.

## Roadmap documentation maintenance

These maintenance steps apply across all three workpackages.

### Always

- Update `roadmap/roadmap-state.yaml` first for status, dependency, ADR-link, or checklist-path changes.
- Keep workpackage Markdown pages explanatory; do not turn them into a second status tracker.
- Record durable behavior decisions in ADRs.
- Record material progress, issues, risks, and actions in `roadmap/RAPID.md` only.
- Regenerate `roadmap/views/` after registry changes.
- Keep historical material in `archive/` only.

### WP-specific maintenance

- `WP-ITM-04`: resolve `ADR-0008`, update `docs/reference/specs/itm-format.md`, audit examples, and maintain `roadmap/validation/evidence/WP-ITM-04.md`.
- `WP-MD-REPORT`: add the missing active checklist, update Markdown/ITM integration docs as needed, and maintain `roadmap/validation/evidence/WP-MD-REPORT.md`.
- `WP-ITM-05`: resolve `ADR-0009`, update `docs/reference/specs/itm-format.md`, update parameterized examples, and maintain `roadmap/validation/evidence/WP-ITM-05.md`.

### Manual validation rule

If UI verification is needed for `WP-MD-REPORT` or `WP-ITM-05`, use manual user-run validation. Repository guidance explicitly says not to spend time on headless browser UI checks in this repo.

## Recommended delivery slices

### Slice 1

- Governance gate for `ADR-0008`
- `WP-ITM-04` spec lock
- `WP-ITM-04` parser/model normalization

### Slice 2

- `WP-ITM-04` validator execution, diagnostics, and conformance declarations
- `WP-ITM-04` example migration and evidence

### Slice 3

- `WP-MD-REPORT` checklist creation
- `WP-MD-REPORT` named/default model cell and import-graph implementation

### Slice 4

- `WP-MD-REPORT` `%render` / `%inject` report stream
- `WP-MD-REPORT` report diagnostics and evidence

### Slice 5

- Governance gate for `ADR-0009`
- `WP-ITM-05` `%param` model and loader support

### Slice 6

- `WP-ITM-05` Markdown / `itm-pub` parameter sharing
- `WP-ITM-05` generic lenses and `analyse`

### Slice 7

- `WP-ITM-05` parameter forms
- `WP-ITM-05` run history
- `WP-ITM-05` manual validation and evidence

## Summary

The main planning conclusions are:

- `WP-ITM-04` is the validation/conformance foundation and should be treated as a spec-first domain contract change in `packages/itm`.
- `WP-MD-REPORT` is currently the biggest roadmap documentation gap because it has no active checklist; closing that gap is part of implementation planning, not optional cleanup.
- `WP-ITM-05` cannot start in earnest until both `WP-ITM-04` and `WP-MD-REPORT` are in place, because it relies on deterministic validation and a stable Markdown/`itm-pub` report-execution base.
