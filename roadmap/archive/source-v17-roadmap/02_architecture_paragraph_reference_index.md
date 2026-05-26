# Architecture Paragraph Reference Index

This index gives stable implementation anchors for `textforge_rebuild_whitepaper_main.md`. Roadmap phase notes and package guides use these IDs to point to exact architecture paragraphs or paragraph-like Markdown blocks that must be considered during implementation.

Anchor format: `ARCH-<section>-P<paragraph>`. A paragraph may be ordinary prose, a table, a list block, a code block, an unnumbered subsection heading, or a diagram block when that block carries implementation guidance. The line range identifies the exact source block in `roadmap/textforge_rebuild_whitepaper_main.md`. Reverse traceability notes inserted after source blocks are intentionally not assigned separate architecture anchors.

## Index

### §1 — 1. Executive summary

- `ARCH-1-P01` — line 12: TextForge should be rebuilt as a **React-based, local-first, text-first structured-text workbench**. Its central promise is that plain text remains the canonical source while di…
- `ARCH-1-P02` — line 17: The rebuild should not start as a generic web IDE. It should start as a deterministic local document workbench with four pillars:
- `ARCH-1-P03` — lines 22–26: 1. **A virtual workspace** backed by IndexedDB, with explicit manual upload/download as the only file boundary. 2. **A canonical ITM object model** used as the internal structur…
- `ARCH-1-P04` — line 31: The recommended rebuild should use React as the UI foundation and reuse proven libraries where they do not compromise the product model:
- `ARCH-1-P05` — lines 36–73: | Area | Selected component | |---|---| | UI runtime | React 19.x + TypeScript | | Workbench surface model | custom SurfaceRegistry, SurfaceSessionManager, and PlacementManager …
- `ARCH-1-P06` — line 78: The key custom components should be: virtual workspace model, ITM integration, pipeline runner, diagnostics model, source/view bridge, report generation orchestration, Lua sandb…
- `ARCH-1-P07` — line 83: ---

### §2 — 2. Product doctrine

- `ARCH-2-P01` — line 87: The rebuild should preserve the following invariants.
- `ARCH-2-P02` — lines 92–109: ```text 1. Text is canonical. 2. The workspace is virtual and local. 3. ITM is the canonical structural object model. 4. Viewers are projections, not source owners. 5. Pipelines…
- `ARCH-2-P03` — line 114: These invariants should be treated as architectural tests. A new feature that violates one of them should be rejected or redesigned.
- `ARCH-2-P04` — line 120: ---

### §3 — 3. System context

- `ARCH-3-P01` — line 124: TextForge is intended to run as:
- `ARCH-3-P02` — lines 129–131: 1. a local/static web app where feasible; 2. a packaged browser extension; 3. optionally, a PWA-like local web app if served from a controlled origin.
- `ARCH-3-P03` — line 136: All accredited local targets must preserve the same security claim:
- `ARCH-3-P04` — line 141: > TextForge cannot silently access or modify user-visible local files. Local files, including images and reference PDFs, enter through explicit user upload/import or ZIP import.…
- `ARCH-3-P05` — line 146: This is stronger than “offline-capable.” It is a deliberate accreditation posture.
- `ARCH-3-P06` — line 151: The security claim should be understood as a **browser-envelope claim**, not a proof of every internal implementation detail. The accreditation harness should verify that the br…
- `ARCH-3-P07` — line 156: TextForge-specific architectural discipline remains important, but it should not be confused with reusable accreditation. For example, TextForge should still use a `WorkspaceSto…

### §3.1 — Browser-envelope accreditation profile

- `ARCH-3.1-P01` — line 163: The default TextForge target should conform to a reusable profile similar to:
- `ARCH-3.1-P02` — lines 168–195: ```yaml profile: local-only-manual-file-workspace-webapp network: mode: none remoteCode: scripts: forbidden plugins: forbidden cdnRuntimeAssets: forbidden localFiles: silentRead…
- `ARCH-3.1-P03` — line 200: This profile is intentionally application-independent. It can apply to TextForge, another local Markdown tool, a PDF utility, a modelling workbench, or a browser-based document …

### §3.2 — What the accreditation harness should verify

- `ARCH-3.2-P01` — line 207: The reusable harness should check the deployment envelope:
- `ARCH-3.2-P02` — lines 212–219: - CSP for the static/PWA target; - extension manifest permissions for the extension target; - PWA manifest and service-worker pattern for the PWA target; - final built HTML and …
- `ARCH-3.2-P03` — line 224: The harness should not become a TextForge architecture verifier. It should not need to know the TextForge workspace model, ITM processor, viewer registry, Lua module layout, or …

### §3.3 — Internal architecture rules versus accreditation rules

- `ARCH-3.3-P01` — line 231: The distinction should be explicit:
- `ARCH-3.3-P02` — lines 236–244: | Concern | Belongs to | Example | |---|---|---| | Browser-enforced no-network posture | Accreditation harness | CSP `connect-src 'none'`, no external origins, no WebSocket to r…
- `ARCH-3.3-P03` — line 249: This keeps the accreditation harness reusable across applications and prevents it from becoming an overfitted static-analysis project.
- `ARCH-3.3-P04` — line 254: ---

### §4 — 4. Target architecture overview

- `ARCH-4-P01` — line 258: The Surface model changes the center of gravity of the runtime architecture. The application should not be built around the assumption that the main pane is always CodeMirror an…
- `ARCH-4-P02` — line 263: A **surface** is any interactive or read-only work area that can be hosted by the application shell. CodeMirror is one surface. A Markdown preview is another. An image viewer, P…
- `ARCH-4-P03` — line 268: Placement is separate from identity:
- `ARCH-4-P04` — lines 273–275: ```text Resource or pipeline output -> Surface contribution -> Surface session -> Placement ```
- `ARCH-4-P05` — line 280: Initial placements should be deliberately simple:
- `ARCH-4-P06` — lines 285–307: ```text Stage 1 target: one main surface area optional popup placement for any surface that supports it Phase 3.1 usability recovery: narrow main-session document tab strip clea…

### §4.1 — Runtime architecture

- `ARCH-4.1-P01` — lines 314–363: ```mermaid flowchart TD User[User] Shell[Application Shell] Workspace[Virtual Workspace Manager] Store[(IndexedDB via Dexie)] SurfaceRegistry[Surface Registry] SurfaceSessions[S…
- `ARCH-4.1-P02` — line 368: The accreditation harness is intentionally shown outside the runtime application. It verifies the packaging and browser security envelope. It is not an internal runtime service …

### §4.2 — Source, model, surface, and export

- `ARCH-4.2-P01` — line 375: The important separation is now between **source**, **model**, **surface**, **placement**, and **export**.
- `ARCH-4.2-P02` — lines 380–398: ```mermaid flowchart LR Source[Workspace resource or text source] Parse[Parsers / transformers] Model[Canonical model.itm / typed values] Project[Surface-specific projection] Su…
- `ARCH-4.2-P03` — line 403: This keeps the text/model source-of-truth doctrine intact while allowing rendered artifacts to become first-class work surfaces.

### §4.3 — Resource surfaces and derived surfaces

