> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Attachment A — Governance rules: what is authoritative where

## Core rule

If two files disagree:

- `roadmap-state.yaml` wins for IDs, status, dependencies, module/WP/release/ADR registry data.
- The latest non-superseded ADR wins for durable decisions.
- RAPID is historical evidence only.
- Archive is non-authoritative.

## Authority table

| Artifact | Authoritative for | Not authoritative for |
|---|---|---|
| `README.md` | How to navigate the roadmap | Status, scope, decisions |
| `product-goal.md` | Product direction and strategic intent | WP details |
| `roadmap-state.yaml` | Status, dependencies, IDs, module/WP/release/ADR registry data | Long explanations |
| `modules/*.md` | Module purpose, boundaries, contracts | WP implementation detail |
| `workpackages/*.md` | Scope, non-goals, acceptance, evidence needs | Global status truth |
| `releases/*.md` | Coherent delivery envelopes | Detailed WP scope |
| `decisions/ADR-*.md` | Durable decisions and consequences | Progress tracking |
| `RAPID.md` | Append-only event trail | Current planning truth |
| `validation/evidence/*` | Proof that something was validated | Planning intent |
| `archive/*` | Historical material | Active guidance |
| `views/*` | Generated projections from `roadmap-state.yaml` | Canonical state |

## Editing rules

- Active roadmap documents must not use phase terminology except in explicit historical context or `archive_trace`.
- Do not duplicate status manually across multiple active files.
- Do not manually edit generated views unless explicitly marked as draft or experimental.
- Accepted ADRs should be superseded by new ADRs rather than silently rewritten.
- RAPID entries are append-only.
- Archive files are frozen except for banners, links, metadata, and replacement references.
