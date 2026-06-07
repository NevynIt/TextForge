# Status Dashboard

> Generated from `roadmap-state.yaml`. Do not edit manually.

## Counts

| Status | Count |
|---|---:|
| blocked | 1 |
| candidate | 24 |
| deferred | 1 |
| defined | 31 |
| implemented | 1 |
| in-progress | 3 |
| validated | 25 |

## Workpackages

| WP | Title | Status | Module |
|---|---|---|---|
| `WP-ROADMAP-CLEANUP` | Roadmap cleanup and governance reset | validated | `MOD-ROADMAP-GOVERNANCE` |
| `WP-05A` | Contribution manifest and registry model | validated | `MOD-SURFACES-UI` |
| `WP-05B` | Capability activation and resolver context | validated | `MOD-SURFACES-UI` |
| `WP-05C` | Pipeline/contribution execution integration | validated | `MOD-SURFACES-UI` |
| `WP-05D` | Minimal package/capability inspector | validated | `MOD-SURFACES-UI` |
| `WP-RES-01` | Provider-aware resource descriptors | validated | `MOD-WORKSPACE-RESOURCES` |
| `WP-RES-02` | Revisions, dirty state, and conflict diagnostics | defined | `MOD-WORKSPACE-RESOURCES` |
| `WP-RES-03` | Multi-resource changesets and provider allowlists | defined | `MOD-WORKSPACE-RESOURCES` |
| `WP-LINK-INDEX` | Document link, backlink, and mention index | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| `WP-DOC-GRAPH` | Document neighborhood and local graph surface | candidate | `MOD-SURFACES-UI` |
| `WP-ID-01` | Identity contract | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-ID-DEV` | Development identity fixture provider | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-POLICY-01` | Provider-neutral server policy engine | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-SSO-ENTRA` | Microsoft Entra SSO adapter | deferred | `MOD-SECURITY-DISTRIBUTION` |
| `WP-SSO-OIDC` | Generic OIDC / Keycloak adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| `WP-SET-01` | User settings core and local persistence | defined | `MOD-SURFACES-UI` |
| `WP-ITM-01` | ITM parser/model foundation | validated | `MOD-ITM` |
| `WP-ITM-02` | ITM directives, packages, validation, diagnostics | validated | `MOD-ITM` |
| `WP-ITM-03` | ITM scoped contexts, identity maps, and comments | validated | `MOD-ITM` |
| `WP-ITM-04` | ITM validation and conformance modules | candidate | `MOD-ITM` |
| `WP-ITM-05` | Parameterized ITM reports and dashboards | candidate | `MOD-ITM` |
| `WP-REPO-01` | Repository reference and include resolver | validated | `MOD-REPOSITORY` |
| `WP-ITM-VISUALS` | ITM static visual projections and publication baseline | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-VITM-01` | Visual ITM profile v1 | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-ITM-VTARGET-01` | ITM visual target picker MVP | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-ITM-VRESOLVE-01` | Shared ITM visual target resolver | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-RENDER-CYTOSCAPE` | Cytoscape runtime renderer package | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-ITM-PUB-VISUAL-01` | Shared visual pipeline for itm-pub | in-progress | `MOD-MARKDOWN-ITM` |
| `WP-RENDER-JSMIND` | jsMind runtime renderer package | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-RENDER-SIGMA` | Sigma/Graphology runtime renderer package | validated | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-VITM-TRANSLATORS` | Visual ITM translator utilities | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-VITM-VDELTA-01` | Visual ITM view-delta consumption and capture | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-VITM-LIVE-SYNC-01` | Bidirectional source/visual live sync | candidate | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-GRAPH-EDIT-VITM` | Visual ITM edit/write-back foundation | defined | `MOD-VISUAL-ITM-RENDERERS` |
| `WP-SERVICES-LOCAL` | Local service-folder convention | defined | `MOD-WORKSPACE-RESOURCES` |
| `WP-SET-UI` | User settings UI | defined | `MOD-SURFACES-UI` |
| `WP-CANVAS` | Spatial workspace canvas | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| `WP-LUA` | Lua automation | validated | `MOD-SURFACES-UI` |
| `WP-LUA-POWER-SESSION` | Lua self-escalation session and one-click recovery | validated | `MOD-SURFACES-UI` |
| `WP-LUA-VIRTUAL-HOST-01` | TextForge Lua virtual host for Fengari | implemented | `MOD-SURFACES-UI` |
| `WP-PRIVATE-CONTRACT` | Private/group space contracts | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-MD-REPORT` | Markdown + ITM report generation | defined | `MOD-MARKDOWN-ITM` |
| `WP-BE-HOST` | Enterprise container and app host | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-BE-API` | Backend API contract and frontend provider | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-BE-PERSIST` | Reference persistence server | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-PRIVATE-SERVER` | Private/group spaces server | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-SET-SYNC` | Roaming user settings | defined | `MOD-SURFACES-UI` |
| `WP-GITLAB` | GitLab persistence adapter | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-BPMN-SEM` | BPMN semantic profile and validation | validated | `MOD-BPMN` |
| `WP-BPMN-VISUAL-A` | BPMN.io viewer surface | validated | `MOD-BPMN` |
| `WP-BPMN-DI-01` | BPMN Diagram Interchange read-only fidelity | validated | `MOD-BPMN` |
| `WP-BPMN-VISUAL-B` | ITM/BPMN visual target integration | validated | `MOD-BPMN` |
| `WP-BPMN-VISUAL-C` | BPMN modeler/edit/write-back | candidate | `MOD-BPMN` |
| `WP-SERVICES-BE` | Backend-backed service folders | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-COLLAB-LEASES` | Soft collaboration leases | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-TABLES` | Tables, catalogues, and matrices | blocked | `MOD-TABLES` |
| `WP-AI-MEDIATOR` | AI contract and backend mediator | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-AI-CHAT` | AI client and chat surface | defined | `MOD-SURFACES-UI` |
| `WP-AI-PREF` | AI preference integration | defined | `MOD-BACKEND-ENTERPRISE` |
| `WP-AI-LOCAL-01` | Browser local AI provider and policy-gated capability contract | candidate | `MOD-LOCAL-AI` |
| `WP-AI-LOCAL-COMMANDS` | Local AI command palette and editor actions | candidate | `MOD-LOCAL-AI` |
| `WP-AI-MD-ASSIST` | Markdown authoring, review, extraction, and report assistance | candidate | `MOD-LOCAL-AI` |
| `WP-AI-ITM-REVIEW` | ITM semantic review, diagnostics, and patch proposals | candidate | `MOD-LOCAL-AI` |
| `WP-AI-SEARCH-01` | Workspace semantic search without embeddings | candidate | `MOD-LOCAL-AI` |
| `WP-AI-EMBED-01` | Optional local embedding/vector provider contract and vector index | candidate | `MOD-LOCAL-AI` |
| `WP-ARCHIMATE-SEM` | ArchiMate semantic profile | defined | `MOD-ARCHIMATE` |
| `WP-SURFACES-ADV` | Advanced tabbed main surfaces | defined | `MOD-SURFACES-UI` |
| `WP-MD-RICH` | Rich Markdown editing | in-progress | `MOD-MARKDOWN-ITM` |
| `WP-PIPELINE-EDITOR` | Pipeline/diagram editor surfaces | defined | `MOD-SURFACES-UI` |
| `WP-ITM-EXPLORATION-01` | Interactive ITM exploration workbench | candidate | `MOD-SURFACES-UI` |
| `WP-ARCHIMATE-VISUAL` | ArchiMate visual editing investigation | defined | `MOD-ARCHIMATE` |
| `WP-EA-VIEWER-01` | Exact EA dashboard viewer surface | in-progress | `MOD-EA-VIEWER` |
| `WP-SKETCH` | Sketch and annotation resources | defined | `MOD-SKETCH` |
| `WP-COMMENTS-SIDECAR` | Comments and review sidecars | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| `WP-CHANGE-PROPOSALS` | Reviewable change proposals | candidate | `MOD-KNOWLEDGE-WORKSPACE` |
| `WP-PDF-EXPORT` | PDF generation/export | defined | `MOD-MARKDOWN-ITM` |
| `WP-PDF-ANNOTATE` | PDF annotation | defined | `MOD-SKETCH` |
| `WP-RELEASE-GATE` | Release envelope and accreditation evidence | defined | `MOD-ROADMAP-GOVERNANCE` |
| `WP-SSO-SAML` | Generic SAML / enterprise IdP adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| `WP-SSO-KEYCLOAK` | Keycloak adapter | candidate | `MOD-SECURITY-DISTRIBUTION` |
| `WP-REPO-SHAREPOINT` | SharePoint-like repository adapter | candidate | `MOD-ROADMAP-GOVERNANCE` |
| `WP-DIST-PWA` | PWA/local packaged variant investigation | candidate | `MOD-SECURITY-DISTRIBUTION` |
| `WP-PKG-MODULARITY-01` | Package root modularization | validated | `MOD-ROADMAP-GOVERNANCE` |
| `WP-WEB-WORKBENCH-MODULARITY-01` | Web workbench modularization | validated | `MOD-SURFACES-UI` |
| `WP-API-DOCS-01` | Public API documentation with TSDoc and TypeDoc | defined | `MOD-DEVELOPER-DOCUMENTATION` |
| `WP-API-GOV-01` | API surface governance with API Extractor | candidate | `MOD-DEVELOPER-DOCUMENTATION` |
