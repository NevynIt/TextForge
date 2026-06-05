> [!IMPORTANT]
> Archived historical roadmap material. This file is non-authoritative after the 2026-06-05 roadmap governance reset. Use oadmap/roadmap-state.yaml and active module/workpackage/release/ADR files for current planning truth.

# TextForge Roadmap V20

Roadmap V20 is the active workpackage-first roadmap for TextForge.

## Start Here

1. Read `AGENTS_START_HERE.md`.
2. Read `ROADMAP_V20.md`.
3. Read `decisions/RAPID.md`.
4. Use `workpackages/workpackage-register.md` for canonical scope and dependencies.
5. Use `workpackages/implementation-status.md` for current operational state.
6. Use relevant workpackage clusters, package guides, specs, grilling records, and validation checklists for the selected slice.

## Current Posture

- The V20 baseline has validated the Visual ITM/runtime renderer chain and the read-only BPMN visual chain through `WP-BPMN-VISUAL-B`.
- Frozen validated work must not absorb new scope. Add follow-on workpackages instead.
- `WP-TABLES` is dependency-ready but held pending a dedicated grilling session.
- New knowledge-workspace gaps are tracked as candidate workpackages: link/backlink index, document graph, canvas, comments sidecars, and reviewable change proposals.
- Optional backend, identity, policy, collaboration leases, GitLab, SSO, AI, and repository adapters remain dependency-gated workpackages.

## Active Files

| File or folder | Role |
|---|---|
| `ROADMAP_V20.md` | Executive roadmap and operating rules. |
| `decisions/RAPID.md` | Append-only decisions/actions/progress/issues log plus mutable current status block. |
| `workpackages/workpackage-register.md` | Canonical workpackage list, dependencies, and scope. |
| `workpackages/implementation-status.md` | Mutable implementation status tracker. |
| `workpackages/dependency-map.md` | Generated dependency map; do not edit by hand. |
| `workpackages/*.md` | Cluster-level planning views. |
| `package-guides/*.md` | Package-level guidance for touched workpackages. |
| `specs/architecture/*.md` | Long-lived architecture and profile notes. |
| `grilling/*.md` | Binding decision-support records when referenced by active workpackages. |
| `validation/*` | Validation checklists and evidence. |

## Validation

Use scripts for generated maps:

```powershell
corepack pnpm roadmap:dependency-map
corepack pnpm roadmap:dependency-map:publish
corepack pnpm roadmap:dependency-map:check
corepack pnpm roadmap:dependency-map:publish:check
```

Before claiming implementation completion, run the relevant focused checks and, when feasible:

```powershell
corepack pnpm verify
```
