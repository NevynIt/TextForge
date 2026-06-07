# Validation Checklist - WP-AI-EMBED-01

## Target

- ID: `WP-AI-EMBED-01`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Embedding support is provider-backed and optional | Test | Pending | |
| AC-002 | TextForge functions without any embedding provider | Test | Pending | |
| AC-003 | Vector indexes are workspace-scoped derived data | Test/Review | Pending | |
| AC-004 | Index invalidation and rebuild behavior are defined and tested | Test | Pending | |
| AC-005 | Embedding provider absence does not block `WP-AI-SEARCH-01` behavior | Test | Pending | |
| AC-006 | No implementation assumes Chrome built-in AI exposes embeddings | Review | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | embedding provider tests | Pending |
| EV-002 | storage tests | vector index rebuild/invalidation tests | Pending |
| EV-003 | design review | provider absence and Chrome assumption review | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-EMBED-01` is a candidate workpackage and has not been implemented or validated.

## Limitations

- This workpackage is optional and excluded from `R-LOCAL-AI-MVP`.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
