# WP-ITM-04 - ITM validation and conformance modules

## Registry

- Workpackage ID: `WP-ITM-04`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-ITM`
- ADRs: `ADR-0008`

## Outcome

`@textforge/itm` has a deterministic validation model and a precise conformance-module declaration model. Rule pipeline steps normalize to a canonical executable shape, built-in validation steps are regulated, type and relationship declarations generate automatic constraints, diagnostics support layered provenance, scoped activation remains declaration-free, and parsers/backends/editors can report supported ITM modules explicitly.

## Scope

- Canonicalize `%rule` fields and validation pipeline step syntax.
- Support tolerant shorthand parsing where appropriate and strict-mode rejection for ambiguous string pseudo-steps.
- Define the `itm.validation.builtins` step vocabulary for node, relationship, document, type-system, and view validation.
- Add declaration-derived validation from `%entitytype` and `%relationshiptype` metadata.
- Regulate relationship cardinality vocabulary and expanded cardinality shape.
- Make validation type checks polymorphic by default, with explicit exact-type checks.
- Define pattern validation semantics and safe regex expectations.
- Regulate plugin/domain validation steps through qualified step names and `%require`.
- Keep `%begin` / `%end` as activation only; declaration directives remain outside scoped activation blocks.
- Define deterministic validation execution order.
- Support minimal, standard, and extended diagnostic provenance.
- Define standard validation modes: `authoring`, `strict`, `publishing`, and `export`.
- Define the ITM conformance-module graph and compliance declaration shape.

## Non-goals

- Reopening the accepted scoped-context, identity-map, type-inheritance, or context-inference decisions from `ADR-0006` and `ADR-0007`.
- Implementing BPMN-specific or ArchiMate-specific semantic completeness inside the shared ITM package.
- Browser UI verification by headless browser.
- Adding core syntax for disabling individual active rules.

## Package Impact

- `packages/itm`
- ITM examples and canonical specification documentation.
- Profile examples that consume validation semantics, including BPMN, ArchiMate, EA dashboard, tables/catalogues, and ITM publication flows.

## Interfaces / Contracts Changed

- Public ITM rule model exposes normalized pipeline steps.
- Validation results expose layered diagnostics and optional provenance.
- Resolved/effective ITM model exposes active rule sets and declaration-derived constraints.
- Compliance declarations expose supported ITM conformance modules.

## Validation Criteria

Use `validation/checklists/workpackages/WP-ITM-04-itm-validation-and-conformance-modules.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused package tests for parser normalization, strict-mode invalid forms, built-in validators, declaration-derived constraints, scoped activation boundaries, diagnostics, modes, and conformance declarations.
- Updated canonical ITM specification.
- Updated ITM/profile examples that demonstrate canonical validation syntax.
- Focused builds/checks for touched packages.
- Updated validation evidence under `validation/evidence/` if implementation begins.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Whether the initial `itm.validation.builtins` vocabulary should ship as one module or be split into smaller node/relationship/document modules.
- The exact plugin validation provider manifest shape for qualified rule steps.
- Whether compliance declarations live only in API metadata or also have a first-class ITM directive.

## Archive Trace

- Introduced as proposed by `ADR-0008`.
- Builds on `ADR-0006` and `ADR-0007`.
