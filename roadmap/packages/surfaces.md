# @textforge/surfaces — Package Implementation Guide

## Purpose

Surface registry, sessions, placement, main/popup hosts, open-with logic, source binding, stale state, and capabilities.

## Ownership rule

`@textforge/surfaces` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies:

- `@textforge/core`
- `@textforge/ui`

Third-party candidates: React. All third-party dependencies must pass the open-source license gate.

## Public surface

SurfaceContribution, SurfaceRegistry, SurfaceSessionManager, SurfacePlacement, SurfaceHost props, open-with commands.

## Milestone plan

### Phase 1 — Workspace and Stage 1 surface skeleton

Create. SurfaceContribution, SurfaceSession, SurfaceRegistry, one main SurfaceHost, popup SurfaceHost, open-with contract.

### Phase 2 — Source-editor coverage and language foundation

Update. Add open-with selection, source editor fallback, basic stale/current indicators.

### Phase 3.1 — React workbench shell and UI recovery

Update. Keep the registry, session, placement, and host contracts stable while making them easy for the React shell to consume. Support the narrow main-session tab model required by the refreshed shell, with popup sessions kept out of the main document strip.

Do not add Phase 13 tab groups, drag movement, saved layout state, splits, or richer session persistence here.

### Phase 3.3 — Command palette and contribution-driven shell commands

Update. Expose existing surface actions as shell command contributions where applicable: open-with, close, refresh/current-state handling, move main/popup, and active-surface focus actions. Preserve capability filtering through public contracts.

### Phase 5 — Contribution registries and package composition

Update. Add package-provided surface registration and capability-filtered commands beyond the base shell actions delivered in Phase 3.3.

### Phase 7 — ITM visual projections

Update. Add ITM projection surface registrations.

### Phase 10 — BPMN support and first mature visual editor

Update. Ensure controlled-write-back capability is represented in surface chrome.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Update. Add tabbed main surface groups, tab movement, richer open-to-main/open-as-popup transitions, optional pinned state, and advanced session semantics. Splits remain future.

## Tests and definition of done

Surface registration tests, placement tests, source binding/stale state tests, open-with behaviour tests, React-shell host compatibility tests after Phase 3.1, and command contribution tests after Phase 3.3.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 2 progress note

The package now exposes open-with selection models, source-editor fallback records, and current/stale freshness helpers on surface sessions. The host can mark sessions stale or current without replacing the registry contract.
