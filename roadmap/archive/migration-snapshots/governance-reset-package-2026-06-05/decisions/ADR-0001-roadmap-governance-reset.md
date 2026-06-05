> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# ADR-0001 — Roadmap governance reset

## Status

Accepted

## Date

2026-06-05

## Context

The TextForge roadmap has accumulated mixed terminology and overlapping responsibilities between phase-based planning, workpackage-based planning, implementation status files, RAPID entries, grilling notes, validation checklists, and generated dependency views.

Even after cleanup, the roadmap still mixes phases and workpackages, contains legacy content in active locations, and is difficult to use as a clear reference for developing app modules independently under a coherent orchestration model.

The roadmap needs a clean governance model that makes it clear:

- what the stable product modules are;
- what independently implementable workpackages exist;
- what releases are coherent delivery cuts through the dependency graph;
- where status and dependencies are authoritative;
- where durable decisions live;
- where historical material is preserved;
- how agents should navigate and update the roadmap without reintroducing ambiguity.

## Decision

The active roadmap will be reorganized around:

- modules;
- workpackages;
- release envelopes;
- ADRs;
- a root RAPID log;
- validation evidence;
- generated views;
- a non-authoritative archive.

`roadmap-state.yaml` becomes the authoritative registry for:

- module IDs;
- workpackage IDs;
- release IDs;
- ADR IDs;
- current status;
- dependencies;
- module/workpackage/release relationships;
- archive trace metadata.

Markdown files explain the registry.

ADRs record durable decisions.

RAPID records append-only events only.

Archive preserves historical material only.

Phase terminology is historical only and must not be used in active planning fields except under `archive_trace` or explicit historical notes.

## Consequences

### Positive

- The roadmap becomes easier to navigate.
- Modules can be developed independently while still being coordinated by dependencies and releases.
- Status and dependency truth have one canonical source.
- Historical context is preserved without polluting active planning.
- Agents can safely update the roadmap by following explicit authority rules.
- The RAPID log remains useful as an event trail without becoming a second planning system.

### Trade-offs

- A migration step is required.
- Some legacy phase-based files must be archived or rewritten as modules, WPs, releases, or ADRs.
- Generated views require either a script or disciplined regeneration process.
- Existing links may need updating.

### Follow-up required

- Archive the old RAPID log.
- Create a new root `RAPID.md`, continuing existing ID counters.
- Create `roadmap-state.yaml`.
- Create module files.
- Create workpackage files or refactor existing workpackage cluster files.
- Create release envelopes.
- Extract still-valid durable decisions into ADRs.
- Generate dependency, status, current-next, and module matrix views.
- Validate that no active content is lost.

## Applies to

- Modules: all
- Workpackages: all
- Releases: all
- Roadmap governance files: all

## Attachments

- `ADR-0001-attachments/A-governance-rules.md`
- `ADR-0001-attachments/B-roadmap-state-schema.md`
- `ADR-0001-attachments/C-naming-id-conventions.md`
- `ADR-0001-attachments/D-templates.md`
- `ADR-0001-attachments/E-generated-views.md`
- `ADR-0001-attachments/F-archive-policy.md`
- `ADR-0001-attachments/G-dependency-map-conventions.md`
- `ADR-0001-attachments/H-migration-cutover-checklist.md`

## Supersedes / superseded by

- Supersedes: previous phase-based roadmap conventions.
- Superseded by: none.
