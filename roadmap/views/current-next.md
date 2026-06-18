# Current And Next

> Generated from `roadmap-state.yaml`. Do not edit manually.

Planning order follows `docs/architecture/value-oriented-implementation-sequence-2026-06-07.md` via `value_oriented_planning_sequence` in `roadmap-state.yaml`.

## Current

| Plan | WP | Title | Status | Module |
|---:|---|---|---|---|
| 0.9 | `WP-MDPP-BASIC` | Basic md++ parser and embedded renderer | in-progress | `MOD-MARKDOWN-ITM` |
| 2 | `WP-ITM-PUB-VISUAL-01` | Shared visual pipeline for itm-pub | in-progress | `MOD-MARKDOWN-ITM` |
| 3 | `WP-MD-RICH` | Rich Markdown editing | in-progress | `MOD-MARKDOWN-ITM` |
| 4 | `WP-EA-VIEWER-01` | Exact EA dashboard viewer surface | in-progress | `MOD-EA-VIEWER` |
| 5 | `WP-TABLES` | CSV/TSV grid editor and shared table contract | ready | `MOD-TABLES` |
| 12.5 | `WP-RES-TYPE-OVERRIDE` | Workspace resource type overrides | in-progress | `MOD-WORKSPACE-RESOURCES` |

## Next Candidates

