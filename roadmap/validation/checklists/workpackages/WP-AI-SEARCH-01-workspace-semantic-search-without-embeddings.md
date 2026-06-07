# Validation Checklist - WP-AI-SEARCH-01

## Target

- ID: `WP-AI-SEARCH-01`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Search works without any embedding provider | Test | Pending | |
| AC-002 | Deterministic candidate retrieval happens before local AI reranking | Test | Pending | |
| AC-003 | AI reranking cannot add resources outside the retrieved candidate set | Test | Pending | |
| AC-004 | Results cite local workspace resource IDs, paths, sections, nodes, diagnostics, or comments where available | Test | Pending | |
| AC-005 | Search results expose enough retrieval context to audit why a result was considered | Test/Review | Pending | |
| AC-006 | UI distinguishes deterministic matches from AI reranking/explanation | Manual/UI | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | semantic search tests | Pending |
| EV-002 | citation tests | search result citation tests | Pending |
| EV-003 | manual UI evidence | `validation/evidence/WP-AI-SEARCH-01.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-SEARCH-01` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.
- This workpackage intentionally excludes embeddings.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