- `ARCH-4.3-P01` — line 410: Two surface classes should be distinguished.
- `ARCH-4.3-P02` — line 415: **Resource surfaces** open a workspace resource directly:
- `ARCH-4.3-P03` — lines 420–428: ```text .itm -> CodeMirror editor / ITM tree / ITM graph / ITM inspector .md -> CodeMirror editor / Markdown preview / report preview .svg -> SVG viewer / CodeMirror XML source …
- `ARCH-4.3-P04` — line 433: **Derived surfaces** are generated from a source resource or a pipeline:
- `ARCH-4.3-P05` — lines 438–447: ```text Markdown rendered HTML ITM dependency graph Mermaid rendered SVG Graphviz rendered SVG Report preview Diagnostics summary Generated PNG preview Generated SVG preview ```
- `ARCH-4.3-P06` — line 452: Derived surfaces must carry provenance: source resources, source versions, pipeline ID, generated asset ID if any, and stale/current state.
- `ARCH-4.3-P07` — line 457: ---

### §5 — 5. Selected reusable components and rationale


### §5.1 — React 19 and Vite as the UI foundation

- `ARCH-5.1-P01` — line 463: **Decision:** Use React 19.x with TypeScript and Vite.
- `ARCH-5.1-P02` — line 468: **Rationale:**
- `ARCH-5.1-P03` — lines 473–476: - compatibility and coding-agent support matter more than minimum bundle size; - React is the default target for most reusable UI components and examples; - React Arborist, Reac…
- `ARCH-5.1-P04` — line 481: **Non-goal:** Do not adopt server-first React patterns. TextForge should remain a static browser application. React Server Components, Next.js server routes, telemetry, hosted s…
- `ARCH-5.1-P05` — line 486: Recommended baseline:
- `ARCH-5.1-P06` — lines 491–499: ```text React 19.x TypeScript Vite React TypeScript template Vitest Playwright ESLint Prettier or equivalent formatting ```

### §5.2 — Surface workbench architecture

- `ARCH-5.2-P01` — line 507: **Decision:** Introduce a custom Surface abstraction rather than treating CodeMirror as the only main work area and viewers as popup-only components.
- `ARCH-5.2-P02` — line 512: **Rationale:**
- `ARCH-5.2-P03` — lines 517–520: - TextForge is a workbench over mixed resources, not only a text editor. - Read-only images, reference PDFs, rendered reports, ITM graphs, BPMN diagrams, and generated SVG/PNG p…
- `ARCH-5.2-P04` — line 525: Recommended initial target:
- `ARCH-5.2-P05` — lines 530–535: ```text Stage 1: one main surface + optional popup placement Phase 3.1 usability recovery: narrow main-session document tab strip and cleaner React shell Stage 2: advanced tabbe…
- `ARCH-5.2-P06` — line 540: Use custom TextForge types for `SurfaceContribution`, `SurfaceSession`, `SurfacePlacement`, and `SurfaceCapability`. Do not over-adopt a complete IDE layout framework early.

### §5.3 — Editable surfaces and controlled write-back

- `ARCH-5.3-P01` — line 547: **Decision:** Treat editors as Surface contributions with editing capabilities, not as a separate UI class that bypasses the workbench model.
- `ARCH-5.3-P02` — line 552: A surface may be read-only, source-editing, rich-text-editing, table-editing, diagram-editing, model-editing, annotation-editing, or hybrid. Placement remains independent: an ed…
- `ARCH-5.3-P03` — line 557: The critical rule is that every non-source editor must declare its write-back contract before it is accepted into TextForge. The contract must identify:
- `ARCH-5.3-P04` — lines 562–567: - the canonical resource format it edits; - the operations it supports; - constructs it cannot preserve; - how edits are represented as a patch or regenerated canonical source; …
- `ARCH-5.3-P05` — line 572: This protects the spirit of TextForge: visual convenience is allowed, but canonical text and explicit resources remain the authority.
- `ARCH-5.3-P06` — line 577: Recommended contribution shape:
- `ARCH-5.3-P07` — lines 582–615: ```ts export interface EditableSurfaceContribution<TInput = SurfaceInput> extends SurfaceContribution<TInput> { editKind: | "source" | "rich-markdown" | "table" | "diagram" | "m…
- `ARCH-5.3-P08` — line 620: The initial implementation should not attempt to deliver all rich and visual editors. It should make CodeMirror universal, add mature standalone editors where they are isolated …

### §5.4 — Editor library selection and maturity posture

- `ARCH-5.4-P01` — line 627: TextForge should prefer mature, open-source-compatible editor libraries that either preserve source directly or expose a controlled data model suitable for patch generation.
- `ARCH-5.4-P02` — lines 632–644: | Editing need | Selected approach | Maturity / licensing posture | Roadmap posture | |---|---|---|---| | Source editing for all text formats | CodeMirror 6 | Mature, MIT | Foun…
- `ARCH-5.4-P03` — line 649: Libraries that are not open-source-compatible, require commercial production keys, or impose non-commercial/source-available-only terms should not enter the default TextForge ba…

### §5.5 — Open-source dependency licensing gate

- `ARCH-5.5-P01` — line 656: TextForge should include a dependency policy from the beginning. The policy should be used for all editor, viewer, pipeline, and UI dependencies.
- `ARCH-5.5-P02` — line 661: Allowed by default:
- `ARCH-5.5-P03` — lines 666–672: ```text MIT BSD-2-Clause BSD-3-Clause Apache-2.0 ISC ```
- `ARCH-5.5-P04` — line 677: Allowed only with explicit review:
- `ARCH-5.5-P05` — lines 682–687: ```text MPL-2.0 LGPL custom attribution licenses, such as the bpmn.io license licenses with branding or notice requirements ```
- `ARCH-5.5-P06` — line 692: Rejected by default:
- `ARCH-5.5-P07` — lines 697–704: ```text commercial-only non-commercial-only production-license-key required source-available but non-OSI licenses that prevent normal open-source redistribution copyleft depende…
- `ARCH-5.5-P08` — line 709: Practical baseline decisions:
- `ARCH-5.5-P09` — lines 714–718: - use TanStack Table and possibly AG Grid Community instead of Handsontable; - use Excalidraw instead of tldraw for the open-source baseline; - use Milkdown before MDXEditor unl…

### §5.6 — CodeMirror 6 for editing

- `ARCH-5.6-P01` — line 725: **Decision:** Preserve CodeMirror 6.
- `ARCH-5.6-P02` — line 730: **Rationale:**
- `ARCH-5.6-P03` — lines 735–739: - modular extension model; - good fit for custom languages and DSLs; - supports linting, folding, decorations, diagnostics, and source ranges; - lighter and more composable than…
- `ARCH-5.6-P04` — line 744: **Do not use Monaco by default.** Monaco is excellent for a browser IDE, but TextForge is not primarily a clone of VS Code. It is a structured-text workbench with custom model a…

### §5.7 — React Arborist for workspace explorer

