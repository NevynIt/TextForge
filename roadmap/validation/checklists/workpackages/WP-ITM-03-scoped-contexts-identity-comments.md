# Validation Checklist - WP-ITM-03

## Target

- ID: `WP-ITM-03`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | The canonical ITM spec documents comments, identity maps, named contexts, scoped activation, and include module boundaries | Inspection | Pass | `docs/reference/specs/itm-format.md`; `validation/evidence/WP-ITM-03.md` |
| AC-002 | Parser exposes first-class comments/trivia without changing semantic hierarchy, ordering, descriptions, or YAML values | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-003 | Parser exposes `%idmap`, `%context`, `%begin`, and `%end` model structures with source ranges | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-004 | Evaluator resolves scoped activations and infers default namespace, node types, and relationship types while explicit authoring wins | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-005 | Include module isolation prevents included `%using` or active context state from leaking into the including file | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-006 | Package-exported contexts and identity maps activate only through `%using` or scoped activation | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-007 | Diagnostics cover unresolved, ambiguous, mismatched, and unclosed scoped activation plus identity-map conflicts | Test | Pass | `packages/itm/test/index.test.js`; `validation/evidence/WP-ITM-03.md` |
| AC-008 | Markdown and web package checks still pass without headless browser UI validation | Test | Pass | `validation/evidence/WP-ITM-03.md` |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | command output | `validation/evidence/WP-ITM-03.md` | `@textforge/itm` focused test/build |
| EV-002 | command output | `validation/evidence/WP-ITM-03.md` | Markdown and web focused checks |
| EV-003 | command output | `validation/evidence/WP-ITM-03.md` | Roadmap view/check regeneration |
| EV-004 | command output | `validation/evidence/WP-ITM-03.md` | Repository verify |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Validated on 2026-06-06.

## Limitations

- UI validation, if needed, must be manually run by the user according to repository instructions.

## Follow-up work

- BPMN, ArchiMate, Markdown publication, and visual editing packages may later use the new context and identity semantics.
