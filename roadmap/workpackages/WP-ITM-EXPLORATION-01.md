# WP-ITM-EXPLORATION-01 - Interactive ITM exploration workbench

## Registry

- Workpackage ID: `WP-ITM-EXPLORATION-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-SURFACES-UI`
- ADRs: `ADR-0010`

## Outcome

TextForge provides an interactive model exploration workbench where parameterized ITM reports, live selectors, validation diagnostics, generic lenses, transformations, dashboards, visual target composition, and transient surfaces operate over the same effective ITM model without modifying canonical source until explicit promotion.

## Scope

- Add exploration session model over base model, includes, packages, parameterized files, parameter values, and live snippets.
- Add parameter runner entry point for parameterized `.itm` and `.md` files.
- Add Selector Lab with live diagnostics, result counts, result modes, match explanations, scratch selectors, and conversion to `%view`, `%rule`, or `%style`.
- Add Rule / Validation Lab over base, included, package, parameterized, and live rules.
- Add generic lens dashboard tabs for structure, identity, relationships, profile usage, attributes, diagnostics, rules, views/viewpoints, graph metrics, and selector results.
- Add View and Viewpoint Lab for combining stored and live view/viewpoint/style/projection choices.
- Add Visual Target Composer for transient visual outputs.
- Add Transformation Playground for selector, graph, report, diagnostics, matrix, BPMN, ArchiMate, Mermaid, DOT, and JSON outputs.
- Add transient surface lifecycle actions: pin, rename, compare, export, refresh, promote, discard.
- Add explicit promotion workflows for selectors, rules, styles, views, viewpoints, run history, semantic source patches, and visual deltas.

## Non-goals

- Replacing ITM files, `itm-pub`, or existing visual targets.
- Adding new `%test` or `%assert` directives.
- Persisting transient exploration state into source without explicit promotion.
- Implementing domain-specific BPMN or ArchiMate completeness inside the generic workbench.
- Browser UI verification by headless browser.

## Package Impact

- `apps/textforge-web`
- `packages/itm`
- `packages/visual-itm`
- publication, table/catalogue/matrix, and renderer packages touched by workbench surfaces

## Interfaces / Contracts Changed

- Workbench gains an exploration session model.
- Selector engine exposes match explanations and result modes.
- Validation results are grouped by rule/provider/severity/file for UI consumption.
- Transient surfaces gain lifecycle and promotion actions.
- Visual target composition can produce transient `%view`-equivalent data.

## Validation Criteria

Use `validation/checklists/workpackages/WP-ITM-EXPLORATION-01-interactive-itm-exploration-workbench.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for exploration session composition.
- Focused tests for selector result modes and explanations.
- Focused tests for validation grouping and live rule handling.
- Focused tests for transient surface lifecycle state.
- Manual UI validation evidence from the user for workbench workflows, following repository guidance.
- Updated documentation/examples for parameter runner, Selector Lab, Validation Lab, lens dashboard, Visual Target Composer, Transformation Playground, and promotion workflow.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Which panel is the first implementation slice after parameter runner.
- How much selector explanation metadata belongs in `@textforge/itm` versus UI-only adapters.
- Whether transformation providers share the existing pipeline contribution registry or need a workbench-specific adapter layer.
- How pinned transient surfaces are represented in session state.

## Archive Trace

- Introduced as proposed by `ADR-0010`.
- Depends on `ADR-0009` / `WP-ITM-05`.
