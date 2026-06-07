# Validation Checklist - WP-ITM-05

## Target

- ID: `WP-ITM-05`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Parser exposes `%param` declarations with names, labels, types, defaults, values, and accept policy metadata | Test | Pending | |
| AC-002 | Requiredness is inferred from default presence, with no separate v1 `required` field | Test | Pending | |
| AC-003 | Loader accepts host parameter values and produces a transient effective document without editing source | Test | Pending | |
| AC-004 | Substitution is limited to directive arguments, directive-body scalar values, and `itm-pub` YAML request fields | Test | Pending | |
| AC-005 | Unsupported substitution locations produce diagnostics | Test | Pending | |
| AC-006 | Missing, unknown, invalid, duplicate, unused, cyclic, unresolvable, and rejected parameters produce diagnostics with source location where available | Test | Pending | |
| AC-007 | Parameterized `.itm` files can include a target model selected through a `resource` parameter | Test | Pending | |
| AC-008 | Parameterized `.md` reports can render `itm-pub` blocks against a selected target model | Test | Pending | |
| AC-009 | Built-in generic lens viewpoints can be used from parameterized ITM and Markdown reports | Test | Pending | |
| AC-010 | Generated parameter forms cover resource, selector, boolean, enum, string/id/type, number/integer, and text controls | Manual/UI | Pending | |
| AC-011 | Run history can rerun a previous parameterized execution without writing values into source by default | Manual/UI | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | specification update | `docs/reference/specs/itm-format.md` | Pending |
| EV-002 | test output | `packages/itm/test/index.test.js` | Pending |
| EV-003 | markdown publication tests | Markdown / `itm-pub` tests | Pending |
| EV-004 | manual UI evidence | `validation/evidence/WP-ITM-05.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-ITM-05` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation, if needed, must be manually run by the user according to repository instructions.

## Follow-up work

- Accept, revise, or reject `ADR-0009` before implementation starts.
- Decide stable lens output contracts before downstream dashboards depend on them.
