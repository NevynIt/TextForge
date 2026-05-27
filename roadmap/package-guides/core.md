# @textforge/core — Package Implementation Guide

## Purpose

Shared contracts, diagnostics, contribution manifests, capabilities, resource references, source ranges, commands, and typed values.

## Ownership rule

`@textforge/core` owns its contracts and tests. Other packages should interact with it through public interfaces and contribution manifests, not private imports.

## Agent note

When this package is updated, the agent must also update `roadmap/RAPID.md` and review the package milestone plan below. If implementation reality changes the plan, update the roadmap/package guide in the same commit.

## Allowed dependencies

Internal dependencies: none or minimal.

Third-party candidates: None or near-none. All third-party dependencies must pass the open-source license gate.

## Public surface

Types and interfaces only: diagnostics, resource refs, source ranges, capabilities, commands, manifests, value envelopes, and patch contracts.

## Milestone plan

### Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Implementation anchors:

- Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`.
- pnpm packages: Phase 0: `pnpm --filter @textforge/core add -D typescript vitest`


Create. Define stable types: Diagnostic, Severity, SourceRange, ResourceRef, ContributionManifest, Command, Capability, PipelineValue, CanonicalPatch placeholders.

### Phase 2 — Source-editor coverage and language foundation

Implementation anchors:

- Architecture paragraphs: `ARCH-5.6-P01..P04`, `ARCH-6.6-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-14.1-P01..P02`.
- pnpm packages: Phase 2: No new package install.


Update. Stabilize language IDs, editor capabilities, lint/diagnostic bridge types.

### Phase 3.3 — Command palette and contribution-driven shell commands

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`.
- pnpm packages: Phase 3.3: No new package install.


Update. Add the minimal shell-command substrate: CommandManifest, CommandRegistry, CommandContext, CommandHandler, command contribution descriptors, command categories, and capability/context filtering needed for toolbar/menu/palette composition.

This phase is deliberately narrower than the full Phase 5 contribution system. It should support shell commands from existing packages without pulling pipeline steps, diagnostics aggregation, plugin management, or external package loading forward.

### Phase 3.4 — Resource identity badges and workbench readability pass

Implementation anchors:

- Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`.
- pnpm packages: Phase 3.4: No new package install.

Update only if a shared cross-package badge/resource identity contract is needed. Keep the contract minimal, such as a `DocumentBadgeToken` or resource badge metadata shape with `shape`, `accent`, `mark`, `placement`, `variant`, and labels. Rotation is not part of the Phase 3.4 token. Do not put visual badge-generation policy, persistence, shell rendering, panel layout, or readability styling in core.


### Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Implementation anchors:

- Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.7-P01..P04`.
- pnpm packages: Phase 3.5: No new package install.

Update only if existing public contracts cannot express popup focus, popup/main placement, or local panel preference state. Prefer no core change. Do not put visual layout policy, screenshot logic, resize implementation details, or app-shell duplication rules in core.


### Phase 3.6 — Unified workspace resources and representation-based surface routing

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`.
- pnpm packages: Phase 3.6: No new package install.


Update. Remove or deprecate `text` and `binary` as public resource-kind discriminators. Add only the minimal content/representation contract needed by workspace resources and surface routing, such as text content versus byte content. If a compatibility `ResourceKind` or transitional alias must remain, it must not be used as the canonical open-with eligibility mechanism.

Do not add a broad persistent metadata taxonomy. Keep representation, MIME type, language ID, path/extension, and optional provenance as the relevant facts. Openability should be computed by helper functions or surface predicates, not stored as `openableAs` metadata.

### Phase 3.7 — Context menus as thin command projections

Implementation anchors:

- Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 3.7: No new package install.


Update only if the existing command context cannot target the right-clicked workspace item, tab, or popup/session independently from the global selection. Add the smallest target-aware command-context shape needed, then keep context menus as ordinary command registry/dispatcher consumers. Do not create a second command model or plugin permission system.

### Phase 4.1 — Foundation stabilization before contribution registries

Implementation anchors:

- Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`.
- Grilling record: `roadmap/grilling/phase-4.1-grilling.md`.
- pnpm packages: Phase 4.1: No new package install.


