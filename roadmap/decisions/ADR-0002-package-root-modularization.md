# ADR-0002 - Package root modularization

## Status

Accepted

## Date

2026-06-06

## Context

Many TextForge workspace packages have large `src/index.js` and `src/index.ts` files that combine public exports, contribution manifests, runtime implementation, model helpers, and package-local services.

Those root files are the public package entrypoints used by the app and other packages. Existing consumers import from package roots such as `@textforge/workspace`, `@textforge/itm`, or `@textforge/ui`, and package-level contribution IDs, command IDs, surface IDs, pipeline IDs, and type names are part of the cross-package contract.

The codebase needs smaller internal modules for maintainability, but this must not create new public import paths or change external behavior.

## Decision

Refactor package root implementation files into package-local internal modules while keeping `src/index.js` and `src/index.ts` as explicit public facades.

The refactor must preserve:

- package names and package export maps;
- all public exported symbol names;
- contribution, command, surface, pipeline, manifest, and capability IDs;
- runtime behavior and value shapes;
- the existing `@textforge/itm/node` secondary entrypoint.

Each package refactor records a package attachment under `ADR-0002-attachments/` with export compatibility, files changed, validation commands, and residual risk notes.

## Consequences

### Positive

- Package internals become easier to navigate and review.
- Public package contracts remain stable for apps and dependent packages.
- Future feature work can change coherent internal modules instead of monolithic root files.
- Export compatibility evidence is captured next to the architectural decision.

### Negative / trade-offs

- The refactor touches many packages and requires careful incremental validation.
- Root facades remain broad because public API compatibility is mandatory.
- Some placeholder packages may only receive report notes until they have runtime implementation worth splitting.

### Follow-up required

- Complete one package at a time with one attachment report per package.
- Keep commits incremental and package-scoped after the roadmap preparation commit.
- Run package-local checks after each package and full workspace verification after all package splits.

## Applies to

- Modules: all package-owning modules
- Workpackages: `WP-PKG-MODULARITY-01`
- Releases: none

## Attachments

- `ADR-0002-attachments/README.md`

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
