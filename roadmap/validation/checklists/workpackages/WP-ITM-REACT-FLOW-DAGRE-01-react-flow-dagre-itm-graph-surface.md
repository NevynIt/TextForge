# Validation Checklist - WP-ITM-REACT-FLOW-DAGRE-01

## Target

- ID: `WP-ITM-REACT-FLOW-DAGRE-01`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Renderer is registered as package-owned surface `itm.graph.reactflow.dagre` | Test | Pending | |
| AC-002 | Renderer consumes normalized ITM graph projections, not raw ITM source text | Test | Pending | |
| AC-003 | `%viewpoint` and `%view` controls resolve into a validated control model | Test | Pending | |
| AC-004 | V1 control types support `boolean`, `integer`, `number`, `enum`, `selector`, `id`, and `relationshipTypeRef` | Test | Pending | |
| AC-005 | Unsupported control types, invalid values, undeclared view control values, and unsupported bindings emit diagnostics | Test | Pending | |
| AC-006 | Supported bindings are limited to the v1 declarative binding set | Test/Review | Pending | |
| AC-007 | Dagre layout options validate `rankdir`, `nodesep`, `ranksep`, `marginx`, and `marginy` | Test | Pending | |
| AC-008 | React Flow nodes/edges remain renderer-specific view models and do not leak back as canonical ITM objects | Test/Review | Pending | |
| AC-009 | Style mapping consumes resolved ITM styles first and reports unsupported properties as informational diagnostics | Test | Pending | |
| AC-010 | V1 interaction remains read-only for semantic ITM content | Test/Review | Pending | |
| AC-011 | User can manually validate pan/zoom/fit, selection, inspection, control toggles, and layout regeneration | Manual/UI | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | ITM control model tests | Pending |
| EV-002 | test output | renderer projection/layout tests | Pending |
| EV-003 | test output | diagnostics and style mapping tests | Pending |
| EV-004 | manual UI evidence | `validation/evidence/WP-ITM-REACT-FLOW-DAGRE-01.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-ITM-REACT-FLOW-DAGRE-01` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.
- Browser-compatible Dagre import strategy must be confirmed during implementation.

## Follow-up work

- Accept, revise, or reject `ADR-0012` before implementation starts.
