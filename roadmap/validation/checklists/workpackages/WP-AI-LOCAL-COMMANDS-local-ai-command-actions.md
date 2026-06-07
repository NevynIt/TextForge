# Validation Checklist - WP-AI-LOCAL-COMMANDS

## Target

- ID: `WP-AI-LOCAL-COMMANDS`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Command palette registers local AI commands only through the command/action spine | Test | Pending | |
| AC-002 | Commands are hidden or disabled when policy disables local AI | Test | Pending | |
| AC-003 | Commands are hidden or disabled when required provider capability is unavailable | Test | Pending | |
| AC-004 | Selected text can be summarized where provider support exists | Manual/UI | Pending | |
| AC-005 | Selected text can be language-detected where provider support exists | Manual/UI | Pending | |
| AC-006 | Selected text can be translated where provider support exists | Manual/UI | Pending | |
| AC-007 | Diagnostic explanation can run against an explicitly selected diagnostic | Test/Manual | Pending | |
| AC-008 | Results are transient unless explicitly copied or applied through a reviewable edit flow | Test/Review | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | command/action tests | Pending |
| EV-002 | manual UI evidence | `validation/evidence/WP-AI-LOCAL-COMMANDS.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-LOCAL-COMMANDS` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
