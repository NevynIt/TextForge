# Attachment E — Generated views

Generated views are derived from `roadmap-state.yaml`. They are not authoritative.

## Required views

```text
views/current-next.md
views/status-dashboard.md
views/module-matrix.md
views/dependency-map-full.md
views/dependency-map-next.md
```

## `views/current-next.md`

Purpose: answer what should be worked on now or next.

```md
# Current / Next View

Generated from `roadmap-state.yaml`.

## Now

| WP | Title | Module | Status | Why now | Blocking dependencies |
|---|---|---|---|---|---|

## Next

| WP | Title | Module | Status | Unlocked by | Notes |
|---|---|---|---|---|---|

## Later

| WP | Title | Module | Status | Reason deferred |
|---|---|---|---|

## Blocked

| WP | Title | Module | Blocked by | Required action |
|---|---|---|---|---|
```

## `views/status-dashboard.md`

Purpose: answer the overall health of the roadmap.

```md
# Status Dashboard

Generated from `roadmap-state.yaml`.

## Summary

| Metric | Count |
|---|---:|
| Total workpackages |  |
| Ready |  |
| In progress |  |
| Implemented |  |
| Validated |  |
| Blocked |  |
| Deferred |  |

## By status

| Status | Workpackages |
|---|---|

## By module

| Module | Total | Ready | In progress | Implemented | Validated | Blocked |
|---|---:|---:|---:|---:|---:|---:|

## Attention required

| Item | Reason | Needed decision/action |
|---|---|---|

## Recently changed

| ID | Change | Source |
|---|---|---|
```

## `views/module-matrix.md`

Purpose: answer where the module seams, dependencies, and contracts are.

```md
# Module Matrix

Generated from `roadmap-state.yaml`.

## Module overview

| Module | Purpose | Owns | Key contracts | Status | Main WPs |
|---|---|---|---|---|---|

## Module dependency matrix

Rows depend on columns.

| Depends on ↓ / Provides → | MOD-... | MOD-... |
|---|---|---|
| MOD-... | — | uses |
| MOD-... | provides | — |

## Cross-module contracts

| Contract | Provider module | Consumer modules | Related WPs | Status |
|---|---|---|---|---|

## Coordination risks

| Risk | Modules affected | Related WP / ADR |
|---|---|---|
```
