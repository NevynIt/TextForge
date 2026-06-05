> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Attachment D — Templates

This attachment lists the agreed templates. Copy operational copies into `roadmap/templates/` or the relevant folder if useful.

## Module template

```md
# Module: <module name>

## Purpose

What this module is responsible for.

## Boundaries

### Owns
- ...

### Does not own
- ...

## Users / consumers

Who or what depends on this module.

## Key capabilities

- ...

## Public contracts

APIs, data structures, file formats, extension points, events, renderer contracts, or package interfaces exposed by this module.

## Dependencies

### Depends on
- ...

### Enables
- ...

## Workpackages

| WP | Title | Status | Notes |
|---|---|---|---|
| WP-... | ... | ... | ... |

## Current state

Short factual summary of what exists today.

## Target state

Short description of what good enough means for this module.

## Key decisions

- ADR-000x — ...

## Risks / open questions

- ...

## Validation approach

How this module is tested or accepted at module level.

## Notes
```

## Workpackage template

```md
# WP-<AREA>-<ID> — <workpackage title>

## Metadata

- Status:
- Module:
- Type:
- Depends on:
- Enables:
- Release candidates:
- Production required:
- Deferrable:
- Owner packages:
- Archive trace:

## Outcome

## Scope

## Non-goals

## Package impact

## Interfaces / contracts changed

## Validation criteria

## Evidence required

## Open decisions

## Notes
```

## RAPID template

```md
# RAPID Log

This is the active append-only roadmap event log.

Current planning truth lives in `roadmap-state.yaml`.
Durable decisions live in `decisions/`.
Historical pre-cut entries are archived under `archive/rapid/`.

## Convention

New entries use:

- Module
- Workpackage
- Release
- Decision / Action / Progress / Issue / Risk

Phase terminology is historical only.

## Entries

| ID | Date | Type | Status | Module | Workpackage | Release | Entry | Links | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
```

## ADR template

```md
# ADR-0000 — <decision title>

## Status

Proposed | Accepted | Superseded | Rejected

## Date

YYYY-MM-DD

## Context

What situation forced this decision?

## Decision

What are we deciding?

## Consequences

### Positive
- ...

### Negative / trade-offs
- ...

### Follow-up required
- ...

## Applies to

- Modules:
- Workpackages:
- Releases:

## Supersedes / superseded by

- Supersedes:
- Superseded by:
```

## Release envelope template

```md
# R-<NAME> — <release title>

## Outcome

What user-visible or architecture-visible capability this release delivers.

## Included workpackages

| WP | Title | Status | Required |
|---|---|---|---|
| WP-... | ... | ... | yes/no |

## Excluded / deferred

What is explicitly not part of this release.

## Dependency gates

What must be true before this release can be considered viable.

## Acceptance criteria

- ...

## Validation evidence required

- ...

## Risks

| Risk | Mitigation |
|---|---|
| ... | ... |

## Release notes draft

Short text explaining what changes when this release lands.

## Open decisions

- ADR-...
```

## Validation / evidence template

```md
# Evidence — <WP / Module / Release ID>

## Target

- ID:
- Type: Workpackage | Module | Release
- Status:

## Acceptance criteria covered

| Criterion ID | Criterion | Method | Result | Evidence |
|---|---|---|---|---|
| AC-001 | ... | Test / Inspection / Demo / Analysis | Pass/Fail | link |

## Evidence items

| Evidence ID | Type | Location | Notes |
|---|---|---|---|
| EV-001 | test output | ... | ... |

## Diagnostics / defects

| ID | Severity | Status | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

## Validation conclusion

Pass | Pass with limitations | Fail

## Limitations

- ...

## Follow-up work

- WP-...
```
