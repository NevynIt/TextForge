# TextForge Value-Oriented Implementation Sequence Snapshot

Snapshot timestamp: **2026-06-07 15:30 Europe/Brussels**

Source branch: `main`

This document records the intended implementation sequence discussed after the value-oriented evolution snapshot. It is a **planning guidance snapshot**, not a generated roadmap view and not a replacement for `roadmap/roadmap-state.yaml`.

The roadmap authority rules still apply:

- `roadmap/roadmap-state.yaml` remains authoritative for workpackage status, dependencies, modules, releases, ADR links, and archive traces.
- `roadmap/views/current-next.md` is generated from `roadmap-state.yaml` and must not be edited manually.
- This document explains the intended sequencing logic for implementers when multiple dependency-valid next steps are available.

## Sequencing principle

The implementation order should be value-oriented rather than prerequisite-pure:

1. finish visible document/report/dashboard work already in progress;
2. bring tables and the generic React Flow/Dagre graph surface forward as early user-facing wins;
3. pull only the hard prerequisites needed for those wins forward;
4. introduce developer API governance before AI, visual editing, backend, and enterprise complexity expands;
5. keep backend and enterprise work optional and later.

## Current focus

| Priority | Workpackage | Reason |
|---:|---|---|
| 1 | `WP-MD-REPORT` | Missing base for the report/document slice. It enables `WP-ITM-PUB-VISUAL-01`, `WP-MD-RICH`, and later AI Markdown assistance. |
| 2 | `WP-ITM-PUB-VISUAL-01` | Already in progress; gives Markdown reports reusable model-backed visual publication. |
| 3 | `WP-MD-RICH` | Already in progress; improves the document authoring workflow. |
| 4 | `WP-EA-VIEWER-01` | Already in progress; gives an early concrete dashboard surface and proves the React Flow/Dagre interaction pattern. |

## Immediate next focus

| Priority | Workpackage | Reason |
|---:|---|---|
| 5 | `WP-TABLES` | High-value review surface for catalogues, matrices, diagnostics, and inventories. Treat its current blocked state as a near-term unblock, not as a reason to defer the feature. |
| 6 | `WP-ITM-04` | Pull forward because reliable validation and conformance support tables, report quality, profile readiness, AI review, and parameterized dashboards. |
| 7 | `WP-ITM-05` | Pull forward because parameterized reports/dashboards are the shortest path to reusable model analysis and are a prerequisite for the generic React Flow/Dagre ITM graph surface. |
| 8 | `WP-ITM-REACT-FLOW-DAGRE-01` | Bring forward as an early visual capability after the EA viewer. It generalizes the EA dashboard control pattern into reusable ITM graph views. |

## Stabilize before high-complexity work

| Priority | Workpackage | Reason |
|---:|---|---|
| 9 | `WP-API-DOCS-01` | Introduce TypeDoc/TSDoc documentation while package APIs are still manageable. |
| 10 | `WP-API-GOV-01` | Add API Extractor governance before AI, visual editing, backend, and enterprise features increase public API pressure. |

## Recommended implementation order

