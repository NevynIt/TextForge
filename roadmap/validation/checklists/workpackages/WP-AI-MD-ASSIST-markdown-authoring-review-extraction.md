# Validation Checklist - WP-AI-MD-ASSIST

## Target

- ID: `WP-AI-MD-ASSIST`
- Type: Workpackage
- Status source: `roadmap-state.yaml`

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | Markdown review emits structured findings labelled as AI assistance | Test | Pending | |
| AC-002 | Markdown rewrite creates a replacement preview or diff without mutating source | Test | Pending | |
| AC-003 | Summarization and translation run only over explicit user-selected scopes | Test/Review | Pending | |
| AC-004 | Extraction can propose decisions, actions, risks, requirements, glossary terms, or ITM content without mutating source | Test | Pending | |
| AC-005 | Extracted ITM proposals are parsed or validated before being offered as patches | Test | Pending | |
| AC-006 | Report-readiness review can cite affected Markdown sections | Test | Pending | |
| AC-007 | UI flows let the user discard, copy, or explicitly apply proposed changes | Manual/UI | Pending | |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | Markdown assistance tests | Pending |
| EV-002 | extraction tests | Markdown-to-ITM proposal tests | Pending |
| EV-003 | manual UI evidence | `validation/evidence/WP-AI-MD-ASSIST.md` | Pending |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|

## Validation conclusion

Pending. `WP-AI-MD-ASSIST` is a candidate workpackage and has not been implemented or validated.

## Limitations

- UI validation must be manually run by the user according to repository instructions.

## Follow-up work

- Accept, revise, or reject `ADR-0011` before implementation starts.
