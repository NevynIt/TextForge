# WP-PKG-MODULARITY-01 - Package root modularization

## Registry

- Workpackage ID: `WP-PKG-MODULARITY-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-ROADMAP-GOVERNANCE`
- ADRs: `ADR-0002`

## Outcome

Split monolithic package root implementation files into smaller internal modules while preserving package root public contracts.

## Scope

The executable scope is limited to package-local `src/index.js`, `src/index.ts`, and new package-local internal modules needed to split implementation by responsibility.

## Non-goals

- Changing package names or package export maps.
- Renaming public symbols, IDs, command IDs, contribution IDs, surface IDs, pipeline IDs, or type names.
- Requiring consumers to import from internal files.
- Architectural redesign or behavior changes beyond preserving existing behavior after the split.

## Package Impact

Potentially all packages under `packages/*` with root `src/index.*` files. Each package refactor must be isolated and documented in an ADR attachment.

## Interfaces / Contracts Changed

No public interface or cross-package contract changes are intended. Root package imports must continue to work.

## Validation Criteria

- Public export names before and after each package refactor are identical.
- No external deep imports into package internals are introduced.
- Package-local lint, typecheck, test, and build commands pass for each refactored package.
- Full repository verification passes after all package refactors.

## Evidence Required

- One `ADR-0002-attachments/<package>.md` report per package refactor.
- Package-local command output summary in each report.
- Final RAPID progress entry after full validation.

## Open Decisions

- None. Placeholder packages may receive report-only treatment if they have no runtime implementation to split.

## Notes

Keep commits incremental: roadmap preparation first, then one package/refactor report per commit where practical.
