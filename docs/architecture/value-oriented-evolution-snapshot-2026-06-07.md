# TextForge Value-Oriented Evolution Snapshot

Snapshot timestamp: **2026-06-07 15:15 Europe/Brussels**

Source branch: `rewrite/v2-monorepo`

This document is a narrative snapshot of the TextForge roadmap as a **value-oriented implementation sequence**. It is not a replacement for `roadmap/roadmap-state.yaml`, which remains the authoritative registry for modules, workpackages, dependencies, releases, and ADR links.

The sequence below is intentionally not a pure prerequisite graph. It brings forward early user value while still respecting hard roadmap dependencies inside each capability slice.

## Terms used in this snapshot

- **TextForge**: a local-first browser workbench for text-first authoring, structured models, validation, visual surfaces, reports, and package-owned extensions.
- **ITM**: Indented Text Model, TextForge's plain-text modeling format.
- **Surface**: a contributed UI area such as an editor, preview, graph viewer, table, diagnostics panel, dashboard, or exploration panel.
- **Workspace resource**: TextForge's internal record for a file, model, report, generated artifact, cache, or future backend item.
- **WP**: workpackage.
- **ADR**: Architecture Decision Record.

## 1. Value-oriented narrative table

| Step | Narrative |
|---:|---|
| 1 | **TextForge becomes a local workbench for structured text.** TextForge is a local-first browser workbench for editing, previewing, validating, and publishing structured text documents. The first user value is simple: open local files, work safely, and avoid requiring a server. |
| 2 | **TextForge treats files and outputs as workspace resources.** A workspace resource is TextForge's internal record for anything the user can work with: a source file, model, report, generated diagram, table, cache, or future backend item. This lets TextForge track origin, type, dirty state, revision, and save capability. |
| 3 | **Packages add surfaces, commands, and renderers.** A surface is a UI area such as an editor, preview, graph viewer, table, diagnostics panel, or dashboard. Packages can contribute surfaces and commands so TextForge can grow without hard-coding every feature into the core app. |
| 4 | **Developer API governance is introduced early.** As soon as packages and surfaces exist, TextForge needs documented APIs and stable package boundaries. TypeDoc, TSDoc, and API Extractor should appear before the roadmap becomes crowded with AI, visual editing, backend, and enterprise features. |
| 5 | **ITM is introduced as the core modeling language.** ITM means Indented Text Model: a plain-text format for structured models. It lets users write readable indented text with ids, types, tags, links, attributes, and descriptions while still giving TextForge enough structure to validate and render the model. |
| 6 | **ITM becomes composable across files and packages.** ITM adds directives, includes, packages, contexts, scoped activation, identity maps, styles, views, viewpoints, and diagnostics. This lets users split models across files and reuse profile/package content safely. |
| 7 | **ITM validation becomes reliable and explainable.** TextForge can detect missing ids, unresolved links, invalid types, invalid relationships, missing attributes, bad patterns, and profile-specific rule failures. Validation produces consistent diagnostics instead of ad hoc parser messages. |
| 8 | **BPMN is introduced as an early process-modeling capability.** BPMN means Business Process Model and Notation, a standard for describing business processes. TextForge first represents BPMN concepts and validation rules semantically in ITM, proving that ITM can host a real domain profile. |
| 9 | **BPMN viewing comes before BPMN editing.** TextForge can show BPMN diagrams using BPMN.io and preserve Diagram Interchange layout before attempting visual write-back. This gives users process-diagram value while keeping editing risk controlled. |
| 10 | **Tables, catalogues, and matrices become early review surfaces.** Not every model question is best answered by a graph. TextForge adds tables, catalogues, relationship matrices, diagnostics tables, and grid-style views so users can review inventories, relationships, and validation results efficiently. |
| 11 | **Markdown becomes the human-facing report format.** Markdown is the readable prose layer for explanations, decisions, analysis, and documentation. TextForge connects Markdown to ITM so reports can include live model-backed outputs instead of manually copied diagrams or tables. |
| 12 | **`itm-pub` turns Markdown into model-backed publication.** `itm-pub` is the publication request layer. It lets a Markdown report ask TextForge to render an ITM view, graph, catalogue, matrix, or diagnostic section directly from model content. |
| 13 | **Parameterized reports become reusable tools.** A parameterized report declares inputs such as target model, selector, strict mode, or projection type. The same report can be reused across different models or scopes without editing the report source. |
| 14 | **Rich Markdown and export improve the document workflow.** Once Markdown reports are useful, TextForge improves editing, preview, embedded blocks, and eventually PDF export. This makes report authoring a real product workflow, not just a technical demo. |
| 15 | **Lua automation gives power users local scripting.** Lua is a local scripting layer for repeatable transformations, inspections, and helper workflows. Because TextForge runs in the browser, Lua must use a safe TextForge virtual host rather than direct OS or filesystem access. |
| 16 | **ITM models become immediately visual.** TextForge can show ITM as trees, graphs, mind maps, catalogues, matrices, Mermaid diagrams, Graphviz/DOT diagrams, Cytoscape graphs, jsMind maps, or Sigma graphs. The text remains the source of truth; visuals are generated views. |
| 17 | **Visual targets make rendering explicit.** A visual target answers: "what exactly should be rendered?" It may point to a model, subtree, named view, viewpoint, or filtered projection. This avoids each renderer inventing its own interpretation of ITM. |
| 18 | **The EA dashboard is introduced as a concrete viewer.** The Enterprise Architecture dashboard is a dashboard-style surface for architecture data. It uses local JSON fixtures, React Flow interaction, Dagre layout, filters, sliders, levels of detail, and drill-downs. |
| 19 | **React Flow/Dagre becomes a generic ITM graph surface.** After the EA dashboard proves the interaction pattern, TextForge generalizes it. ITM views and viewpoints can declare graph controls such as checkboxes, sliders, selectors, filters, focus nodes, and layout options. |
| 20 | **The ITM exploration workbench becomes a model lab.** Users can open a model, run selectors, test rules, inspect diagnostics, generate graphs, compare views, try transformations, and promote useful results back into source files. Temporary exploration stays transient until explicitly saved. |
| 21 | **Visual deltas preserve presentation choices.** Moving nodes, hiding elements, pinning positions, or collapsing branches are visual changes, not semantic model changes. TextForge records them as view deltas so the source model remains clean. |
| 22 | **Controlled visual editing comes only after safe foundations.** Later visual editors may add, rename, connect, or modify model elements. Those changes must become reviewable source patches or controlled write-back operations, not hidden graph mutations. |
| 23 | **ArchiMate is introduced as an architecture-modeling profile.** ArchiMate is a standard enterprise-architecture modeling language. TextForge follows the BPMN pattern: semantic profile and validation first, then visual investigation later. |
| 24 | **ArchiMate visual investigation reuses shared graph infrastructure.** ArchiMate rendering/editing should not become a separate app. It should reuse ITM validation, visual targets, graph renderers, and controlled visual-editing foundations. |
| 25 | **The workspace becomes connected knowledge.** TextForge indexes links, backlinks, mentions, headings, ITM ids, model references, diagnostics, comments, and change proposals. Users can navigate the workspace as a connected knowledge base. |
| 26 | **Deterministic workspace search comes before AI search.** TextForge first searches concrete facts: file names, headings, links, ids, tags, types, attributes, relationships, diagnostics, comments, and roadmap ids. This gives reliable cited results before AI is involved. |
| 27 | **Comments and change proposals support review.** Comments, annotations, and proposed changes are stored beside source files rather than mixed into them. This supports review, collaboration, and later AI-generated suggestions without damaging canonical source. |
| 28 | **Canvas and sketch surfaces support early thinking.** A canvas or sketch surface lets users arrange notes, documents, diagrams, and annotations spatially before deciding what should become structured ITM or Markdown. |
| 29 | **Local AI is introduced as a controlled capability provider.** Local AI means browser-local AI capabilities where available, not automatic calls to an external service. TextForge detects what the browser supports, reports availability, and applies explicit policy before enabling actions. |
| 30 | **Local AI first helps with small authoring tasks.** The first useful AI actions are scoped and user-triggered: summarize a selection, translate text, rewrite a paragraph, detect language, or explain a diagnostic. AI output remains transient unless explicitly applied. |
| 31 | **Local AI helps Markdown become structured content.** AI can review report structure, find unclear sections, extract decisions, actions, risks, requirements, or glossary terms, and propose Markdown-to-ITM patches. |
| 32 | **Local AI reviews ITM semantically after deterministic validation.** Deterministic validation checks formal rules. AI review adds softer observations such as vague requirements, likely duplicates, missing relationships, mixed abstraction levels, or suspicious type choices. |
| 33 | **Embeddings and vector search remain optional.** Embeddings turn text or model fragments into vectors for similarity search. TextForge treats this as optional because useful semantic search should work first through deterministic retrieval plus AI reranking. |
| 34 | **The optional backend extends local-first work.** A backend can add identity, policy, persistence, private/group spaces, server-side resource providers, and shared storage. It is an enterprise extension, not a requirement for local authoring. |
| 35 | **Backend collaboration adds team workflows.** With backend persistence and policy, TextForge can add GitLab storage, service folders, soft collaboration leases, roaming settings, backend-mediated AI, and team-oriented review flows. |
| 36 | **Enterprise deployment adds accreditation features.** Enterprise use needs SSO, OIDC/SAML/Keycloak options, PWA or packaged variants, repository adapters, policy evidence, and release gates. These make TextForge deployable in controlled organizations. |