- `ARCH-5.7-P01` — line 751: **Decision:** Use React Arborist as the virtual workspace tree UI.
- `ARCH-5.7-P02` — line 756: **Rationale:**
- `ARCH-5.7-P03` — lines 761–765: - tree virtualization; - file-explorer-like UX; - drag/drop support; - rename/select/open patterns; - allows TextForge to own the underlying workspace model.
- `ARCH-5.7-P04` — line 770: React Arborist must be treated as a **view component only**. It must not own persistence, paths, language IDs, include resolution, document identity, or security decisions.
- `ARCH-5.7-P05` — line 775: Recommended adapter model:
- `ARCH-5.7-P06` — lines 780–790: ```ts export interface WorkspaceTreeNode { id: string; kind: "folder" | "file"; name: string; parentId: string | null; path: string; documentId?: string; children?: WorkspaceTre…

### §5.8 — Dexie.js for IndexedDB

- `ARCH-5.8-P01` — line 797: **Decision:** Use Dexie.js for persistence.
- `ARCH-5.8-P02` — line 802: **Rationale:**
- `ARCH-5.8-P03` — lines 807–809: - more maintainable than direct IndexedDB for multi-store workspace state; - supports versioned schemas and migrations; - useful for documents, folders, pipeline preferences, Lu…
- `ARCH-5.8-P04` — line 814: Minimum stores:
- `ARCH-5.8-P05` — lines 819–828: ```ts export interface TextForgeDbSchema { documents: PersistedDocument; workspaceNodes: PersistedWorkspaceNode; settings: PersistedSetting; pluginPreferences: PersistedPluginPr…

### §5.9 — fflate for zip import/export

- `ARCH-5.9-P01` — line 835: **Decision:** Use fflate.
- `ARCH-5.9-P02` — line 840: **Rationale:**
- `ARCH-5.9-P03` — lines 845–848: - small and fast; - browser-compatible; - supports folder/workspace import/export through explicit user action; - avoids requiring File System Access API.
- `ARCH-5.9-P04` — line 853: Required use cases:
- `ARCH-5.9-P05` — lines 858–863: - import zip into current folder; - import zip as new workspace; - export selected folder; - export workspace root; - preserve relative paths; - reject dangerous paths such as `…

### §5.10 — markdown-it plus unified/remark/rehype

- `ARCH-5.10-P01` — line 870: **Decision:** Use both, for different jobs.
- `ARCH-5.10-P02` — lines 875–878: ```text Interactive preview: markdown-it Report/document pipeline: unified + remark + rehype ```
- `ARCH-5.10-P03` — line 883: **Rationale:**
- `ARCH-5.10-P04` — lines 888–890: - markdown-it is fast and practical for preview; - unified/remark/rehype is better for AST-level document transformation; - ITM-in-Markdown report generation needs structural ex…

### §5.11 — Byte-stored assets, SVG text assets, and PDF viewing

- `ARCH-5.11-P01` — line 898: **Decision:** Treat asset resources as first-class workspace files, but distinguish stored representation from open-with capability.
- `ARCH-5.11-P02` — line 903: Required asset representation classes:
- `ARCH-5.11-P03` — lines 908–913: ```text Images: PNG, JPEG, GIF, WebP, AVIF as bytes; SVG as text Reference documents: PDF as byte-stored assets Generated diagram assets: SVG as text and PNG as bytes Future generated report assets: HTML and possibly PDF ```
- `ARCH-5.11-P04` — line 918: **Image resources** should use native browser image rendering through object URLs or blob URLs created from workspace content. Text-stored SVG may be bound to the visual viewer locally. Markdown image references should resolve through t…
- `ARCH-5.11-P05` — line 923: **PDF resources** should be viewable as read-only reference documents. Use PDF.js if consistent local rendering, page navigation, zoom, and text layer/search are needed. Browser…
- `ARCH-5.11-P06` — line 928: **Generated SVG and PNG assets** should be stored in the workspace as derived files. SVG is the preferred text-stored canonical generated diagram asset. PNG should be produced by local rast…
- `ARCH-5.11-P07` — line 933: **Markdown-to-PDF generation** should be treated as a late-stage capability. The first reliable path should be print-optimized HTML. Direct browser-local PDF generation from com…
- `ARCH-5.11-P08` — line 938: Rationale:
- `ARCH-5.11-P09` — lines 943–947: - Markdown projects need local image references. - ITM and diagram pipelines need a place to store generated SVG/PNG artifacts. - Reference PDFs are common workspace inputs even…

### §5.12 — Cytoscape.js, Sigma.js/Graphology, jsMind

- `ARCH-5.12-P01` — line 954: **Decision:** Preserve multiple model viewers.
- `ARCH-5.12-P02` — lines 959–964: ```text ITM -> Cytoscape.js rich interactive graph ITM -> Sigma/Graphology large graph exploration ITM -> jsMind mind map ITM -> Tree viewer hierarchy/source navigation ```
- `ARCH-5.12-P03` — line 969: **Rationale:**
- `ARCH-5.12-P04` — line 974: No single graph/mindmap library covers all use cases well. TextForge should allow the same ITM source to be projected into multiple derived views.

### §5.13 — bpmn-js and bpmn-moddle

- `ARCH-5.13-P01` — line 981: **Decision:** Use bpmn-js for BPMN rendering and future controlled editing.
- `ARCH-5.13-P02` — line 986: **Rationale:**
- `ARCH-5.13-P03` — lines 991–994: - BPMN XML is complex; - rebuilding BPMN visualization is wasteful; - bpmn-moddle provides BPMN XML parsing/serialization; - bpmn-js provides the rendering/modeling surface.
- `ARCH-5.13-P04` — line 999: TextForge must still preserve the source-of-truth rule:
- `ARCH-5.13-P05` — lines 1004–1006: ```text BPMN XML source -> bpmn-js viewer/modeler -> reviewed write-back patch -> XML source ```

### §5.14 — Enterprise architecture and ArchiMate support

- `ARCH-5.14-P01` — line 1013: **Decision:** Add enterprise architecture and ArchiMate as first-class model workflows, parallel to BPMN support.
- `ARCH-5.14-P02` — line 1018: **Rationale:**
- `ARCH-5.14-P03` — lines 1023–1026: - TextForge should support enterprise architecture repositories and views, not only generic graph rendering. - ArchiMate is a structured enterprise architecture language with co…
- `ARCH-5.14-P04` — line 1031: Required capabilities:
- `ARCH-5.14-P05` — lines 1036–1062: ```text ITM ArchiMate profile entity types, relationship types, constraints, viewpoints, styles ArchiMate exchange import ArchiMate exchange XML -> ITM model package ArchiMate e…
- `ARCH-5.14-P06` — line 1067: Recommended version strategy:
- `ARCH-5.14-P07` — lines 1072–1077: ```text Use profile packages, not hardcoded assumptions. Provide a current ArchiMate profile as the default. Allow additional compatibility profiles where enterprise tools still…
- `ARCH-5.14-P08` — line 1082: The important architectural principle is the same as for BPMN: external standards are supported through explicit profile and transformation layers, while TextForge keeps text an…

### §5.15 — Fengari for Lua

- `ARCH-5.15-P01` — line 1089: **Decision:** Use Fengari as Lua VM only.
- `ARCH-5.15-P02` — line 1094: **Rationale:**
- `ARCH-5.15-P03` — lines 1099–1101: - browser-compatible Lua execution; - good basis for the Lua pivot; - allows user-defined transformations without user-provided JavaScript.
- `ARCH-5.15-P04` — line 1106: TextForge must own the sandbox policy, worker isolation, module whitelist, limits, bridge API, and diagnostics.
- `ARCH-5.15-P05` — line 1111: ---

### §6 — 6. Core modules


### §6.1 — Application shell

- `ARCH-6.1-P01` — line 1117: Responsibilities:
- `ARCH-6.1-P02` — lines 1122–1126: - initialize services; - host layout; - host top-level menus/actions; - coordinate editor, workspace, popups, diagnostics, plugins, and resource browser; - remain thin.
- `ARCH-6.1-P03` — line 1131: Suggested folder:
- `ARCH-6.1-P04` — lines 1136–1146: ```text src/app/ App.tsx AppShell.tsx useAppServices.ts useWorkspacePersistence.ts usePipelineActions.ts usePopupManager.ts useSourceSelectionBridge.ts useAttentionState.ts ```
- `ARCH-6.1-P05` — line 1151: The rebuild should explicitly prevent `App.tsx` becoming the central orchestration module.

### §6.2 — Workspace manager

- `ARCH-6.2-P01` — line 1158: Responsibilities:
- `ARCH-6.2-P02` — lines 1163–1171: - own documents; - own folders; - own virtual paths; - own tabs; - own current document; - track dirty/current/stale state; - increment document version on all content, filename…
- `ARCH-6.2-P03` — line 1176: Interfaces:
- `ARCH-6.2-P04` — lines 1181–1217: ```ts export interface TextDocument { id: string; fileName: string; languageId: string; text: string; version: number; dirty: boolean; identity: DocumentIdentity; folderPath?: s…

### §6.3 — Virtual file system

- `ARCH-6.3-P01` — line 1224: The virtual file system is not a filesystem API wrapper. It is an application model.
- `ARCH-6.3-P02` — line 1229: Responsibilities:
- `ARCH-6.3-P03` — lines 1234–1240: - normalize workspace paths; - prevent path traversal; - support folder import/export; - support folder rename/move/delete; - maintain stable document IDs independent of display…
- `ARCH-6.3-P04` — line 1245: Forbidden:
- `ARCH-6.3-P05` — lines 1250–1254: - File System Access API; - directory handles; - automatic sync to local folders; - silent file writes; - network repository resolution unless explicitly introduced in a separat…

### §6.4 — Storage service

- `ARCH-6.4-P01` — line 1261: Responsibilities:
- `ARCH-6.4-P02` — lines 1266–1271: - Dexie schema definition; - migrations; - workspace load/save; - localStorage fallback only for emergency/minimal state; - backup/export state; - uniqueness repair for document…
- `ARCH-6.4-P03` — line 1276: Suggested Dexie schema:
- `ARCH-6.4-P04` — lines 1281–1290: ```ts class TextForgeDb extends Dexie { documents!: Table<PersistedDocument, string>; workspaceNodes!: Table<PersistedWorkspaceNode, string>; settings!: Table<PersistedSetting, …

### §6.5 — Asset resource and object URL service

- `ARCH-6.5-P01` — line 1298: TextForge should support workspace files whose stored representation is text or bytes. These files are still part of the virtual workspace and can participate in Markdown, reports, gene…
- `ARCH-6.5-P02` — line 1303: Responsibilities:
- `ARCH-6.5-P03` — lines 1308–1316: - store text or byte content through the workspace storage layer; - classify opaque byte assets by media type and extension; - create scoped object URLs/blob URLs for viewers; - revoke …
- `ARCH-6.5-P04` — line 1321: Suggested interfaces:
- `ARCH-6.5-P05` — lines 1326–1359: ```ts export type WorkspaceContentRepresentation = "text" | "bytes"; export interface WorkspaceResource { id: string; path: string; content: { representation: WorkspaceContentRepresentation }; mediaType…
- `ARCH-6.5-P06` — line 1364: Important distinction:
- `ARCH-6.5-P07` — lines 1369–1373: ```text Editable source text: text representation opened in CodeMirror and changed by the user. Opaque byte asset: byte representation previewed, referenced, exported, or used by pipelines…
- `ARCH-6.5-P08` — line 1378: This distinction should be visible in the UI and in diagnostics without becoming a fixed text/binary resource taxonomy.

### §6.6 — Language registry

- `ARCH-6.6-P01` — line 1385: Responsibilities:
- `ARCH-6.6-P02` — lines 1390–1394: - identify language from filename/content/user choice; - expose CodeMirror language extensions; - expose lint providers; - expose available pipelines; - maintain language hierar…
- `ARCH-6.6-P03` — line 1399: Language IDs should include at least:
- `ARCH-6.6-P04` — lines 1404–1420: ```text text markdown itm lua json xml bpmn-xml csv tsv mermaid graphviz-dot svg html javascript python ```
- `ARCH-6.6-P05` — line 1426: Resource classifications should include non-text files:
- `ARCH-6.6-P06` — lines 1431–1438: ```text image.png / image.jpeg / image.webp / image.gif -> resource.image image.svg -> resource.svg, with optional source-text view .pdf -> resource.pdf unknown binary -> resour…
- `ARCH-6.6-P07` — line 1443: Binary resources should normally open in viewers, not in CodeMirror. SVG may have both a rendered viewer and a source-text editor mode because SVG is XML text.

### §6.7 — Plugin and contribution registry

- `ARCH-6.7-P01` — line 1450: Internal TypeScript contributions should remain trusted and packaged.
- `ARCH-6.7-P02` — line 1455: Contribution kinds:
- `ARCH-6.7-P03` — lines 1460–1472: ```ts export type ContributionKind = | "language" | "editorExtension" | "linter" | "parser" | "transformer" | "viewer" | "exporter" | "pipeline" | "diagnosticsProvider" | "luaBr…
- `ARCH-6.7-P04` — line 1477: Pipeline conflicts must be errors, not override points.
- `ARCH-6.7-P05` — lines 1482–1494: ```ts export interface RegisteredPipeline { pipeline: PipelineContribution; pluginId: string; enabled: boolean; disabledReason?: "user" | "conflict"; conflictWith?: Array<{ plug…
- `ARCH-6.7-P06` — line 1499: Registry API:
- `ARCH-6.7-P07` — lines 1504–1514: ```ts export interface PluginRegistry { registerManifest(manifest: PluginManifest): PluginRegistrationResult; loadPlugin(pluginId: string): Promise<void>; listPipelinesForLangua…

### §6.8 — Pipeline runner

- `ARCH-6.8-P01` — line 1521: Responsibilities:
- `ARCH-6.8-P02` — lines 1526–1532: - execute ordered steps; - connect contributions by ID; - collect trace; - collect diagnostics; - expose intermediate values; - allow intermediate results to open as editable do…
- `ARCH-6.8-P03` — line 1537: Pipeline value model:
- `ARCH-6.8-P04` — lines 1542–1566: ```ts export type PipelineValueKind = | "text" | "html" | "svg" | "json" | "table" | "itm-document" | "graph-projection" | "tree-projection" | "bpmn-xml" | "diagnostics" | "view…
- `ARCH-6.8-P05` — line 1571: Trace model:
- `ARCH-6.8-P06` — lines 1576–1587: ```ts export interface PipelineTraceStep { stepId: string; contributionId: string; inputKind: PipelineValueKind; outputKind: PipelineValueKind; startedAt: string; finishedAt: st…

### §6.9 — ITM integration module

- `ARCH-6.9-P01` — line 1594: The ITM module is one of the highest-risk and highest-value parts.
- `ARCH-6.9-P02` — line 1599: Responsibilities:
- `ARCH-6.9-P03` — lines 1604–1610: - call `@textforge/itm` for parsing/resolution; - provide TextForge workspace resolver functions; - map ITM diagnostics into TextForge diagnostics; - expose ITM document value t…
- `ARCH-6.9-P04` — line 1615: TextForge-side include resolver:
- `ARCH-6.9-P05` — lines 1620–1638: ```ts export function createWorkspaceItmResolver(workspace: WorkspaceManager): ItmIncludeResolver { return { async resolveInclude(request) { const doc = workspace.resolveVirtual…
- `ARCH-6.9-P06` — line 1643: ITM processing sequence:
- `ARCH-6.9-P07` — lines 1648–1666: ```mermaid flowchart TD Raw[Raw ITM text] Directives[Parse directives] Includes[Resolve includes] Namespaces[Resolve namespaces] Packages[Resolve packages/usings] Entities[Parse…

### §6.10 — Enterprise architecture and ArchiMate module

- `ARCH-6.10-P01` — line 1673: Enterprise architecture support should be implemented as a profile-driven model package on top of ITM. It should not be a single monolithic viewer.
- `ARCH-6.10-P02` — line 1678: Responsibilities:
- `ARCH-6.10-P03` — lines 1683–1691: - provide one or more ArchiMate ITM profile packages; - define ArchiMate element types, relationship types, layers, aspects, and viewpoints; - validate ArchiMate relationship co…
- `ARCH-6.10-P04` — line 1696: Suggested files:
- `ARCH-6.10-P05` — lines 1701–1714: ```text src/ea/ archimateProfile.ts archimateTypes.ts archimateRelationshipRules.ts archimateViewpoints.ts archimateStyles.ts archimateExchangeImport.ts archimateExchangeExport.…
- `ARCH-6.10-P06` — line 1719: Suggested profile/resource files:
- `ARCH-6.10-P07` — lines 1724–1732: ```text resources/profiles/archimate/ archimate-profile.itm archimate-relationships.itm archimate-viewpoints.itm archimate-styles.itm archimate-validation-rules.itm archimate-re…
- `ARCH-6.10-P08` — line 1737: The import pipeline should be explicit:
- `ARCH-6.10-P09` — lines 1742–1749: ```text ArchiMate exchange XML -> parse XML -> validate exchange structure -> map elements/relationships/views to ITM -> preserve source IDs and documentation -> emit ITM model …
- `ARCH-6.10-P10` — line 1754: The export pipeline should also be explicit:
- `ARCH-6.10-P11` — lines 1759–1764: ```text ITM ArchiMate model package -> validate ArchiMate profile conformance -> map ITM elements/relationships/views to exchange XML -> emit exchange XML + diagnostics ```
- `ARCH-6.10-P12` — line 1769: Export should be conservative. If TextForge has ITM content that cannot be faithfully represented in the selected ArchiMate exchange profile, it should preserve the ITM source a…
- `ARCH-6.10-P13` — line 1774: Recommended ITM authoring pattern:
- `ARCH-6.10-P14` — lines 1779–1791: ```itm %using archimate_profile &customer [archimate::BusinessActor] Customer &online_sales [archimate::BusinessProcess] Online Sales &crm [archimate::ApplicationComponent] CRM …
- `ARCH-6.10-P15` — line 1796: The exact relationship names should be defined by the ArchiMate profile package rather than scattered across application code.
- `ARCH-6.10-P16` — line 1801: Enterprise architecture outputs should include:
- `ARCH-6.10-P17` — lines 1806–1816: ```text Capability maps Application landscapes Business/application/technology layer views Motivation-to-implementation traceability Application dependency graphs Interface and …
- `ARCH-6.10-P18` — line 1821: These outputs can be rendered as surfaces, exported as SVG/PNG/HTML/CSV where appropriate, and embedded into Markdown reports.

### §6.11 — Surface registry

- `ARCH-6.11-P01` — line 1828: The Surface registry replaces the older viewer-only registry concept. It registers any UI contribution that can occupy a workbench surface: editors, viewers, inspectors, console…
- `ARCH-6.11-P02` — line 1833: Responsibilities:
- `ARCH-6.11-P03` — lines 1838–1843: - register surface contributions; - choose compatible surfaces for workspace resources and pipeline outputs; - expose common surface capabilities; - avoid central `viewers.tsx` …
- `ARCH-6.11-P04` — line 1848: Core interface:
- `ARCH-6.11-P05` — lines 1853–1902: ```ts export type SurfaceKind = | "editor" | "viewer" | "inspector" | "console" | "diagnostics" | "report"; export type SurfaceCapability = | "edit-text" | "edit-rich-text" | "e…
- `ARCH-6.11-P06` — line 1907: The registry should support a command such as:
- `ARCH-6.11-P07` — lines 1912–1921: ```text Open With... CodeMirror Text Editor Markdown Preview ITM Graph ITM Inspector Image Viewer PDF Viewer SVG Viewer ```

### §6.12 — Editor registry as part of the Surface registry

- `ARCH-6.12-P01` — line 1928: Do not create a separate editor subsystem that bypasses Surface lifecycle, placement, provenance, or diagnostics. Instead, define editor contributions as a specialized subset of…
- `ARCH-6.12-P02` — line 1933: Editor contributions should be grouped by risk and maturity:
- `ARCH-6.12-P03` — lines 1938–1945: | Editor class | Examples | Default posture | |---|---|---| | Source editors | ITM, Markdown, Lua, XML, JSON, Mermaid, DOT, SVG, CSV text | early, default, low risk | | Standalo…
- `ARCH-6.12-P04` — line 1950: A controlled editor must never silently replace the canonical source. The accepted pattern is:
- `ARCH-6.12-P05` — lines 1955–1963: ```text Open canonical resource -> create editor session -> edit temporary/editor-native state -> preview patch or regenerated canonical source -> user applies or discards -> wo…
- `ARCH-6.12-P06` — line 1968: For pure source editors, CodeMirror edits the canonical text directly because the canonical source is already visible and editable. For rich/visual/structured editors, the patch…

### §6.13 — Surface session manager

- `ARCH-6.13-P01` — line 1976: The Surface Session Manager tracks open surface instances independently from their placement.
- `ARCH-6.13-P02` — line 1981: Responsibilities:
- `ARCH-6.13-P03` — lines 1986–1991: - open surfaces for resources or pipeline results; - track title, dirty state, stale state, source binding, and provenance; - keep editor/viewer state separate from workspace fi…
- `ARCH-6.13-P04` — line 1996: Suggested model:
- `ARCH-6.13-P05` — lines 2001–2028: ```ts export type SurfaceInput = | { kind: "workspace-resource"; resourceId: string; preferredSurfaceId?: string } | { kind: "pipeline-result"; resultId: string; preferredSurfac…
- `ARCH-6.13-P06` — line 2033: A derived surface should become stale when any source resource version changes. A generated resource surface should also show the generated artifact path and source pipeline.

### §6.14 — Placement manager and hosts

- `ARCH-6.14-P01` — line 2040: The Placement Manager decides where a surface appears. This is intentionally separate from the surface contribution itself.
- `ARCH-6.14-P02` — line 2045: Stage 1 placements:
- `ARCH-6.14-P03` — lines 2050–2054: ```ts export type SurfacePlacement = | { kind: "main" } | { kind: "popup"; popupId: string }; ```
- `ARCH-6.14-P04` — line 2059: Stage 2 later adds:
- `ARCH-6.14-P05` — lines 2064–2069: ```ts export type SurfacePlacement = | { kind: "main" } | { kind: "popup"; popupId: string } | { kind: "tab"; groupId: string; tabId: string }; ```
- `ARCH-6.14-P06` — line 2074: Future expansions may add splits and detached windows, but those should not be part of the first implementation target.
- `ARCH-6.14-P07` — line 2079: Shared chrome requirements:
- `ARCH-6.14-P08` — lines 2084–2096: ```text title resource path or source binding stale/current badge dirty marker where relevant refresh open source / reveal source open with... move to main open as popup export/…
- `ARCH-6.14-P09` — line 2101: Hosts:
- `ARCH-6.14-P10` — lines 2106–2111: ```text MainSurfaceHost primary work area, initially one active surface PopupSurfaceHost floating viewer/editor/inspector windows Future TabHost tabbed main surface group Future…
- `ARCH-6.14-P11` — line 2116: The existing popup concept becomes one placement option. Popups should remain useful for quick previews, generated diagrams, and secondary references, but they should no longer …

### §6.15 — Initial built-in surface contributions

- `ARCH-6.15-P01` — line 2123: The initial surface list should include both editors and viewers.
- `ARCH-6.15-P02` — lines 2128–2151: ```text CodeMirrorTextEditorSurface editable text resources MarkdownPreviewSurface rendered Markdown preview ReportPreviewSurface Markdown + ITM report preview SourceViewerSurfa…
- `ARCH-6.15-P03` — line 2156: Required read-only resource behavior:
- `ARCH-6.15-P04` — lines 2161–2167: ```text Image resources open read-only with zoom, fit, copy path, export/download, and reveal in workspace. SVG resources open rendered, with optional source mode and export/sto…

### §6.16 — Source/view bridge

- `ARCH-6.16-P01` — line 2174: Responsibilities:
- `ARCH-6.16-P02` — lines 2179–2185: - map source ranges to model elements; - map model elements to visual nodes/edges; - support visual click to source; - support editor cursor to viewer selection; - support sourc…
- `ARCH-6.16-P03` — line 2190: Core types:
- `ARCH-6.16-P04` — lines 2195–2221: ```ts export interface SourceRange { documentId: string; version: number; from: number; to: number; line?: number; column?: number; } export interface ModelElementRef { modelKin…

### §6.17 — Diagnostics service

- `ARCH-6.17-P01` — line 2228: Diagnostics should be universal.
- `ARCH-6.17-P02` — lines 2233–2252: ```ts export type DiagnosticSeverity = "error" | "warning" | "information" | "observation"; export interface Diagnostic { id: string; source: string; severity: DiagnosticSeverit…
- `ARCH-6.17-P03` — line 2257: Sources:
- `ARCH-6.17-P04` — lines 2262–2271: - parser; - ITM resolver; - Markdown/report engine; - Lua runtime; - pipeline runner; - plugin registry; - viewer renderer; - exporter; - security checker; - workspace importer.

### §6.18 — Markdown preview and report engine

- `ARCH-6.18-P01` — line 2278: Two paths should coexist.
- `ARCH-6.18-P02` — line 2283: #### Preview path
- `ARCH-6.18-P03` — lines 2288–2290: ```text Markdown source -> markdown-it -> HTML viewer ```
- `ARCH-6.18-P04` — line 2295: Supports:
- `ARCH-6.18-P05` — lines 2300–2305: - syntax highlighting; - Mermaid fences; - Graphviz/DOT fences; - KaTeX; - SVG popout/export; - source-aware embedded blocks.
- `ARCH-6.18-P06` — line 2310: #### Report path
- `ARCH-6.18-P07` — lines 2315–2323: ```text Markdown source -> remark AST -> extract ITM blocks -> resolve/import model cells -> run ITM viewpoints -> generate sections/tables/diagrams/annexes -> rehype/HTML or Ma…
- `ARCH-6.18-P08` — line 2328: This report path is central to the “ITM becomes the source for report generation through embedding into Markdown” concept. The same path should support enterprise architecture p…
- `ARCH-6.18-P09` — line 2333: Recommended embedded block patterns:
- `ARCH-6.18-P10` — lines 2338–2339: ````markdown ```itm name=core-model
- `ARCH-6.18-P11` — lines 2340–2350: &capability [Capability] Deployable C2 &function [Function] Plan operation ``` ```itm-pub view=capability-map import=core-model %view capability_map { viewpoint: dependency_grap…
- `ARCH-6.18-P12` — line 2355: Key rules:
- `ARCH-6.18-P13` — lines 2360–2364: - Markdown is the narrative envelope; - ITM blocks are semantic model sources; - rendered diagrams/tables are derived; - duplicate named model blocks should be rejected unless t…
- `ARCH-6.18-P14` — line 2370: #### Local image and asset resolution
- `ARCH-6.18-P15` — line 2375: Markdown rendering must resolve relative image paths through the virtual workspace.
- `ARCH-6.18-P16` — line 2380: Example:
- `ARCH-6.18-P17` — lines 2385–2388: ```markdown ![Context diagram](assets/context-diagram.svg) ![Screenshot](../images/screenshot.png) ```
- `ARCH-6.18-P18` — line 2393: Resolution rule:
- `ARCH-6.18-P19` — lines 2398–2400: ```text Markdown file path + relative href -> WorkspaceReferenceResolver -> AssetService -> scoped object URL -> rendered HTML ```
- `ARCH-6.18-P20` — line 2405: Requirements:
- `ARCH-6.18-P21` — lines 2410–2415: - resolve relative image references from the Markdown file location; - support workspace images imported manually or via ZIP; - support generated SVG/PNG assets stored in worksp…
- `ARCH-6.18-P22` — line 2420: #### Diagram asset generation
- `ARCH-6.18-P23` — line 2425: Generated diagrams should be saveable into the workspace.
- `ARCH-6.18-P24` — line 2430: Examples:
- `ARCH-6.18-P25` — lines 2435–2440: ```text Markdown Mermaid block -> generated/diagram-001.svg Markdown Graphviz block -> generated/dependency-view.svg ITM viewpoint -> generated/capability-map.svg Generated SVG …
- `ARCH-6.18-P26` — line 2445: SVG export should preserve the generated vector output. PNG export should rasterize locally, normally by loading the SVG into an image/canvas pipeline and writing the resulting …
- `ARCH-6.18-P27` — line 2450: #### Late-stage Markdown-to-PDF generation
- `ARCH-6.18-P28` — line 2455: PDF generation from rendered Markdown HTML should be a late capability. It should not block Markdown preview, image embedding, report generation, or SVG/PNG asset export.
- `ARCH-6.18-P29` — line 2460: Recommended staged approach:
- `ARCH-6.18-P30` — lines 2465–2469: 1. produce print-optimized HTML and CSS; 2. support browser print/save-as-PDF as a user-mediated output path; 3. evaluate client-side PDF generation only after report HTML is st…

### §6.19 — Lua runtime service

- `ARCH-6.19-P01` — line 2476: Responsibilities:
- `ARCH-6.19-P02` — lines 2481–2487: - run Lua snippets/documents/selections; - discover named Lua actions; - expose safe `tf.*` modules; - run in Worker where possible; - enforce limits; - return structured diagno…
- `ARCH-6.19-P03` — line 2492: Suggested files:
- `ARCH-6.19-P04` — lines 2497–2514: ```text src/lua/ luaRuntime.ts luaBridge.ts luaWorker.ts luaModules.ts luaTransformService.ts luaScriptRegistry.ts luaActionRegistry.ts luaConsoleService.ts libs/ tf.lua tf_tree…
- `ARCH-6.19-P05` — line 2519: Lua safety rules:
- `ARCH-6.19-P06` — lines 2524–2535: ```text No DOM. No browser globals. No fetch/XMLHttpRequest/WebSocket. No localStorage/indexedDB access from Lua. No io/os/debug libraries. No unrestricted package searchers. No…

### §6.20 — Reusable accreditation harness

- `ARCH-6.20-P01` — line 2542: The security accreditation harness should be a **reusable browser-envelope checker**, not a TextForge-specific architectural static analyzer.
- `ARCH-6.20-P02` — line 2547: Purpose:
- `ARCH-6.20-P03` — lines 2552–2555: - verify that the delivered app remains inside the approved secure local-first deployment profile; - check the safeguards that the browser or extension platform enforces; - prod…
- `ARCH-6.20-P04` — line 2560: The harness should check:
- `ARCH-6.20-P05` — lines 2565–2599: ```text Deployment envelope: CSP for static/PWA targets extension manifest permissions PWA manifest service-worker pattern final HTML entry points final JavaScript bundles final…
- `ARCH-6.20-P06` — line 2604: The harness should **not** check:
- `ARCH-6.20-P07` — lines 2609–2616: ```text Whether only WorkspaceStorageGateway touches IndexedDB. Whether only FileGateway uses ordinary user-mediated file input. Whether every TextForge module follows ideal lay…
- `ARCH-6.20-P08` — line 2621: Those are important engineering and test concerns, but they are not the reusable accreditation boundary. IndexedDB is an allowed browser storage mechanism for the application-pr…
- `ARCH-6.20-P09` — line 2626: Suggested files:
- `ARCH-6.20-P10` — lines 2631–2650: ```text tools/accreditation/ profile.schema.json profiles/ local-only-manual-file-workspace-webapp.yml one-backend-manual-file-workspace-webapp.yml check.ts checks/ checkCsp.ts …
- `ARCH-6.20-P11` — line 2655: Recommended npm scripts:
- `ARCH-6.20-P12` — lines 2660–2667: ```json { "scripts": { "verify:envelope": "tsx tools/accreditation/check.ts --profile security/security-profile.yml --target dist", "verify:release": "npm run test && npm run bu…
- `ARCH-6.20-P13` — line 2672: The harness may include lightweight source checks as a convenience, but its authoritative role should be artifact and deployment-envelope verification. A release should be asses…

### §6.21 — Resource browser

- `ARCH-6.21-P01` — line 2679: Responsibilities:
- `ARCH-6.21-P02` — lines 2684–2689: - expose bundled docs/examples; - preview resources; - open resources as editable copies; - copy resource text; - render Markdown resources directly; - include manual test plans…
- `ARCH-6.21-P03` — line 2694: Resource groups:
- `ARCH-6.21-P04` — lines 2699–2716: ```text README User manual Security whitepapers ITM specification Lua scripting tutorial Lua console tutorial Markdown examples Mermaid examples Graphviz examples ITM examples B…

### §6.22 — Export/import subsystem

- `ARCH-6.22-P01` — line 2723: Responsibilities:
- `ARCH-6.22-P02` — lines 2728–2742: - explicit user-triggered import; - explicit user-triggered export; - zip import/export; - SVG export; - PNG export from SVG; - generated SVG/PNG asset storage into workspace; -…
- `ARCH-6.22-P03` — line 2747: Security rules:
- `ARCH-6.22-P04` — lines 2752–2756: - never export automatically; - never overwrite local files silently; - never sync to a local folder; - never preserve absolute host paths in zip exports; - sanitize zip paths o…
- `ARCH-6.22-P05` — line 2761: ---

### §7 — 7. UI requirements

- `ARCH-7-P01` — line 2765: The UI should be a **React workbench of surfaces**, not an editor with popup-only viewers. Components should be selected for good TypeScript types, documented examples, accessib…
- `ARCH-7-P02` — line 2770: Recommended React UI support stack:
- `ARCH-7-P03` — lines 2775–2785: ```text React Arborist workspace tree MainSurfaceHost custom primary surface container PopupSurfaceHost custom floating surface container Floating UI / Radix menus, popovers, di…

### §7.1 — Security-visible workspace boundary

- `ARCH-7.1-P01` — line 2792: The UI should make the workspace boundary understandable without turning security into noise. TextForge should say, in user-facing wording, that workspace files are stored insid…
- `ARCH-7.1-P02` — line 2797: Required UI cues:
- `ARCH-7.1-P03` — lines 2802–2807: - workspace root clearly labelled as an application workspace, not a live local folder; - import actions labelled as manual import/open/ZIP import; - export actions labelled as …
- `ARCH-7.1-P04` — line 2812: This is a product requirement, not an accreditation-harness static-analysis requirement.

### §7.2 — Stage 1 main layout

- `ARCH-7.2-P01` — line 2819: Stage 1 should be the first implementation target. It should support one main surface and optional popup surfaces. The main surface may be CodeMirror, a viewer, a diagnostics su…
- `ARCH-7.2-P02` — lines 2824–2835: ```text +--------------------------------------------------------------------------------+ | Top bar: New | Open | Import Zip | Export | Actions | Surface | Diagnostics | +-----…
- `ARCH-7.2-P03` — line 2840: Important Stage 1 rules:
- `ARCH-7.2-P04` — lines 2845–2851: ```text Double-clicking a text file may open CodeMirror in the main surface. Double-clicking an image/PDF/SVG may open the matching read-only viewer in the main surface. Pipelin…

### §7.3 — Stage 2 target: advanced tabbed main surfaces

- `ARCH-7.3-P01` — line 2858: Stage 2 is the target advanced workbench model, but it should be implemented later in the roadmap after the basic surface abstraction is stable. The roadmap may introduce a narr…
- `ARCH-7.3-P02` — line 2863: Stage 2 adds a tabbed main surface group where editors and viewers are peers:
- `ARCH-7.3-P03` — lines 2868–2878: ```text +--------------------------------------------------------------------------------+ | Top bar | +----------------------+--------------------------------------------------…
- `ARCH-7.3-P04` — line 2883: Tab requirements:
- `ARCH-7.3-P05` — lines 2888–2896: - surface icon or type marker; - resource/file name or derived view title; - dirty marker for editable resources; - stale marker for derived surfaces; - close button; - optional…
- `ARCH-7.3-P06` — line 2901: Stage 2 should not introduce full split-pane complexity yet. It should simply allow multiple surfaces in the main area.

### §7.4 — Future layout expansions

- `ARCH-7.4-P01` — line 2908: After Stage 2, the following can be considered:
- `ARCH-7.4-P02` — lines 2913–2917: ```text Stage 3: split panes, open to side, bottom diagnostics/console panel Stage 4: saved layouts and workspace layout restoration Stage 5: detached browser windows or multi-m…
- `ARCH-7.4-P03` — line 2922: These are intentionally future expansions. The rebuild should design the Surface interfaces so they are possible, but should not require them for the first rebuild.

### §7.5 — Workspace explorer UI

- `ARCH-7.5-P01` — line 2929: Use React Arborist for:
- `ARCH-7.5-P02` — lines 2934–2944: - folders/files; - expand/collapse; - rename; - drag/drop move; - context menu; - multi-select if needed; - open on click/double click; - dirty indicators; - generated/stale ind…
- `ARCH-7.5-P03` — line 2949: Required context menu actions:
- `ARCH-7.5-P04` — lines 2954–2969: ```text New File New Folder Rename Duplicate Move Delete Import Files Import Zip Here Export Folder as Zip Download File Open With... Open in Main Surface Open as Popup Copy Pat…

### §7.6 — Asset resource UI

- `ARCH-7.6-P01` — line 2976: The workspace explorer should show available resource actions distinctly without reducing files to a text/binary taxonomy.
- `ARCH-7.6-P02` — line 2981: Required UI behavior:
- `ARCH-7.6-P03` — lines 2986–2993: ```text Image file double-click -> open ImageViewerSurface, preferably in main surface SVG double-click -> offer SvgViewerSurface and source editor PDF double-click -> o…
- `ARCH-7.6-P04` — line 2998: Surface toolbar requirements:
- `ARCH-7.6-P05` — lines 3003–3008: ```text Images/SVGs: zoom, fit, copy path, export/download, reveal in workspace SVGs: export as SVG, rasterize/store as PNG PDFs: page navigation, zoom, search if supported, dow…
- `ARCH-7.6-P06` — line 3013: The UI should avoid suggesting that PDFs and raster images are editable source files. SVG is an exception: it is source text that may also be previewed visually.

### §7.7 — Surface chrome

- `ARCH-7.7-P01` — line 3020: All surfaces should share a common outer chrome where practical.
- `ARCH-7.7-P02` — line 3025: Common controls:
- `ARCH-7.7-P03` — lines 3030–3044: ```text Title / resource path / view title Surface type Dirty marker Stale/current marker Refresh, if derived Open source / reveal in workspace Open With... Move to main Open as…
- `ARCH-7.7-P04` — line 3049: The chrome should adapt to capability flags. For example, a PDF surface shows page/zoom controls, while a CodeMirror surface shows editor actions and a generated report surface …

### §7.8 — Diagnostics UI

- `ARCH-7.8-P01` — line 3056: Diagnostics should be available both as a popup and as a main surface.
- `ARCH-7.8-P02` — line 3061: Diagnostics button should indicate attention when any of these exist:
- `ARCH-7.8-P03` — lines 3066–3071: - document diagnostics; - plugin conflicts; - security verification failures; - pipeline failures; - Lua runtime errors; - workspace import warnings.
- `ARCH-7.8-P04` — line 3076: Diagnostics view should support grouping by:
- `ARCH-7.8-P05` — lines 3081–3088: ```text Document Severity Source Pipeline Plugin Security check ```

### §7.9 — Plugin manager UI

- `ARCH-7.9-P01` — line 3095: The plugin manager can initially be a popup or dialog, but should later be usable as a main surface if it grows.
- `ARCH-7.9-P02` — line 3100: Must show:
- `ARCH-7.9-P03` — lines 3105–3113: - packaged plugins; - loaded/failed status; - contribution list; - surface contributions; - pipelines; - enabled/disabled pipeline state; - conflicts; - user override selection;…
- `ARCH-7.9-P04` — line 3118: Pipeline conflicts must be visible and resolvable by the user.

### §7.10 — Lua console UI

- `ARCH-7.10-P01` — line 3125: The Lua console should be a surface, not a special case. It can open in the main area or popup.
- `ARCH-7.10-P02` — line 3130: Can use xterm.js if a terminal-like interaction is desired.
- `ARCH-7.10-P03` — line 3135: Required actions:
- `ARCH-7.10-P04` — lines 3140–3146: - run current Lua document; - run selection; - run snippet; - list actions; - inspect last result; - open last result as document or surface; - show diagnostics.
- `ARCH-7.10-P05` — line 3151: ---

### §8 — 8. Relationships between modules

- `ARCH-8-P01` — lines 3155–3193: ```mermaid flowchart TD AppShell --> WorkspaceManager AppShell --> PluginRegistry AppShell --> PipelineRunner AppShell --> PopupManager AppShell --> DiagnosticsService AppShell …
- `ARCH-8-P02` — line 3198: ---

### §9 — 9. Repository pivot and preservation strategy

- `ARCH-9-P01` — line 3203: TextForge should keep its existing repository name and Git history while moving to the modular rebuild. The pivot should be explicit, reversible, and easy for coding agents to u…
- `ARCH-9-P02` — line 3208: The recommended approach is:
- `ARCH-9-P03` — lines 3213–3221: ```text 1. Preserve the current implementation with tag `textforge-v1-final`. 2. Preserve the same point with archival branch `archive/v1-current`. 3. Create `rewrite/v2-monorep…
- `ARCH-9-P04` — line 3226: This avoids a separate `TextForge2` repository while avoiding a confusing side-by-side codebase. The old implementation remains available through normal Git history, the archiva…

### §10 — 10. Companion roadmap set and authority split

- `ARCH-10-P01` — line 3233: The implementation roadmap is deliberately separated from this main architecture paper. This document defines the target architecture, invariants, security posture, surface mode…
- `ARCH-10-P02` — line 3238: Use the roadmap set as follows:
- `ARCH-10-P03` — lines 3243–3258: ```text roadmap/AGENTS_START_HERE.md First operational instructions for every coding agent run. roadmap/00_package_aware_roadmap.md Authoritative phase order, including the runn…
- `ARCH-10-P04` — line 3263: When this whitepaper and the roadmap set overlap, the roadmap set is authoritative for implementation sequencing and package rollout. The correct fix for drift is to update or r…

### §11 — 11. Testing strategy


### §11.1 — Unit tests

- `ARCH-11.1-P01` — line 3273: Required:
- `ARCH-11.1-P02` — lines 3278–3288: - workspace path normalization; - document versioning; - Dexie migrations; - zip path sanitizer; - plugin conflict handling; - pipeline runner sequencing; - diagnostics merge/gr…

### §11.2 — Parser/model tests

- `ARCH-11.2-P01` — line 3295: Required:
- `ARCH-11.2-P02` — lines 3300–3312: - ITM include resolution from workspace; - missing include diagnostics; - circular include diagnostics; - duplicate ID / overlay behavior; - namespaces with `::` and typed links…

### §11.3 — UI tests

- `ARCH-11.3-P01` — line 3319: Required:
- `ARCH-11.3-P02` — lines 3324–3333: - create/rename/delete/move in workspace tree; - tab reorder; - stale popup state; - diagnostics attention indicators; - plugin conflict UI; - viewer popup controls; - Markdown …

### §11.4 — Security and accreditation tests

- `ARCH-11.4-P01` — line 3340: Security tests should be split into two groups.

### §11.4.1 — Reusable accreditation-envelope checks

- `ARCH-11.4.1-P01` — line 3347: These are application-independent checks that can be reused across secure local-first web apps:
- `ARCH-11.4.1-P02` — lines 3352–3380: ```text CSP/static target: no unapproved connect-src no remote scripts/modules/workers no CDN runtime assets no object/embed escape path Extension target: no broad host permissi…
- `ARCH-11.4.1-P03` — line 3385: These checks support accreditation because they verify browser-enforced safeguards and privileged browser API absence.

### §11.4.2 — TextForge project security tests

- `ARCH-11.4.2-P01` — line 3392: These are ordinary project tests. They are useful, but they should not be confused with the reusable accreditation harness:
- `ARCH-11.4.2-P02` — lines 3397–3404: ```text Lua cannot access DOM/network/filesystem/browser globals. Lua cannot use forbidden libraries such as io/os/debug/loadfile/dofile. Zip import rejects path traversal and a…
- `ARCH-11.4.2-P03` — line 3409: The distinction matters. The reusable harness verifies the accredited browser envelope. TextForge tests verify that TextForge's own features are implemented well.

### §11.5 — Golden-output tests

- `ARCH-11.5-P01` — line 3416: Required:
- `ARCH-11.5-P02` — lines 3421–3434: - Markdown preview fixtures; - Markdown image-reference fixtures; - generated SVG fixtures; - generated PNG smoke fixtures where stable; - print-optimized HTML report fixtures; …
- `ARCH-11.5-P03` — line 3439: ---

### §12 — 12. Files and documents to preserve, migrate, or recreate

- `ARCH-12-P01` — line 3443: The rebuild should maintain the following source-of-truth documents or their updated equivalents.

### §12.1 — Product and architecture documents

- `ARCH-12.1-P01` — lines 3450–3458: | File | Preserve as | Reason | |---|---|---| | `README.md` | top-level product README | Captures current user-facing scope, local-first posture, supported formats, Lua pivot, r…

### §12.2 — Format specifications

- `ARCH-12.2-P01` — lines 3465–3470: | File | Preserve as | Reason | |---|---|---| | `indented_text_model_format_description_updated.md` | ITM specification | Required canonical model spec. | | `docs/itm-tree-style…

### §12.3 — User-facing resources

- `ARCH-12.3-P01` — lines 3477–3493: | File/group | Preserve as | Reason | |---|---|---| | User manual | bundled resource | Required for offline documentation. | | Lua scripting tutorial | bundled resource | Requir…

### §12.4 — Code assets to preserve conceptually

- `ARCH-12.4-P01` — line 3500: Even in a full rewrite, preserve these conceptual assets:
- `ARCH-12.4-P02` — lines 3505–3517: | Existing or intended asset | Preserve concept | |---|---| | CodeMirror setup | editor extension model, language switching, lint surface | | popup host | source-aware, stale-aw…
- `ARCH-12.4-P03` — line 3522: ---

### §12.5 — Security whitepaper integration notes

- `ARCH-12.5-P01` — line 3526: When maintaining this rebuild document, preserve the distinction from the secure webapp accreditation whitepaper:
- `ARCH-12.5-P02` — lines 3531–3536: - the application-private workspace is allowed and can be persisted in IndexedDB; - the workspace is not a live local filesystem mirror; - local file exchange is manual import/e…

### §13 — 13. Coding-agent implementation guidance

- `ARCH-13-P01` — line 3543: This section records architecture-level guardrails for implementation work. Operational run instructions, current phase control, and repository-state handling belong to the road…

### §13.1 — General rules for the coding agent

- `ARCH-13.1-P01` — lines 3550–3564: 1. Do not introduce app-code network access. 2. Do not introduce File System Access API. 3. Do not introduce user-provided JavaScript plugin execution. 4. Do not make viewers ow…

### §13.2 — Preferred folder structure

- `ARCH-13.2-P01` — lines 3571–3588: ```text src/ app/ workspace/ storage/ security/ domain/ languages/ plugins/ pipelines/ itm/ markdown/ lua/ viewers/ resources/ export/ tests/ ```

### §13.3 — Implementation sequencing authority

- `ARCH-13.3-P01` — line 3595: This whitepaper must not maintain its own phase summary, phase-number mapping, or package rollout checklist. Those details change more frequently than the architectural doctrine…
- `ARCH-13.3-P02` — line 3600: For implementation sequencing, always use:
- `ARCH-13.3-P03` — lines 3605–3608: - `roadmap/00_package_aware_roadmap.md` for the authoritative phase order. - `roadmap/01_repository_and_package_strategy.md` for runnable-shell and repository-boundary rules. - …
- `ARCH-13.3-P04` — line 3613: When updating this whitepaper, keep only the architecture-level statements that remain valid across multiple roadmap revisions. If a change affects phase order, package creation…

### §13.4 — Cross-document maintenance rule

- `ARCH-13.4-P01` — line 3620: If the whitepaper and the roadmap set ever diverge again, treat that as documentation drift:
- `ARCH-13.4-P02` — lines 3625–3628: 1. keep the architectural target state here; 2. keep implementation order and current phase control in the roadmap set; 3. remove or shorten duplicated implementation guidance i…
- `ARCH-13.4-P03` — line 3633: ---

### §13.8 — Binary-resource and export completeness requirements

- `ARCH-13.8-P01` — line 3638: The Surface-based workbench architecture must not remove the resource and export requirements. The following items remain mandatory:
- `ARCH-13.8-P02` — lines 3643–3656: ```text Read-only binary workspace resources are first-class workspace files. Images can be imported, viewed, embedded in Markdown, and resolved through workspace-relative paths…
- `ARCH-13.8-P03` — line 3661: The Surface architecture strengthens these requirements because images, SVGs, PDFs, and generated report previews become peer surfaces rather than popup-only side effects.

### §14 — 14. Definition of done

- `ARCH-14-P01` — line 3668: The rebuild is successful when:
- `ARCH-14-P02` — lines 3673–3690: 1. A user can maintain a multi-folder virtual workspace entirely in the browser. 2. The workspace persists in IndexedDB and can be manually imported/exported as zip. 3. No featu…
- `ARCH-14-P03` — line 3695: ---

### §14.1 — Editor-specific definition of done

- `ARCH-14.1-P01` — line 3699: An editor contribution is done only when:
- `ARCH-14.1-P02` — lines 3704–3713: 1. it is registered as a Surface contribution; 2. it declares whether it is source, rich-text, table, diagram, model, annotation, or hybrid; 3. it declares the canonical resourc…

### §15 — 15. Final architectural position

- `ARCH-15-P01` — line 3720: The rebuilt TextForge should be deliberately narrow in its security claim, React-based in its implementation posture, and deliberately broad in its structured-text usefulness.
- `ARCH-15-P02` — line 3725: It should not claim to protect users from every malicious transformation. A Lua script or built-in transformation can still damage the text the user chooses to process. The stro…
- `ARCH-15-P03` — line 3730: > TextForge runs inside a browser-enforced local-first security envelope: no unapproved network egress, no remote code loading, no privileged silent local filesystem access, an …
- `ARCH-15-P04` — line 3735: That claim is compatible with powerful local authoring, binary workspace resources, local image embedding, generated SVG/PNG assets, model transformation, enterprise architectur…
- `ARCH-15-P05` — line 3740: The result is not just an editor. It is a local, inspectable, accreditation-friendly workbench for text-based digital engineering artifacts, including enterprise architecture an…
