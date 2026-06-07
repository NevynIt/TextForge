# Validation Checklist - WP-ITM-EXPLORATION-01

## Target

- ID: `WP-ITM-EXPLORATION-01`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Exploration sessions compose base model, includes, packages, parameterized files, parameter values, and live snippets without editing source | Test | Pending | |
| AC-002 | User can open a parameterized dashboard/report and run it against a selected ITM model | Manual/UI | Pending | |
| AC-003 | User can type a selector and see matching nodes, relationships, paths, neighborhoods, or subtrees | Manual/UI | Pending | |
| AC-004 | Selector results include counts, diagnostics, and match explanations | Test / Manual/UI | Pending | |
| AC-005 | Selector results can open as catalogue, matrix, graph, or report when corresponding surfaces are available | Manual/UI | Pending | |
| AC-006 | User can run rules and see candidates, failures, severity, provider, rule source, and file grouping | Test / Manual/UI | Pending | |
| AC-007 | Generic lens dashboard tabs render structure, identity, relationships, profile usage, attributes, diagnostics, rules, views/viewpoints, graph metrics, and selector results | Manual/UI | Pending | |
| AC-008 | User can compose a transient visual target from node selector, edge selector, projection, renderer, ancestor inclusion, and implicit relationship settings | Manual/UI | Pending | |
| AC-009 | Transformation Playground shows input, pipeline, output, diagnostics, and provenance for supported transforms | Manual/UI | Pending | |
| AC-010 | Transient surfaces can be pinned, renamed, compared, exported, refreshed, promoted, and discarded | Test / Manual/UI | Pending | |
| AC-011 | Promotion workflows save selectors, rules, styles, views, viewpoints, run history, semantic patches, and visual deltas through explicit actions | Test / Manual/UI | Pending | |
| AC-012 | No new `%test` or `%assert` syntax is introduced | Inspection | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | `apps/textforge-web` tests | Pending |
| EV-002 | test output | `packages/itm` tests | Pending |
| EV-003 | manual UI evidence | `validation/evidence/WP-ITM-EXPLORATION-01.md` | Pending |
| EV-004 | documentation/examples | `docs/` and `docs/examples/` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-ITM-EXPLORATION-01` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.

## Follow-up work

- Accept, revise, or reject `ADR-0010` before implementation starts.
- Decide the first workbench panel implementation slice after the parameter runner.
