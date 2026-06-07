# WP-AI-EMBED-01 - Optional local embedding/vector provider contract and vector index

## Registry

- Workpackage ID: `WP-AI-EMBED-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

TextForge can optionally add a local embedding provider seam and workspace-scoped vector index as derived data without assuming Chrome built-in AI provides embeddings.

## Scope

- Define a local embedding provider contract.
- Add workspace-scoped vector index storage as rebuildable derived data.
- Index selected Markdown sections, ITM nodes, diagnostics, comments, roadmap artifacts, and package/module documentation.
- Define reindexing, invalidation, and rebuild behavior.
- Allow future embedding providers without changing search UI.

## Non-goals

- Blocking `R-LOCAL-AI-MVP`.
- Assuming any current Chrome built-in AI embeddings API.
- Treating vector indexes as authoritative source.

## Package Impact

- future local AI package
- workspace/resource packages
- local service-folder or IndexedDB-backed storage
- search UI integration

## Interfaces / Contracts Changed

- Local embedding provider contract.
- Workspace vector index metadata and storage policy.
- Rebuild/invalidation contract for derived vector data.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-EMBED-01-local-embedding-vector-provider.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for provider availability and absence behavior.
- Focused tests for index rebuild and invalidation.
- Focused tests proving TextForge works without an embedding provider.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Which provider API shape is stable enough for first implementation.
- Whether vector storage uses the local service-folder convention or IndexedDB/Dexie directly.
- Which resource units are indexed first.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
- Depends on `WP-AI-SEARCH-01` and remains excluded from `R-LOCAL-AI-MVP`.
