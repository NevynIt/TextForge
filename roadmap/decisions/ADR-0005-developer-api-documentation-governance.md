# ADR-0005 - Developer API documentation and API surface governance

## Status

Proposed

## Date

2026-06-06

## Context

TextForge now uses a package-aware monorepo structure. The root workspace is pnpm-based and contains `apps/*` and `packages/*`. Individual packages expose public entrypoints; for example, `@textforge/core` exports `./src/index.js` and declares TypeScript types through `./src/index.ts`.

The codebase already has meaningful package boundaries and public barrels, but many exported types, factories, and contracts are not documented as API-level contracts. This makes it harder for agents and maintainers to understand which interfaces are stable, which are internal implementation details, and how modules should be consumed across packages.

The roadmap governance model requires `roadmap-state.yaml` to remain the authoritative registry for IDs, status, dependencies, module/workpackage/release/ADR links, and archive traces. Markdown pages explain registry entries. Durable decisions belong in ADRs. Therefore this decision introduces developer API documentation work as explicit roadmap workpackages rather than an ad hoc tooling change.

The second workpackage is intentionally separated from the first: TypeDoc/TSDoc creates useful human-readable API documentation, while API Extractor adds governance over the exported API surface. API Extractor should not block the first documentation pass.

## Decision

TextForge will introduce developer-facing API documentation in two staged workpackages:

1. `WP-API-DOCS-01` - Public API documentation with TSDoc and TypeDoc.
2. `WP-API-GOV-01` - API surface governance with API Extractor.

A new roadmap module is introduced for this concern:

- `MOD-DEVELOPER-DOCUMENTATION` - Developer documentation and API governance.

### TSDoc and TypeDoc decision

TextForge will use TSDoc-style comments on exported package APIs and TypeDoc to generate a browsable API reference site.

The first pass must focus on public contracts only:

- package entrypoints such as `packages/*/src/index.ts`;
- exported interfaces, type aliases, constants, and factory functions;
- contribution, command, resource, workspace, pipeline, renderer, parser, and diagnostics contracts;
- package-level overview pages explaining intended consumers and extension points.

The first pass must not attempt to comment every implementation helper.

TypeDoc output is a generated documentation artifact. It is not roadmap authority and must not duplicate roadmap status, dependency, or release truth.

### API Extractor decision

TextForge will later add API Extractor to review and stabilize the exported API surface of packages.

API Extractor will be used to:

- detect accidental public API changes;
- generate reviewable API reports;
- support release-tag discipline such as `@public`, `@beta`, and `@internal` where useful;
- optionally produce rolled-up declaration files if TextForge packages later need cleaner declaration publishing.

Because TextForge currently has packages that expose JavaScript runtime files with TypeScript type entrypoints, this workpackage must first establish the minimal declaration-generation path required by API Extractor. It must not force a broader TypeScript migration unless a later ADR decides that separately.

## Consequences

### Positive

- Maintainers and agents get a browsable API reference for package contracts.
- Public package boundaries become easier to understand and review.
- Documentation comments live near the code they explain.
- API Extractor gives a later governance gate for accidental API drift.
- The work is explicit in the roadmap and does not become hidden tooling debt.

### Negative / trade-offs

- TSDoc comments can drift unless reviewed with code changes.
- TypeDoc adds a documentation-generation toolchain to the repository.
- API Extractor adds configuration and may require declaration output not currently present in all packages.
- Over-documenting implementation details would add noise and slow refactoring.

### Follow-up required

- Add `MOD-DEVELOPER-DOCUMENTATION` to `roadmap-state.yaml`.
- Add `WP-API-DOCS-01` and `WP-API-GOV-01` to `roadmap-state.yaml`.
- Add explanatory workpackage pages under `roadmap/workpackages/`.
- Add validation checklists for both workpackages.
- Regenerate roadmap views after registry updates.
- Add a RAPID entry when implementation starts or when this ADR is accepted.

## Applies to

- Modules: `MOD-DEVELOPER-DOCUMENTATION`
- Workpackages: `WP-API-DOCS-01`, `WP-API-GOV-01`
- Releases: none initially
- Packages: root workspace tooling and public package entrypoints under `packages/*`

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
