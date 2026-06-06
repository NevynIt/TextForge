# WP-API-DOCS-01 - Public API documentation with TSDoc and TypeDoc

## Registry

- Workpackage ID: `WP-API-DOCS-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-DEVELOPER-DOCUMENTATION`
- ADRs: `ADR-0005`

## Outcome

TextForge has a consistent TSDoc convention for public package APIs and a root TypeDoc workflow that generates a browsable developer API reference site from package entrypoints.

## Scope

- Add TypeDoc as root developer tooling.
- Add a root TypeDoc configuration targeting public package API entrypoints.
- Add root scripts for generating API documentation.
- Add a short TSDoc authoring convention for TextForge contributors and agents.
- Add TSDoc comments to a first useful slice of exported public APIs.
- Ensure generated documentation can be opened locally from the configured output folder.

## Non-goals

- Documenting every implementation helper.
- Treating generated API docs as roadmap authority.
- Publishing the site externally as part of this workpackage.
- Adding API Extractor governance; that belongs to `WP-API-GOV-01`.
- Broad migration of JavaScript implementation files to TypeScript.

## Package Impact

- Root workspace package scripts and developer dependencies.
- Public package entrypoints under `packages/*/src/index.ts`.
- Exported public types/functions in packages selected for the first documentation slice.

## Interfaces / Contracts Changed

- New root documentation script, expected to be named `docs:api` unless implementation finds a better local convention.
- New TypeDoc configuration file, expected at repository root unless implementation records a different choice.
- New TSDoc convention for public exported APIs.

## Validation Criteria

- `pnpm docs:api` or the final equivalent command generates the API reference without errors.
- The generated site contains at least the core public package entrypoints selected in the TypeDoc configuration.
- Public comments explain intent, parameters, returns, and stability where useful.
- Implementation comments are not blindly converted into public API comments.
- The roadmap registry links this workpackage to `ADR-0005`.

## Evidence Required

- Command output from the API documentation generation script.
- Screenshot or file listing proving the generated docs entry page exists.
- Focused review of at least one package API page for usefulness.
- Updated validation evidence under `validation/evidence/` when implementation state changes.
- RAPID event entry for material progress, issues, or decisions.

## Open Decisions

- Whether generated HTML should be committed, ignored, or published as a CI artifact.
- Whether TypeDoc should document all public packages immediately or start from a curated subset.

## Archive Trace

- Introduced by `ADR-0005`.