Update. Stabilize the shared diagnostic contract, severity set, diagnostic source identity rules, command/action metadata contract, default-contribution manifest minimum, active/available/disabled/missing/failed capability states, short-name conflict behavior, resolver seam, and public package API boundary rules. Add or adapt tests so Phase 5 cannot start with duplicate command systems, ad hoc diagnostics, or source-layout package dependencies hidden in the foundation.

### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Own the canonical contribution manifest, package identity, capability identity, contribution local names, derived canonical contribution IDs, contribution/package status model, document-scoped pure resolver, deterministic ordering, diagnostic source identity rules, and UI-friendly registry/context read model. Phase 5 must consume the Phase 4.1 stabilization contracts rather than creating package-local registries.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 13: No new package install.


Update. Add stable session persistence types if needed for advanced tab groups and richer session semantics.

## Tests and definition of done

Include Phase 4.1 stabilization audit checks where this package is in scope. Type-level tests, compatibility tests for public contracts, command registry tests after Phase 3.3, resource representation contract tests after Phase 3.6, target-aware command-context tests after Phase 3.7, and no feature dependency leakage.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 2 progress note

The package now defines stable source-editor language IDs, language metadata for the Phase 2 formats, editor capability IDs, and a diagnostic bridge contract. Runtime helpers infer language IDs from MIME type or extension for downstream editor and surface packages.

## Phase 3.3 closure note

The package now owns the minimal shell-command substrate promised for Phase 3.3: command contribution descriptors, command-context filtering, a command registry, grouped toolbar/menu resolution, and a local command dispatcher contract. The delivered substrate is intentionally limited to bundled shell commands so later Phase 5 work can extend the contribution-pack system without reworking the local command palette contract.

## Phase 4.1 closure note

The package now owns the stabilized Phase 4.1 foundation contracts: normalized `observation`/`information`/`warning`/`error` diagnostics with origin metadata, resource facts plus resource predicates, default Markdown fence-handler contribution metadata, and a lightweight contribution registry that can report active/available capability state and emit active short-name conflict diagnostics before Phase 5 expands package composition.

## WP-05A progress note

`@textforge/core` now owns the first canonical WP-05A registry layer rather than the narrower Phase 4.1 placeholder. Contribution manifests normalize bundled package dependency descriptors, package-local contribution names, and derived canonical IDs for surfaces, pipelines, and Markdown fence handlers. The registry read model now sorts deterministically, reports package/dependency/conflict state, and exposes a UI-friendly package status view without collapsing package availability into the later document-scoped capability resolver work that belongs to `WP-05B`.

## WP-05B progress note

`@textforge/core` now also owns the pure WP-05B document resolver. Capabilities carry package-local names, aliases, and document predicates; the resolver accepts explicit `%require`-style inputs, computes deterministic activation order across explicit/document/workspace/app/core sources, preserves the bundled-static boundary, and emits active short-name plus missing/ambiguous requirement diagnostics without reintroducing package-local registries.

## WP-05C progress note

`@textforge/core` now carries the canonical bundled runtime hooks alongside the validated registry/resolver contract: surface contributions may expose package-owned `open(...)` execution, pipeline contributions may expose package-owned `run(...)` execution, and Markdown fence handlers remain contribution-owned runtime entries. The shell therefore consumes execution through canonical registered contributions rather than through its old local `contributionId` adapter table.

## WP-05D progress note

`@textforge/core` now also owns the minimal package/capability inspector read model instead of leaving package-state projection inside the shell. `createContributionInspectorModel(...)` derives deterministic package summaries, per-package capability/contribution state, current-document activation order, `%require` status, active-context conflicts, and diagnostics from the validated registry/resolver outputs so later UX can inspect capability-heavy behavior without recreating registry logic in the app.

## WP-RES-01 progress note

`@textforge/core` now extends the canonical resource and command-context contracts for provider-aware resource descriptors instead of introducing a second metadata model. `ResourceRef`, `ResourceFacts`, and command selection context now carry provider IDs, revision IDs, capability IDs, owner/provenance metadata, and resource diagnostics, with shared helpers for provider-aware capability checks consumed by workspace and shell code.


## V16 backend-optional responsibilities

`@textforge/core` is the preferred starting point for frontend-safe contracts: provider-aware resource descriptors, revisions, changesets, repository diagnostics, identity metadata, permission diagnostics, settings schemas, and AI/persistence contract placeholders where physical extraction is not yet justified. Keep these as contracts and pure helpers. Do not import backend-only adapters.
