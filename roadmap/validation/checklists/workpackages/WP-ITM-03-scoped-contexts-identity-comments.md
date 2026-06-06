# Validation Checklist - WP-ITM-03

## Target

- ID: `WP-ITM-03`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | The canonical ITM spec documents comments, identity maps, named contexts, scoped activation, and include module boundaries | Inspection | Pending | Link spec diff |
| AC-002 | Parser exposes first-class comments/trivia without changing semantic hierarchy, ordering, descriptions, or YAML values | Test | Pending | Link package test |
| AC-003 | Parser exposes `%idmap`, `%context`, `%begin`, and `%end` model structures with source ranges | Test | Pending | Link package test |
| AC-004 | Evaluator resolves scoped activations and infers default namespace, node types, and relationship types while explicit authoring wins | Test | Pending | Link package test |
| AC-005 | Include module isolation prevents included `%using` or active context state from leaking into the including file | Test | Pending | Link package test |
| AC-006 | Package-exported contexts and identity maps activate only through `%using` or scoped activation | Test | Pending | Link package test |
| AC-007 | Diagnostics cover unresolved, ambiguous, mismatched, and unclosed scoped activation plus identity-map conflicts | Test | Pending | Link package test |
| AC-008 | Markdown and web package checks still pass without headless browser UI validation | Test | Pending | Link command evidence |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | command output | TBD | `@textforge/itm` focused test/build |
| EV-002 | command output | TBD | Markdown and web focused checks |
| EV-003 | command output | TBD | Roadmap view/check regeneration |
| EV-004 | command output | TBD | Repository verify |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending

## Limitations

- UI validation, if needed, must be manually run by the user according to repository instructions.

## Follow-up work

- BPMN, ArchiMate, Markdown publication, and visual editing packages may later use the new context and identity semantics.
