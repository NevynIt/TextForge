# Validation Checklist - WP-AI-ITM-REVIEW

## Target

- ID: `WP-AI-ITM-REVIEW`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | ITM review runs only after deterministic parse, include resolution, package activation, and validation complete | Test | Pending | |
| AC-002 | AI review findings are labelled separately from deterministic diagnostics | Test | Pending | |
| AC-003 | Findings include source scope and confidence where useful | Test | Pending | |
| AC-004 | Selected diagnostic explanations do not alter deterministic diagnostic severity or authority | Test | Pending | |
| AC-005 | Suggested fixes are proposed as patches, not applied automatically | Test | Pending | |
| AC-006 | Profile-aware review can be scoped to active package/profile definitions when available | Test | Pending | |
| AC-007 | Current file, selected subtree, or selected view review can be manually validated in the UI | Manual/UI | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | ITM semantic review tests | Pending |
| EV-002 | patch safety tests | source patch preview tests | Pending |
| EV-003 | manual UI evidence | `validation/evidence/WP-AI-ITM-REVIEW.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-ITM-REVIEW` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.
- AI semantic review remains advisory; deterministic ITM validation remains authoritative.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
