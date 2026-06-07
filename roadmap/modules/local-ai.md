# Local AI and semantic assistance

## Registry

- Module ID: `MOD-LOCAL-AI`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/local-ai.md`

## Purpose

Local AI and semantic assistance defines the browser-local AI provider boundary and the policy-gated assistance services that can be reused by commands, Markdown flows, ITM review, visual surfaces, and workspace search.

## Boundaries

### Owns

- browser-local AI provider contract and capability detection
- policy-gated local AI command and assistance services
- local AI semantic review and search assistance
- optional local embedding provider seam

### Does not own

- backend-mediated AI service implementation
- deterministic ITM parsing, validation, or conformance truth
- automatic source mutation from AI output
- provider-specific browser API guarantees

## Public Contracts

- local AI provider capability report
- local AI policy modes and availability states
- local AI command/action integration contract
- semantic review finding and patch proposal shape
- optional embedding provider contract

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-AI-LOCAL-01` | Browser local AI provider and policy-gated capability contract | Registry-owned | Local AI foundation |
| `WP-AI-LOCAL-COMMANDS` | Local AI command palette and editor actions | Registry-owned | Local AI UX integration |
| `WP-AI-MD-ASSIST` | Markdown authoring, review, extraction, and report assistance | Registry-owned | Local AI authoring assistance |
| `WP-AI-ITM-REVIEW` | ITM semantic review, diagnostics, and patch proposals | Registry-owned | Local AI semantic review |
| `WP-AI-SEARCH-01` | Workspace semantic search without embeddings | Registry-owned | Local AI search assistance |
| `WP-AI-EMBED-01` | Optional local embedding/vector provider contract and vector index | Registry-owned | Optional local AI indexing |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when local AI capabilities are exposed through one policy-gated provider contract, deterministic validators remain authoritative, all AI edits are reviewable proposals, and unavailable browser capabilities degrade through stable no-op behavior.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.
- `ADR-0011` proposes the local AI capability architecture and semantic assistance layer.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- Introduced as proposed by `ADR-0011`.
