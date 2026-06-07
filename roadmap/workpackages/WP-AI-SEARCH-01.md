# WP-AI-SEARCH-01 - Workspace semantic search without embeddings

## Registry

- Workpackage ID: `WP-AI-SEARCH-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

Workspace search can provide semantic assistance without embeddings by using deterministic candidate retrieval followed by local AI reranking, classification, explanation, and cited results.

## Scope

- Retrieve candidates from deterministic workspace indexes.
- Use local AI only on a bounded candidate set.
- Rerank, classify, or explain retrieved candidates.
- Cite workspace resource IDs, paths, sections, nodes, diagnostics, or comments where available.
- Prevent AI from inventing resources outside retrieved candidates.

## Non-goals

- Vector indexing or embedding generation.
- Hidden whole-workspace AI scanning.
- Search results without local citations.

## Package Impact

- workspace/resource packages
- link/backlink/mention indexing
- future local AI package
- `apps/textforge-web`

## Interfaces / Contracts Changed

- Semantic search request and result shape.
- Deterministic candidate set handoff to local AI.
- Search result citation metadata.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-SEARCH-01-workspace-semantic-search-without-embeddings.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for deterministic candidate retrieval boundaries.
- Focused tests that AI reranking cannot add uncited external results.
- Manual UI evidence from the user for semantic search result presentation.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- First deterministic indexes included in the candidate retrieval set.
- Stable result citation model across Markdown, ITM, diagnostics, comments, and roadmap artifacts.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
- Enables later optional `WP-AI-EMBED-01`.