| Order | Implement | Why this order |
|---:|---|---|
| 0 | Treat as already done / do not reopen: contribution spine, `WP-RES-01`, `WP-ITM-01`, `WP-ITM-02`, `WP-ITM-03`, `WP-REPO-01`, Visual ITM baseline/renderers, Lua base, BPMN read-only chain | These are already validated or implemented and should be used as foundations, not re-sequenced. |
| 1 | `WP-MD-REPORT` | Missing base for the report/document slice. It enables both `WP-ITM-PUB-VISUAL-01` and `WP-MD-RICH`. |
| 2 | Finish `WP-ITM-PUB-VISUAL-01` and `WP-MD-RICH` | Both are already in progress and become coherent once report generation is stable. |
| 3 | Finish `WP-EA-VIEWER-01` | Already in progress; gives an early visible dashboard win and proves the React Flow/Dagre interaction pattern. |
| 4 | Unblock and implement `WP-TABLES` | High-value review surface. Its declared hard prerequisites are already validated: ITM core and BPMN semantic profile. |
| 5 | `WP-ITM-04` | Pull forward as the validation/conformance base for tables quality, reports, AI review, ArchiMate, and parameterized dashboards. |
| 6 | `WP-ITM-05` | Pull forward because React Flow/Dagre viewpoint controls depend on parameterized execution/control concepts from `ADR-0009`. |
| 7 | `WP-ITM-REACT-FLOW-DAGRE-01` | Early high-value visual capability after the EA viewer. Generalizes EA-style controls into ITM views/viewpoints. |
| 8 | `WP-API-DOCS-01` -> `WP-API-GOV-01` | Developer governance before AI, visual editing, backend, and enterprise complexity grows. |
| 9 | `WP-SET-01` -> `WP-SET-UI` | Needed for preferences, local AI policy, advanced surfaces, and later roaming settings. |
| 10 | `WP-RES-02` -> `WP-RES-03` | Needed before reviewable changes, visual write-back, backend providers, AI patch flows, and BPMN editing. |
| 11 | `WP-SERVICES-LOCAL` | Prepares local derived artifacts, caches, indexes, and later embeddings. |
| 12 | `WP-SURFACES-ADV` | Needed before richer exploration, document graph, and canvas workflows. |
| 13 | `WP-LINK-INDEX` | Deterministic workspace search and knowledge indexing before AI search. |
| 14 | `WP-DOC-GRAPH`, `WP-CANVAS`, `WP-SKETCH` | User-facing knowledge, navigation, and early-thinking surfaces. |
| 15 | `WP-COMMENTS-SIDECAR` -> `WP-CHANGE-PROPOSALS` | Safe review workflow after revisions, changesets, and link index. |
| 16 | `WP-PDF-EXPORT` -> `WP-PDF-ANNOTATE` | Export and annotation after report/sketch foundations. |
| 17 | `WP-ITM-EXPLORATION-01` | Now supported by validation, parameterized dashboards, visual resolver, advanced surfaces, and tables. |
| 18 | `WP-AI-LOCAL-01` | Local AI provider foundation after settings and the capability spine. |
| 19 | `WP-AI-LOCAL-COMMANDS` | First useful AI UX actions: summarize, translate, rewrite, explain diagnostics. |
| 20 | `WP-AI-MD-ASSIST`, `WP-AI-ITM-REVIEW` | Markdown and ITM assistance after deterministic validation/reporting. |
| 21 | `WP-AI-SEARCH-01` -> `WP-AI-EMBED-01` | Search before optional embeddings; deterministic retrieval remains first. |
| 22 | `WP-GRAPH-EDIT-VITM` -> `WP-VITM-VDELTA-01` -> `WP-VITM-LIVE-SYNC-01` | Visual editing only after changesets and graph surface foundations. |
| 23 | `WP-BPMN-VISUAL-C` | BPMN editing/write-back after graph edit and `WP-RES-03`. |
| 24 | `WP-ARCHIMATE-SEM` -> `WP-ARCHIMATE-VISUAL` | Architecture profile after core validation and graph infrastructure. |
| 25 | Backend foundation after fixing the policy/persistence dependency cycle | Implement `WP-ID-01`, `WP-ID-DEV`, `WP-BE-HOST`, `WP-BE-API`, then split or relax the `WP-POLICY-01` / `WP-BE-PERSIST` cycle before continuing. |
| 26 | Backend collaboration and backend AI | GitLab, backend service folders, collaboration leases, settings sync, AI mediator/chat/preferences. |
| 27 | Enterprise adapters and distribution | SSO adapters, PWA/local package investigation, and SharePoint-like repository adapter. |

## Registry note

This snapshot does **not** change workpackage statuses. If the project wants the generated `roadmap/views/current-next.md` to reflect this order directly, the registry will need an explicit sequencing field or status/order convention in `roadmap-state.yaml`; otherwise the generated view will continue to reflect status buckets rather than the value-oriented implementation priority.
