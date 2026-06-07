# Validation Checklist - WP-ITM-04

## Target

- ID: `WP-ITM-04`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Canonical ITM spec documents `%rule` fields, canonical pipeline step shape, accepted shorthand, and strict-mode invalid string pseudo-steps | Inspection | Pending | |
| AC-002 | Parser/model contract exposes normalized validation rule steps before execution | Test | Pending | |
| AC-003 | Built-in node, relationship, document, type-system, and view validation steps are documented and covered by focused tests | Test | Pending | |
| AC-004 | Type and relationship declarations generate declaration-derived constraints before explicit `%rule` execution | Test | Pending | |
| AC-005 | Pattern validators use declared safe regex semantics and produce diagnostics for missing or non-matching values | Test | Pending | |
| AC-006 | Validation type checks are polymorphic by default, with explicit exact-type checks where requested | Test | Pending | |
| AC-007 | `%begin` / `%end` rejects declaration directives inside scoped activation blocks while allowing model content and nested activations | Test | Pending | |
| AC-008 | Validation execution order is deterministic across identity maps, context inference, inheritance graphs, declaration-derived constraints, explicit rules, and plugin steps | Test | Pending | |
| AC-009 | Diagnostics support minimal mandatory shape plus standard and extended provenance when source mappings are available | Test | Pending | |
| AC-010 | Validation modes filter active rules without introducing core rule-disabling syntax | Test | Pending | |
| AC-011 | ITM conformance-module support can be declared by parser/backend/editor hosts and missing capabilities produce diagnostics | Test | Pending | |
| AC-012 | Existing ITM, BPMN, ArchiMate, EA dashboard, scoped-context, and publication examples are audited or migrated to canonical validation syntax | Inspection | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | specification update | `docs/reference/specs/itm-format.md` | Pending |
| EV-002 | test output | `packages/itm/test/index.test.js` | Pending |
| EV-003 | example audit | `docs/examples/` | Pending |
| EV-004 | roadmap evidence | `validation/evidence/WP-ITM-04.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-ITM-04` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation, if needed, must be manually run by the user according to repository instructions.

## Follow-up work

- Accept, revise, or reject `ADR-0008` before implementation starts.
- Decide the plugin validation provider manifest shape before qualified validation steps are implemented.
