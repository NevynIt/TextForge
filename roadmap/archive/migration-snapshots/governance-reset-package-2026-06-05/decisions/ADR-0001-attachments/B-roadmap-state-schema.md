> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Attachment B — `roadmap-state.yaml` schema

## Purpose

`roadmap-state.yaml` is the canonical, machine-readable registry for roadmap state.

It records:

- modules;
- workpackages;
- releases;
- ADRs;
- dependencies;
- status;
- archive trace.

Markdown documents explain these records but do not override them.

## Status values

```yaml
status_values:
  - candidate
  - defined
  - ready
  - in-progress
  - implemented
  - validated
  - blocked
  - deferred
  - archived
```

## Minimal schema example

```yaml
schema_version: 1

modules:
  MOD-ROADMAP:
    title: Roadmap governance
    path: modules/roadmap-governance.md
    status: active
    owns:
      - roadmap structure
      - roadmap conventions
    depends_on: []
    enables:
      - all workpackages

workpackages:
  WP-ROADMAP-CLEANUP:
    title: Roadmap cleanup and governance reset
    path: workpackages/WP-ROADMAP-CLEANUP.md
    module: MOD-ROADMAP
    status: in-progress
    type: governance
    depends_on: []
    enables: []
    release_candidates:
      - R-ROADMAP-RESET
    production_required: true
    deferrable: false
    key_adrs:
      - ADR-0001
    archive_trace:
      - archive/rapid/RAPID-up-to-2026-06-05.md

releases:
  R-ROADMAP-RESET:
    title: Roadmap governance reset
    status: in-progress
    workpackages:
      - WP-ROADMAP-CLEANUP
    target_outcome: Clean module/workpackage/release-based roadmap

adrs:
  ADR-0001:
    title: Roadmap governance reset
    status: accepted
    path: decisions/ADR-0001-roadmap-governance-reset.md
    supersedes: []
```

## Required validation rules

- Every WP `module` must reference an existing module.
- Every WP dependency must reference an existing WP.
- Every WP in a release must reference an existing WP.
- Every ADR reference must exist.
- Every status must use an allowed value.
- Every path must resolve to an existing file or be explicitly marked planned.
- Archived items cannot enable active work unless marked historical.
- No active field may use phase terminology except `archive_trace`.
- Every WP belongs to exactly one primary module.