| Plan | WP | Title | Status | Module |
|---:|---|---|---|---|
| 1 | `WP-MD-REPORT` | Markdown + ITM report generation | defined | `MOD-MARKDOWN-ITM` |
| 5.1 | `WP-TABLES-02` | Shared semantic table rendering and exports | defined | `MOD-TABLES` |
| 6 | `WP-ITM-04` | ITM validation and conformance modules | candidate | `MOD-ITM` |
| 7 | `WP-ITM-05` | Parameterized ITM reports and dashboards | candidate | `MOD-ITM` |
| 8 | `WP-ITM-REACT-FLOW-DAGRE-01` | React Flow Dagre ITM graph surface | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| 9 | `WP-API-DOCS-01` | Public API documentation with TSDoc and TypeDoc | defined | `MOD-DEVELOPER-DOCUMENTATION` |
| 10 | `WP-API-GOV-01` | API surface governance with API Extractor | candidate | `MOD-DEVELOPER-DOCUMENTATION` |
| 11 | `WP-SET-01` | User settings core and local persistence | defined | `MOD-SURFACES-UI` |
| 12 | `WP-SET-UI` | User settings UI | defined | `MOD-SURFACES-UI` |
| 13 | `WP-RES-02` | Revisions, dirty state, and conflict diagnostics | defined | `MOD-WORKSPACE-RESOURCES` |
| 14 | `WP-RES-03` | Multi-resource changesets and provider allowlists | defined | `MOD-WORKSPACE-RESOURCES` |
| 15 | `WP-SERVICES-LOCAL` | Local service-folder convention | defined | `MOD-WORKSPACE-RESOURCES` |
| 16 | `WP-SURFACES-ADV` | Advanced tabbed main surfaces | defined | `MOD-SURFACES-UI` |
| 17 | `WP-LINK-INDEX` | Document link, backlink, and mention index | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| 18 | `WP-DOC-GRAPH` | Document neighborhood and local graph surface | candidate | `MOD-SURFACES-UI` |
| 19 | `WP-CANVAS` | Spatial workspace canvas | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| 20 | `WP-SKETCH` | Sketch and annotation resources | defined | `MOD-SKETCH` |
| 21 | `WP-COMMENTS-SIDECAR` | Comments and review sidecars | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| 22 | `WP-CHANGE-PROPOSALS` | Reviewable change proposals | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| 23 | `WP-PDF-EXPORT` | PDF generation/export | defined | `MOD-MARKDOWN-ITM` |
| 24 | `WP-PDF-ANNOTATE` | PDF annotation | defined | `MOD-SKETCH` |
| 25 | `WP-ITM-EXPLORATION-01` | Interactive ITM exploration workbench | candidate | `MOD-SURFACES-UI` |
| 26 | `WP-AI-LOCAL-01` | Browser local AI provider and policy-gated capability contract | candidate | `MOD-LOCAL-AI` |
| 27 | `WP-AI-LOCAL-COMMANDS` | Local AI command palette and editor actions | candidate | `MOD-LOCAL-AI` |
| 28 | `WP-AI-MD-ASSIST` | Markdown authoring, review, extraction, and report assistance | candidate | `MOD-LOCAL-AI` |
| 29 | `WP-AI-ITM-REVIEW` | ITM semantic review, diagnostics, and patch proposals | candidate | `MOD-LOCAL-AI` |
| 30 | `WP-AI-SEARCH-01` | Workspace semantic search without embeddings | candidate | `MOD-LOCAL-AI` |
| 31 | `WP-AI-EMBED-01` | Optional local embedding/vector provider contract and vector index | candidate | `MOD-LOCAL-AI` |
| 32 | `WP-GRAPH-EDIT-VITM` | Visual ITM edit/write-back foundation | defined | `MOD-VISUAL-ITM-RENDERERS` |
| 33 | `WP-VITM-VDELTA-01` | Visual ITM view-delta consumption and capture | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| 34 | `WP-VITM-LIVE-SYNC-01` | Bidirectional source/visual live sync | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| 35 | `WP-BPMN-VISUAL-C` | BPMN modeler/edit/write-back | candidate | `MOD-BPMN` |
| 36 | `WP-ARCHIMATE-SEM` | ArchiMate semantic profile | defined | `MOD-ARCHIMATE` |
| 37 | `WP-ARCHIMATE-VISUAL` | ArchiMate visual editing investigation | defined | `MOD-ARCHIMATE` |
| 38 | `WP-ID-01` | Identity contract | defined | `MOD-BACKEND-ENTERPRISE` |
| 39 | `WP-ID-DEV` | Development identity fixture provider | defined | `MOD-BACKEND-ENTERPRISE` |
| 40 | `WP-BE-HOST` | Enterprise container and app host | defined | `MOD-BACKEND-ENTERPRISE` |
| 41 | `WP-BE-API` | Backend API contract and frontend provider | defined | `MOD-BACKEND-ENTERPRISE` |
| 42 | `WP-POLICY-01` | Provider-neutral server policy engine | defined | `MOD-BACKEND-ENTERPRISE` |
| 43 | `WP-BE-PERSIST` | Reference persistence server | defined | `MOD-BACKEND-ENTERPRISE` |
| 44 | `WP-PRIVATE-CONTRACT` | Private/group space contracts | defined | `MOD-BACKEND-ENTERPRISE` |
| 45 | `WP-PRIVATE-SERVER` | Private/group spaces server | defined | `MOD-BACKEND-ENTERPRISE` |
| 46 | `WP-GITLAB` | GitLab persistence adapter | defined | `MOD-BACKEND-ENTERPRISE` |
| 47 | `WP-SERVICES-BE` | Backend-backed service folders | defined | `MOD-BACKEND-ENTERPRISE` |
| 48 | `WP-COLLAB-LEASES` | Soft collaboration leases | defined | `MOD-BACKEND-ENTERPRISE` |
| 49 | `WP-SET-SYNC` | Roaming user settings | defined | `MOD-SURFACES-UI` |
| 50 | `WP-AI-MEDIATOR` | AI contract and backend mediator | defined | `MOD-BACKEND-ENTERPRISE` |
| 51 | `WP-AI-CHAT` | AI client and chat surface | defined | `MOD-SURFACES-UI` |
| 52 | `WP-AI-PREF` | AI preference integration | defined | `MOD-BACKEND-ENTERPRISE` |
| 53 | `WP-RELEASE-GATE` | Release envelope and accreditation evidence | defined | `MOD-ROADMAP-GOVERNANCE` |
| 55 | `WP-SSO-OIDC` | Generic OIDC / Keycloak adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| 56 | `WP-SSO-SAML` | Generic SAML / enterprise IdP adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| 57 | `WP-SSO-KEYCLOAK` | Keycloak adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| 58 | `WP-DIST-PWA` | PWA/local packaged variant investigation | candidate | `MOD-SECURITY-DISTRIBUTION` |
| 59 | `WP-REPO-SHAREPOINT` | SharePoint-like repository adapter | candidate | `MOD-ROADMAP-GOVERNANCE` |
|  | `WP-VITM-TRANSLATORS` | Visual ITM translator utilities | candidate | `MOD-VISUAL-ITM-RENDERERS` |
|  | `WP-PIPELINE-EDITOR` | Pipeline/diagram editor surfaces | defined | `MOD-SURFACES-UI` |
