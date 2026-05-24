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


### Phase 5 — Contribution registries and package composition

Implementation anchors:

- Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`.
- pnpm packages: Phase 5: No new package install.


Update. Extend the Phase 3.3 shell-command substrate into the full contribution pack manifest shape, dependency declarations, capability declarations, and package composition rules for all contribution kinds.

### Phase 13 — Stage 2 advanced tabbed main surfaces

Implementation anchors:

- Architecture paragraphs: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`.
- pnpm packages: Phase 13: No new package install.


Update. Add stable session persistence types if needed for advanced tab groups and richer session semantics.

## Tests and definition of done

Type-level tests, compatibility tests for public contracts, command registry tests after Phase 3.3, no feature dependency leakage.

## Non-goals

Do not import app-shell internals. Do not bypass contribution registries. Do not take dependencies that fail the license gate. Do not make this package responsible for unrelated feature domains.

## Repository and workspace workflow

This package lives inside the main TextForge Git repository as an npm workspace package. It should remain independently buildable and testable, but it should not be managed as a Git submodule. Cross-package changes may be made in one branch by one agent, with commits scoped by package where practical. Package dependencies should use `workspace:*` references, and public integration should happen through contribution manifests or stable exported contracts rather than direct app-shell coupling.

## Phase 2 progress note

The package now defines stable source-editor language IDs, language metadata for the Phase 2 formats, editor capability IDs, and a diagnostic bridge contract. Runtime helpers infer language IDs from MIME type or extension for downstream editor and surface packages.

## Phase 3.3 closure note

The package now owns the minimal shell-command substrate promised for Phase 3.3: command contribution descriptors, command-context filtering, a command registry, grouped toolbar/menu resolution, and a local command dispatcher contract. The delivered substrate is intentionally limited to bundled shell commands so later Phase 5 work can extend the contribution-pack system without reworking the local command palette contract.
