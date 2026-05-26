# Implementation Status — Roadmap V18

**Purpose:** Mutable current-state tracker for workpackage implementation.

Use this file for operational status. Keep `decisions/RAPID.md` append-only for history.

## Current baseline

| Area | Current state |
|---|---|
| Foundation phases | Phase -1 through Phase 4.1 are treated as closed foundation history unless explicitly reopened. |
| Next implementation path | `WP-05A -> WP-05B -> WP-05C`. |
| Backend identity | Develop against `WP-ID-DEV` fixture identity; Entra is optional later adapter. |
| Backend profile | Not started. May be developed locally with Node/container and one approved local backend origin. |
| Roadmap structure | V18 workpackage-first structure active. V16/V17 source preserved in archive. |

## Status update table

| WP ID | Status | Evidence | Last updated | Notes |
|---|---|---|---|---|
| WP-05A | Validated | `roadmap/validation/workpackage-checklists/WP-05A-contribution-manifest-and-registry-model.md`; `corepack pnpm verify`; app `file://` build checks | 2026-05-26 | Canonical manifest normalization and deterministic bundled registry package model validated. |
| WP-05B | Not started | Depends on WP-05A | 2026-05-26 | Capability activation/resolver context. |
| WP-05C | Not started | Depends on WP-05A/WP-05B | 2026-05-26 | Contribution execution integration. |
| WP-ID-01 | Not started | Can proceed after foundation | 2026-05-26 | Identity contract only; no Entra. |
| WP-ID-DEV | Not started | Depends on WP-ID-01 | 2026-05-26 | Required to keep local backend development unblocked. |
| WP-SSO-ENTRA | Deferred / standalone | Depends on identity/policy/backend manifest | 2026-05-26 | Does not block generic roadmap progress. |
| WP-RELEASE-GATE | Recurring | Applies to selected release scopes | 2026-05-26 | Run at meaningful delivery milestones. |

## How to update

When a workpackage moves state:

1. update the row above or add a new row;
2. add a RAPID entry if the change is a decision, action, progress, issue, or dependency waiver;
3. link implementation evidence and validation commands where available.