## 2. Workpackage/module mapping table

| Step | Title | Main workpackages | Main modules | ADR / release notes |
|---:|---|---|---|---|
| 1 | Local workbench for structured text | `WP-05A`, `WP-05B`, `WP-05C`, `WP-RES-01`, `WP-ITM-01`, `WP-REPO-01` | `MOD-SURFACES-UI`, `MOD-WORKSPACE-RESOURCES`, `MOD-ITM`, `MOD-REPOSITORY` | `ADR-0001`; `R-LOCAL-AUTHORING-MVP` |
| 2 | Workspace resources | `WP-RES-01`, `WP-RES-02`, `WP-RES-03` | `MOD-WORKSPACE-RESOURCES` | `ADR-0001`; enables write-back, review, backend, and AI patch flows |
| 3 | Package surfaces and commands | `WP-05A`, `WP-05B`, `WP-05C`, `WP-05D`, `WP-WEB-WORKBENCH-MODULARITY-01` | `MOD-SURFACES-UI` | `ADR-0001`, `ADR-0003` |
| 4 | Developer API governance | `WP-API-DOCS-01`, `WP-API-GOV-01` | `MOD-DEVELOPER-DOCUMENTATION` | `ADR-0005` |
| 5 | ITM core language | `WP-ITM-01` | `MOD-ITM` | `ADR-0001`; `R-LOCAL-AUTHORING-MVP` |
| 6 | ITM composition and packages | `WP-ITM-02`, `WP-ITM-03`, `WP-REPO-01` | `MOD-ITM`, `MOD-REPOSITORY` | `ADR-0001`, `ADR-0006`, `ADR-0007` |
| 7 | ITM validation | `WP-ITM-04` | `MOD-ITM` | `ADR-0008`; candidate |
| 8 | BPMN semantic profile | `WP-BPMN-SEM` | `MOD-BPMN`, `MOD-ITM` | `ADR-0001`; consumes ITM package/validation foundations |
| 9 | BPMN viewing and Diagram Interchange | `WP-BPMN-VISUAL-A`, `WP-BPMN-DI-01`, `WP-BPMN-VISUAL-B` | `MOD-BPMN`, `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`; read-only BPMN visual chain |
| 10 | Tables, catalogues, and matrices | `WP-TABLES` | `MOD-TABLES`, `MOD-ITM`, `MOD-BPMN` | `ADR-0001`; currently blocked in the roadmap view |
| 11 | Markdown reports | `WP-MD-REPORT` | `MOD-MARKDOWN-ITM` | `ADR-0001`; related to `ADR-0009` |
| 12 | `itm-pub` visual publication | `WP-ITM-PUB-VISUAL-01` | `MOD-MARKDOWN-ITM`, `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`; currently in progress |
| 13 | Parameterized reports | `WP-ITM-05` | `MOD-ITM`, `MOD-MARKDOWN-ITM` | `ADR-0009`; candidate |
| 14 | Rich Markdown and export | `WP-MD-RICH`, `WP-PDF-EXPORT` | `MOD-MARKDOWN-ITM` | `ADR-0001`; `WP-MD-RICH` currently in progress |
| 15 | Lua automation | `WP-LUA`, `WP-LUA-POWER-SESSION`, `WP-LUA-VIRTUAL-HOST-01` | `MOD-SURFACES-UI` | `ADR-0004`; local automation and runtime hardening |
| 16 | ITM visual projections | `WP-ITM-VISUALS` | `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`; local and visual modeling releases |
| 17 | Visual targets and resolver | `WP-VITM-01`, `WP-ITM-VTARGET-01`, `WP-ITM-VRESOLVE-01` | `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`; shared visual contract |
| 18 | EA dashboard viewer | `WP-EA-VIEWER-01` | `MOD-EA-VIEWER`, `MOD-SURFACES-UI`, `MOD-WORKSPACE-RESOURCES` | `ADR-0001`, referenced by `ADR-0012`; `R-EA-VIEWER-MVP` |
| 19 | Generic React Flow/Dagre graph | `WP-ITM-REACT-FLOW-DAGRE-01` | `MOD-VISUAL-ITM-RENDERERS`, related `MOD-EA-VIEWER` | `ADR-0012`; candidate in `R-VISUAL-MODELING-MVP` |
| 20 | ITM exploration workbench | `WP-SURFACES-ADV`, `WP-ITM-EXPLORATION-01` | `MOD-SURFACES-UI`, `MOD-ITM`, `MOD-TABLES`, `MOD-VISUAL-ITM-RENDERERS` | `ADR-0010`, related to `ADR-0009`, `ADR-0012` |
| 21 | View deltas | `WP-VITM-VDELTA-01`, `WP-VITM-LIVE-SYNC-01` | `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`, `ADR-0012` |
| 22 | Controlled visual editing | `WP-GRAPH-EDIT-VITM`, `WP-BPMN-VISUAL-C` | `MOD-VISUAL-ITM-RENDERERS`, `MOD-BPMN`, `MOD-WORKSPACE-RESOURCES` | `ADR-0001`, `ADR-0012`; depends on changesets/resource safety |
| 23 | ArchiMate semantic profile | `WP-ARCHIMATE-SEM` | `MOD-ARCHIMATE`, `MOD-ITM` | `ADR-0001`; profile foundation |
| 24 | ArchiMate visual investigation | `WP-ARCHIMATE-VISUAL` | `MOD-ARCHIMATE`, `MOD-VISUAL-ITM-RENDERERS` | `ADR-0001`; visual modeling candidate |
| 25 | Connected knowledge workspace | `WP-LINK-INDEX`, `WP-DOC-GRAPH` | `MOD-KNOWLEDGE-WORKSPACE`, `MOD-SURFACES-UI` | `ADR-0001`; local knowledge navigation |
| 26 | Deterministic workspace search | `WP-LINK-INDEX`, `WP-AI-SEARCH-01` | `MOD-KNOWLEDGE-WORKSPACE`, `MOD-LOCAL-AI`, `MOD-WORKSPACE-RESOURCES` | `ADR-0011`; deterministic retrieval is the required first layer |
| 27 | Comments and change proposals | `WP-COMMENTS-SIDECAR`, `WP-CHANGE-PROPOSALS`, `WP-PDF-ANNOTATE` | `MOD-KNOWLEDGE-WORKSPACE`, `MOD-SKETCH` | `ADR-0001`; review workflows |
| 28 | Canvas and sketch surfaces | `WP-CANVAS`, `WP-SKETCH` | `MOD-KNOWLEDGE-WORKSPACE`, `MOD-SKETCH` | `ADR-0001`; early thinking and annotation surfaces |
| 29 | Local AI provider foundation | `WP-AI-LOCAL-01` | `MOD-LOCAL-AI`, `MOD-SURFACES-UI` | `ADR-0011`; `R-LOCAL-AI-MVP` |
| 30 | Local AI commands | `WP-AI-LOCAL-COMMANDS` | `MOD-LOCAL-AI`, `MOD-SURFACES-UI` | `ADR-0011`; first user-facing AI actions |
| 31 | Local AI Markdown assistance | `WP-AI-MD-ASSIST` | `MOD-LOCAL-AI`, `MOD-MARKDOWN-ITM` | `ADR-0011`; Markdown review/extraction/patch proposals |
| 32 | Local AI ITM semantic review | `WP-AI-ITM-REVIEW` | `MOD-LOCAL-AI`, `MOD-ITM` | `ADR-0011`; depends on deterministic ITM validation/context work |
| 33 | Optional embeddings/vector search | `WP-AI-EMBED-01` | `MOD-LOCAL-AI`, `MOD-KNOWLEDGE-WORKSPACE`, `MOD-WORKSPACE-RESOURCES` | `ADR-0011`; explicitly optional/later |
| 34 | Optional backend foundation | `WP-ID-01`, `WP-ID-DEV`, `WP-POLICY-01`, `WP-PRIVATE-CONTRACT`, `WP-BE-HOST`, `WP-BE-API`, `WP-BE-PERSIST`, `WP-PRIVATE-SERVER` | `MOD-BACKEND-ENTERPRISE`, `MOD-SECURITY-DISTRIBUTION`, `MOD-WORKSPACE-RESOURCES` | `ADR-0001`; `R-BACKEND-PREVIEW` |
| 35 | Backend collaboration and AI mediation | `WP-GITLAB`, `WP-SERVICES-BE`, `WP-COLLAB-LEASES`, `WP-AI-MEDIATOR`, `WP-AI-CHAT`, `WP-AI-PREF`, `WP-SET-SYNC` | `MOD-BACKEND-ENTERPRISE`, `MOD-SURFACES-UI` | `ADR-0001`, `ADR-0011`; backend preview follow-on |
| 36 | Enterprise deployment and accreditation | `WP-SSO-ENTRA`, `WP-SSO-OIDC`, `WP-SSO-SAML`, `WP-SSO-KEYCLOAK`, `WP-DIST-PWA`, `WP-REPO-SHAREPOINT` | `MOD-SECURITY-DISTRIBUTION`, `MOD-ROADMAP-GOVERNANCE` | `ADR-0001`; `R-ENTERPRISE-PROFILE` |
