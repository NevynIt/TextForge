# Validation Checklist - WP-AI-LOCAL-01

## Target

- ID: `WP-AI-LOCAL-01`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Local AI provider contract exposes stable provider ID, label, and capability report | Test | Pending | |
| AC-002 | Chrome built-in AI provider uses runtime feature detection before exposing capabilities | Test | Pending | |
| AC-003 | Capability availability distinguishes unsupported, available, requires-download, downloading, policy, device, language, context, and error states where observable | Test | Pending | |
| AC-004 | `noopLocalAiProvider` provides stable behavior when local AI is unavailable or disabled | Test | Pending | |
| AC-005 | Policy disables local AI actions without crashing command or settings surfaces | Test | Pending | |
| AC-006 | No local AI action runs without explicit user action | Test/Review | Pending | |
| AC-007 | AI output cannot modify source without reviewable patch or normal edit flow | Test/Review | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | local AI provider tests | Pending |
| EV-002 | policy tests | settings/policy tests | Pending |
| EV-003 | manual UI evidence | `validation/evidence/WP-AI-LOCAL-01.md` | Pending if UI surfaces are included |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-LOCAL-01` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation, if needed, must be manually run by the user according to repository instructions.
- Browser API availability must be rechecked immediately before implementation.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
