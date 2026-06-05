> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Attachment C — Naming and ID conventions

## General rules

- IDs are stable.
- IDs are unique within their artifact type.
- IDs do not include dates unless the artifact is inherently historical.
- Filenames use lowercase kebab-case except where the ID is the filename anchor.
- Preserve already-established WP identifiers when they are widely referenced.
- Use numbered IDs for new WPs where possible.

## Modules

Format:

```text
MOD-<AREA>
```

Examples:

```text
MOD-ROADMAP
MOD-RESOURCES
MOD-REPOSITORY
MOD-ITM
MOD-BPMN
MOD-ARCHIMATE
MOD-TABLES
MOD-SKETCH
MOD-BACKEND
MOD-SECURITY
```

Files:

```text
modules/roadmap-governance.md
modules/workspace-resources.md
modules/itm.md
modules/bpmn.md
```

## Workpackages

Preferred format:

```text
WP-<AREA>-<NUMBER>
```

Allowed legacy semantic format:

```text
WP-<AREA>-<SEMANTIC-SUFFIX>
```

Examples:

```text
WP-RES-01
WP-RES-02
WP-ITM-02
WP-BPMN-SEM
WP-BPMN-VISUAL
WP-ARCHIMATE-SEM
WP-ARCHIMATE-VISUAL
```

Files:

```text
workpackages/WP-RES-02-revisions-conflicts.md
workpackages/WP-BPMN-SEM-bpmn-semantic-profile.md
```

## Releases

Format:

```text
R-<SHORT-NAME>
```

Examples:

```text
R-ROADMAP-RESET
R-LOCAL-AUTHORING-MVP
R-VISUAL-MODELING-MVP
R-BACKEND-PREVIEW
R-ENTERPRISE-PROFILE
```

Files:

```text
releases/R-ROADMAP-RESET.md
```

## ADRs

Format:

```text
ADR-0001-short-title.md
```

Examples:

```text
ADR-0001-roadmap-governance-reset.md
ADR-0002-workpackage-first-roadmap.md
```

## RAPID IDs

Continue typed counters from the historical RAPID log.

Current detected last counters:

```text
D-080
A-033
P-101
I-009
R-001
```

New active RAPID entries should start at:

```text
D-081
A-034
P-102
I-010
R-002, if needed
```

Keep typed counters:

```text
D = Decision
A = Action
P = Progress
I = Issue
R = Risk
```
