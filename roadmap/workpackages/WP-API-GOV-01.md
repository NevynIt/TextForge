# WP-API-GOV-01 - API surface governance with API Extractor

## Registry

- Workpackage ID: `WP-API-GOV-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-DEVELOPER-DOCUMENTATION`
- ADRs: `ADR-0005`

## Outcome

TextForge has an API Extractor workflow that can review package public API surface changes, generate API reports, and support gradual API stability discipline without forcing a broad implementation-language migration.

## Scope

- Add API Extractor tooling after the TypeDoc/TSDoc baseline is in place.
- Establish the minimal declaration-output path required for API Extractor.
- Configure API reports for selected public packages.
- Add package or root scripts for running API extraction.
- Define how API report changes are reviewed in pull requests.
- Introduce release-tag discipline where useful, especially `@public`, `@beta`, and `@internal`.

## Non-goals

- Blocking all development on perfect API stability.
- Treating every package as externally stable immediately.
- Replacing TypeDoc as the human-readable documentation site.
- Migrating all JavaScript implementation files to TypeScript.
- Publishing npm packages as part of this workpackage.

## Package Impact

- Root workspace developer dependencies and scripts.
- Selected package build/declaration scripts.
- API Extractor configuration files.
- API report files under a stable review location such as `etc/` or package-local equivalents.

## Interfaces / Contracts Changed

- New API extraction command, expected to be named `api:extract` or `api:report` unless implementation records a different local convention.
- New API report review workflow.
- Optional declaration rollup outputs if needed by selected packages.

## Validation Criteria

- API Extractor runs successfully against the selected package set.
- API reports are generated in reviewable Markdown form.
- Accidental export changes can be detected by a check command.
- Internal-only APIs can be hidden or marked clearly.
- The workflow does not require changing unrelated runtime behavior.

## Evidence Required

- Command output from the API Extractor script.
- Example API report artifact.
- Evidence that a changed public signature produces a visible report/check difference.
- Updated validation evidence under `validation/evidence/` when implementation state changes.
- RAPID event entry for material progress, issues, or decisions.

## Open Decisions

- Which packages are in the first governed API set.
- Whether API report checks are included in root `verify` immediately or only after a trial period.
- Whether declaration rollups are needed before any external package publishing decision.

## Archive Trace

- Introduced by `ADR-0005`.
