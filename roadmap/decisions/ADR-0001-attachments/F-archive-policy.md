# Attachment F — Archive policy

## Purpose

The archive preserves historical roadmap material without allowing it to confuse active planning.

## Archive rule

A document is archived when it is no longer authoritative but still useful for traceability.

## Archived material includes

- old phase-based roadmap files;
- old RAPID logs;
- superseded roadmap registers;
- raw grilling notes after accepted decisions have been extracted;
- obsolete generated views;
- migration snapshots.

## Active material must not depend on archive content

Active roadmap documents may link to archive material only through:

- `archive_trace`;
- ADR context;
- evidence references;
- migration notes.

## Archive banner

Every archived file should start with:

```md
> Archived historical document.
> This file is not authoritative for current roadmap planning.
> Current roadmap truth lives in `roadmap-state.yaml`.
```

## Archive folder structure

```text
archive/
  rapid/
  phases/
  registers/
  grilling/
  generated-views/
  migration-snapshots/
```

## Naming

```text
<artifact-name>-archived-YYYY-MM-DD.md
```

Examples:

```text
RAPID-up-to-2026-06-05.md
phase-roadmap-v20-archived-2026-06-05.md
wp-register-v20-archived-2026-06-05.md
```

## Allowed edits

Archived files may only be edited to:

- fix broken links;
- add archive banners;
- add cross-references to replacement documents;
- correct metadata.

They must not be rewritten to match the new roadmap model.
