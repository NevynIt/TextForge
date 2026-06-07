# WP-ITM-05 - Parameterized ITM reports and dashboards

## Registry

- Workpackage ID: `WP-ITM-05`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-ITM`
- ADRs: `ADR-0009`

## Outcome

Parameterized ITM and ITM-in-Markdown files can declare host-supplied parameters, run as transient effective documents, and reuse the same dashboard/report templates across different target models, scopes, rules, styles, and projection modes.

## Scope

- Parse `%param` declarations and expose them in the ITM document model.
- Infer parameter requiredness from the presence or absence of defaults.
- Validate the v1 parameter type contract.
- Substitute `${name}` references only in supported directive arguments, directive-body scalar values, and `itm-pub` YAML request fields.
- Reject unsupported substitution locations with diagnostics.
- Add loader support for parameter values and transient effective document generation.
- Add diagnostics for missing, invalid, duplicate, unknown, unused, unresolvable, rejected, cyclic, or out-of-scope parameters.
- Extend ITM-in-Markdown and `itm-pub` to share the same effective parameter set.
- Define generic lens viewpoints and the `analyse` pipeline operation.
- Support generated parameter forms and local run history.

## Non-goals

- Turning ITM into a general template language.
- Substituting inside arbitrary labels, relationship lines, Markdown prose, raw fenced content, or partial identifiers in v1.
- Persisting parameter values into source files by default.
- Reintroducing per-rule disable syntax that conflicts with `ADR-0008`.
- Implementing the full interactive exploration workbench; that belongs to `WP-ITM-EXPLORATION-01`.

## Package Impact

- `packages/itm`
- ITM Markdown publication code
- Web workbench parameter form and run-history surfaces
- ITM examples and canonical specification documentation

## Interfaces / Contracts Changed

- Public ITM model exposes parameter declarations.
- Loader accepts parameter values and returns parameter diagnostics.
- ITM publication requests can reference effective parameters.
- Built-in lens package exposes generic `itm_lenses.viewpoints`.
- Projection pipeline recognizes `analyse` steps for generic model lenses.

## Validation Criteria

Use `validation/checklists/workpackages/WP-ITM-05-parameterized-itm-reports-and-dashboards.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for parser/model parameter declarations.
- Focused tests for loader substitution boundaries and diagnostics.
- ITM-in-Markdown / `itm-pub` tests for parameterized report rendering.
- Lens package tests for generic structure, identity, relationship, attribute, diagnostics, profile-usage, and graph-metrics lenses.
- UI/manual evidence for generated parameter forms and run history if UI work is included.
- Updated canonical ITM specification and examples.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Whether named run profiles become source artifacts after v1 local run history.
- The exact stable output contract for each generic lens.
- Whether parameterized execution should expose a CLI/reporting entry point in the same workpackage or a follow-on.

## Archive Trace

- Introduced as proposed by `ADR-0009`.
- Enables `ADR-0010` / `WP-ITM-EXPLORATION-01`.
