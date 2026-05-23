# TextForge Rebuild RAPID Log

This file is maintained in the repository-local `roadmap/` folder. It is part of the implementation record and must be committed with milestone changes.

RAPID means **Risks, Actions, Progress, Issues, and Decisions**. Use this single table instead of separate progress and decision logs.

## Append-only rule

This log is append-only.

Do not edit or delete previous entries. If an entry becomes obsolete, add a new entry with `Status` set to `Superseded` and link it to the previous entry. If a mistake must be corrected, add a new correction entry and link it to the mistaken entry.

The append-only rule makes the implementation history auditable across agent runs.

## Current status block

Keep this block current. It may be edited because it is an operational pointer, not the historical log.

```text
Current branch: main before pivot, then rewrite/v2-monorepo after pivot setup
Current milestone: M-1 Repository pivot and preservation
Current package focus: roadmap, repository skeleton, package strategy
Last known good command: not established yet
Next recommended step: follow roadmap/02_repository_pivot_instruction.md
Open questions: none recorded at document-set creation
```

## ID convention

```text
R-### = Risk
A-### = Action
P-### = Progress
I-### = Issue
D-### = Decision
```

## Status vocabulary

Use these status values only unless there is a strong reason to extend the vocabulary:

```text
Open
In progress
Done
Blocked
Accepted
Superseded
```

Typical use:

| Type | Typical statuses |
|---|---|
| Risk | `Open`, `Accepted`, `Superseded`, `Done` |
| Action | `Open`, `In progress`, `Done`, `Blocked` |
| Progress | usually `Done` |
| Issue | `Open`, `Blocked`, `Done`, `Superseded` |
| Decision | `Accepted`, `Superseded` |

## RAPID entries

| ID | Type | Milestone | Status | Entry | Owner | Updated | Links |
|---|---|---|---|---|---|---|---|
| D-001 | Decision | M-1 | Accepted | Use one Git repository with pnpm workspaces, not Git submodules. | Jill | 2026-05-23 |  |
| D-002 | Decision | M-1 | Accepted | Preserve the previous implementation with an archival tag and branch before the rebuild pivot. | Jill | 2026-05-23 | `textforge-v1-final`, `archive/v1-current` |
| D-003 | Decision | M0 | Accepted | Use React, TypeScript, and Vite for the greenfield workbench. | Jill | 2026-05-23 |  |
| D-004 | Decision | M0 | Accepted | ITM is the canonical structural model for model-driven content. | Jill | 2026-05-23 |  |
| D-005 | Decision | M0 | Accepted | The reusable security harness verifies the browser-enforced envelope, not TextForge internal layering. | Jill | 2026-05-23 |  |
| D-006 | Decision | M0 | Accepted | Editors and viewers are both Surface contributions with capabilities and placement options. | Jill | 2026-05-23 |  |
| D-007 | Decision | M0 | Accepted | Visual and rich editors require explicit write-back contracts before they can become authoritative editing surfaces. | Jill | 2026-05-23 |  |
| D-008 | Decision | M0 | Accepted | Use a single append-only RAPID log for risks, actions, progress, issues, and decisions. | Jill | 2026-05-23 |  |
| A-001 | Action | M-1 | Open | Create archival tag and branch for the current implementation. | agent | 2026-05-23 |  |
| A-002 | Action | M-1 | Open | Create rewrite branch and add roadmap folder with stable filenames. | agent | 2026-05-23 |  |
| R-001 | Risk | M1 | Open | Surface abstraction may grow too complex before the workspace foundation is stable. | agent | 2026-05-23 |  |
| P-001 | Progress | M-1 | Done | Initial rebuild planning package created with roadmap, package guides, pivot instructions, and agent operating rules. | agent | 2026-05-23 |  |
