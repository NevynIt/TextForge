# Developer documentation and API governance

## Registry

- Module ID: `MOD-DEVELOPER-DOCUMENTATION`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/developer-documentation.md`

## Purpose

Developer documentation and API governance defines how TextForge package contracts are documented, generated, reviewed, and protected from accidental drift.

## Boundaries

### Owns

- developer-facing API reference generation
- TSDoc comment conventions for exported APIs
- TypeDoc configuration and generated API site workflow
- API Extractor configuration and API report workflow
- package API review discipline

### Does not own

- end-user documentation shipped inside the TextForge app
- roadmap status or dependency authority
- application feature implementation
- broad TypeScript migration decisions

## Public Contracts

- TSDoc comment convention for exported APIs
- TypeDoc configuration and scripts
- API Extractor configuration and reports
- API report review process

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-API-DOCS-01` | Public API documentation with TSDoc and TypeDoc | Registry-owned | Developer tooling / documentation |
| `WP-API-GOV-01` | API surface governance with API Extractor | Registry-owned | Developer tooling / governance |

## Current State

TextForge has package-level public entrypoints and TypeScript type entrypoints, but no consistent generated API documentation site and no API report governance gate.

## Target State

The module is healthy when exported package APIs have useful TSDoc comments, TypeDoc can generate a local browsable API site, and API Extractor can report public API surface changes without blocking unrelated feature development prematurely.

## Key Decisions

- `ADR-0005` proposes developer API documentation and API surface governance.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and evidence linked in `roadmap-state.yaml`.

## Historical Notes

- Introduced by `ADR-0005`.
