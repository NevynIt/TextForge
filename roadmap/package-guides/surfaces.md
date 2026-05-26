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

Implementation anchors:

- Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 1: `pnpm --filter @textforge/surfaces add @textforge/core@workspace:* @textforge/ui@workspace:*`


Create. SurfaceContribution, SurfaceSession, SurfaceRegistry, one main SurfaceHost, popup SurfaceHost, open-with contract.

### Phase 2 — Source-editor coverage and language foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.6-P01..P04`, `ARCH-6.6-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 2: No new package install.


Update. Add open-with selection, source editor fallback, basic stale/current indicators.

### Phase 3.1 — React workbench shell and UI recovery

Implementation anchors:

- Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.1: `pnpm --filter @textforge/surfaces add react react-dom`; `pnpm --filter @textforge/surfaces add -D @types/react @types/react-dom`


Update. Keep the registry, session, placement, and host contracts stable while making them easy for the React shell to consume. Support the narrow main-session tab model required by the refreshed shell, with popup sessions kept out of the main document strip.

Do not add Phase 13 tab groups, drag movement, saved layout state, splits, or richer session persistence here.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install.


Update. Expose existing surface actions as shell command contributions where applicable: open-with, close, refresh/current-state handling, move main/popup, and active-surface focus actions. Preserve capability filtering through public contracts.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Update. Carry source-resource badge metadata into surface sessions, tab models, and surface headers without owning badge generation or persistence. Project the shared placement-based badge token through tabs and headers so the common surface chrome can expose compact identity/state indicators, active-resource highlighting, and readable surface metadata while preserving the Phase 3.1 rule that popup sessions stay out of the main document strip.

Do not pull Phase 13 advanced tab grouping, tab persistence, split panes, or drag/drop tab behavior forward.


### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.5: No new package install.

Update. Restore popup placement as a real in-app popup/overlay session rather than treating popup content as right-panel or utility-panel detail. Keep popup sessions separate from the main document strip, preserve capability-filtered move-to-main/open-as-popup actions, and provide only the session/placement metadata the UI needs for focus, close, and title behavior.

Do not add Phase 13 tab groups, tab drag/reorder, saved layout state, split panes, detached browser windows, or richer session persistence here.


### Phase 3.6 — Unified workspace resources and representation-based surface routing

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.6: No new package install.


Update. Replace resource-kind-based surface filtering with compatibility checks based on stored representation, MIME type, language ID, and path/extension. Surface contributions may expose a predicate or equivalent declarative compatibility shape, but should not require resources to be `kind: text` or `kind: binary`.

Open-with must support multiple valid surfaces for the same resource. SVG is the key validation case: a text-stored SVG must be compatible with both the source editor and the SVG visual viewer. Placement must remain independent from resource representation; compatible viewers should be usable in the main surface or popup where the surface supports that placement.

### Phase 3.7 — Context menus as thin command projections

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.7: No new package install.


Update only as needed so tab/session/popup context menus can target a specific surface session and reuse existing surface commands: focus, close, refresh, move to main/popup, and open-with. Do not introduce advanced tab management, drag/reorder, saved layouts, or a second command system.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Audit open-with routing and surface eligibility so they depend on resource facts plus capability predicates, not shell file-type logic. Confirm context-menu and surface actions are projections of the shared command/action spine. Identify any temporary adapters that Phase 5 must consume or remove.

### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Add package-provided surface registration and active-document-context compatibility. Surface selection, including pipeline intermediate reopening, must use the resolved document contribution context and produce shared diagnostics when no active compatible surface exists.

### Phase 7 — ITM visual projections

Implementation anchors:

- Architecture paragraphs: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Add ITM projection surface registrations.

### Phase 10 — BPMN support and first mature visual editor

Implementation anchors:

- Architecture paragraphs: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`.
- pnpm packages: No direct package install in this compatibility phase; consume public contracts produced by the active phase packages.


Update. Ensure controlled-write-back capability is represented in surface chrome.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 13: No new package install.


Update. Add tabbed main surface groups, tab movement, richer open-to-main/open-as-popup transitions beyond the Phase 3.5 popup overlay, optional pinned state, and advanced session semantics. Splits remain future.

## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Surface registration tests, placement tests, source binding/stale state tests, open-with behaviour tests, React-shell host compatibility tests after Phase 3.1, command contribution tests after Phase 3.3, badge metadata projection and chrome-readability tests after Phase 3.4, screenshot/layout checks after Phase 3.5, representation-based compatibility tests after Phase 3.6, and context-target command tests after Phase 3.7.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 2 progress note

The package now exposes open-with selection models, source-editor fallback records, and current/stale freshness helpers on surface sessions. The host can mark sessions stale or current without replacing the registry contract.

## Phase 3.1 closure note

The React shell still consumes the existing public registry and host contracts. The package now adds `listOpenSurfaceSessions(...)` and `createMainSessionTabStrip(...)` so the shell can derive a narrow main document strip from main sessions only while keeping popup sessions out of that strip.

Focused `lint` and `test` checks pass for the package, and browser-level shell validation confirms that the React frame still mounts the package-owned editor and asset surfaces through the unchanged surface registry/open-with path.

## Phase 3.3 closure note

The package now contributes the base shell actions that operate on open surfaces: close, refresh, move between main and popup placement, focus main/popup sessions, and command descriptors for compatible open-with targets. Capability-aware surface routing still stays inside the public surface registry and host contracts; the phase does not pull broader package-composition or later surface contribution work forward.

## Phase 3.5 closure note

Popup sessions now stay separate from the main document strip and reopen through a real overlay host in the app shell rather than being treated as right-panel content. The package still limits itself to session and placement semantics: focus, close, move-to-main, move-to-popup, and compact surface metadata remain available without pulling Phase 13 tab-group or session-persistence behavior forward.

## Phase 4.1 closure note

The package now resolves open-with compatibility through shared resource predicates over representation, MIME type, language ID, and extension facts, and it emits a structured diagnostic when no registered surface can open a resource. The context-menu and surface-command projection remains on the single command spine, while the app-shell surface-mount adapter is explicitly marked as temporary Phase 5 follow-up work rather than hidden shell coupling.


## V16 backend-optional responsibilities

`@textforge/surfaces` must keep openability based on resource facts, active capabilities, and provider affordances. Optional backend capability absence should remove or disable actions, not change document semantics or bypass the Phase 5 contribution model.
