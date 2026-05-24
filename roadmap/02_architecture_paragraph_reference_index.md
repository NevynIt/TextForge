# Architecture Paragraph Reference Index

This index gives stable implementation anchors for `textforge_rebuild_whitepaper_main.md`. Roadmap phase notes and package guides use these IDs to point to exact architecture paragraphs or paragraph-like Markdown blocks that must be considered during implementation.

Anchor format: `ARCH-<section>-P<paragraph>`. A paragraph may be ordinary prose, a table, a list block, a code block, an unnumbered subsection heading, or a diagram block when that block carries implementation guidance. The line range identifies the exact source block in `roadmap/textforge_rebuild_whitepaper_main.md`. Reverse traceability notes inserted after source blocks are intentionally not assigned separate architecture anchors.

## Index

### §1 — Executive summary

- `ARCH-1-P01` — lines 12–12: TextForge should be rebuilt as a **React-based, local-first, text-first structured-text workbench**. Its central promise is that plain text remains the canonical source while diagrams, graphs, rendered Markdown, BPMN vi…
- `ARCH-1-P02` — lines 17–17: The rebuild should not start as a generic web IDE. It should start as a deterministic local document workbench with four pillars:
- `ARCH-1-P03` — lines 22–26: 1. **A virtual workspace** backed by IndexedDB, with explicit manual upload/download as the only file boundary. 2. **A canonical ITM object model** used as the internal structural representation for trees, graphs, diagr…
- `ARCH-1-P04` — lines 31–31: The recommended rebuild should use React as the UI foundation and reuse proven libraries where they do not compromise the product model:
- `ARCH-1-P05` — lines 36–73: | Area | Selected component | |---|---| | UI runtime | React 19.x + TypeScript | | Workbench surface model | custom SurfaceRegistry, SurfaceSessionManager, and PlacementManager | | Build tool | Vite React TypeScript app…
- `ARCH-1-P06` — lines 78–78: The key custom components should be: virtual workspace model, ITM integration, pipeline runner, diagnostics model, source/view bridge, report generation orchestration, Lua sandbox policy, controlled write-back, and a re…
- `ARCH-1-P07` — lines 83–83: ---
### §2 — Product doctrine

- `ARCH-2-P01` — lines 87–87: The rebuild should preserve the following invariants.
- `ARCH-2-P02` — lines 92–109: ```text 1. Text is canonical. 2. The workspace is virtual and local. 3. ITM is the canonical structural object model. 4. Viewers are projections, not source owners. 5. Pipelines are explicit, traceable, and diagnosable.…
- `ARCH-2-P03` — lines 114–114: These invariants should be treated as architectural tests. A new feature that violates one of them should be rejected or redesigned.
- `ARCH-2-P04` — lines 120–120: ---
### §3 — System context

- `ARCH-3-P01` — lines 124–124: TextForge is intended to run as:
- `ARCH-3-P02` — lines 129–131: 1. a local/static web app where feasible; 2. a packaged browser extension; 3. optionally, a PWA-like local web app if served from a controlled origin.
- `ARCH-3-P03` — lines 136–136: All accredited local targets must preserve the same security claim:
- `ARCH-3-P04` — lines 141–141: > TextForge cannot silently access or modify user-visible local files. Local files, including images and reference PDFs, enter through explicit user upload/import or ZIP import. Local files leave through explicit user d…
- `ARCH-3-P05` — lines 146–146: This is stronger than “offline-capable.” It is a deliberate accreditation posture.
- `ARCH-3-P06` — lines 151–151: The security claim should be understood as a **browser-envelope claim**, not a proof of every internal implementation detail. The accreditation harness should verify that the browser and deployment safeguards are presen…
- `ARCH-3-P07` — lines 156–156: TextForge-specific architectural discipline remains important, but it should not be confused with reusable accreditation. For example, TextForge should still use a `WorkspaceStorageGateway`, `FileGateway`, and `ExportGa…
### §3.1 — Browser-envelope accreditation profile

- `ARCH-3.1-P01` — lines 163–163: The default TextForge target should conform to a reusable profile similar to:
- `ARCH-3.1-P02` — lines 168–195: ```yaml profile: local-only-manual-file-workspace-webapp network: mode: none remoteCode: scripts: forbidden plugins: forbidden cdnRuntimeAssets: forbidden localFiles: silentRead: forbidden silentWrite: forbidden fileSys…
- `ARCH-3.1-P03` — lines 200–200: This profile is intentionally application-independent. It can apply to TextForge, another local Markdown tool, a PDF utility, a modelling workbench, or a browser-based document processor.
### §3.2 — What the accreditation harness should verify

- `ARCH-3.2-P01` — lines 207–207: The reusable harness should check the deployment envelope:
- `ARCH-3.2-P02` — lines 212–219: - CSP for the static/PWA target; - extension manifest permissions for the extension target; - PWA manifest and service-worker pattern for the PWA target; - final built HTML and bundles for remote scripts, remote workers…
- `ARCH-3.2-P03` — lines 224–224: The harness should not become a TextForge architecture verifier. It should not need to know the TextForge workspace model, ITM processor, viewer registry, Lua module layout, or whether all storage writes pass through a…
### §3.3 — Internal architecture rules versus accreditation rules

- `ARCH-3.3-P01` — lines 231–231: The distinction should be explicit:
- `ARCH-3.3-P02` — lines 236–244: | Concern | Belongs to | Example | |---|---|---| | Browser-enforced no-network posture | Accreditation harness | CSP `connect-src 'none'`, no external origins, no WebSocket to remote host | | No privileged local filesys…
- `ARCH-3.3-P03` — lines 249–249: This keeps the accreditation harness reusable across applications and prevents it from becoming an overfitted static-analysis project.
- `ARCH-3.3-P04` — lines 254–254: ---
### §4 — Target architecture overview

- `ARCH-4-P01` — lines 258–258: The Surface model changes the center of gravity of the runtime architecture. The application should not be built around the assumption that the main pane is always CodeMirror and that every viewer is a popup. Instead, T…
- `ARCH-4-P02` — lines 263–263: A **surface** is any interactive or read-only work area that can be hosted by the application shell. CodeMirror is one surface. A Markdown preview is another. An image viewer, PDF viewer, ITM graph, BPMN diagram, Lua co…
- `ARCH-4-P03` — lines 268–268: Placement is separate from identity:
- `ARCH-4-P04` — lines 273–275: ```text Resource or pipeline output -> Surface contribution -> Surface session -> Placement ```
- `ARCH-4-P05` — lines 280–280: Initial placements should be deliberately simple:
- `ARCH-4-P06` — lines 285–302: ```text Stage 1 target: one main surface area optional popup placement for any surface that supports it Phase 3.1 usability recovery: narrow main-session document tab strip cleaner React shell Stage 2 target, later: adv…
### §4.1 — Runtime architecture

- `ARCH-4.1-P01` — lines 309–358: ```mermaid flowchart TD User[User] Shell[Application Shell] Workspace[Virtual Workspace Manager] Store[(IndexedDB via Dexie)] SurfaceRegistry[Surface Registry] SurfaceSessions[Surface Session Manager] Placement[Placemen…
- `ARCH-4.1-P02` — lines 363–363: The accreditation harness is intentionally shown outside the runtime application. It verifies the packaging and browser security envelope. It is not an internal runtime service and should not be coupled to TextForge-spe…
### §4.2 — Source, model, surface, and export

- `ARCH-4.2-P01` — lines 370–370: The important separation is now between **source**, **model**, **surface**, **placement**, and **export**.
- `ARCH-4.2-P02` — lines 375–393: ```mermaid flowchart LR Source[Workspace resource or text source] Parse[Parsers / transformers] Model[Canonical model.itm / typed values] Project[Surface-specific projection] Surface[Surface instance] Placement[Main or…
- `ARCH-4.2-P03` — lines 398–398: This keeps the text/model source-of-truth doctrine intact while allowing rendered artifacts to become first-class work surfaces.
### §4.3 — Resource surfaces and derived surfaces

- `ARCH-4.3-P01` — lines 405–405: Two surface classes should be distinguished.
- `ARCH-4.3-P02` — lines 410–410: **Resource surfaces** open a workspace resource directly:
- `ARCH-4.3-P03` — lines 415–423: ```text .itm -> CodeMirror editor / ITM tree / ITM graph / ITM inspector .md -> CodeMirror editor / Markdown preview / report preview .svg -> SVG viewer / CodeMirror XML source view .png -> image viewer .pdf -> read-onl…
- `ARCH-4.3-P04` — lines 428–428: **Derived surfaces** are generated from a source resource or a pipeline:
- `ARCH-4.3-P05` — lines 433–442: ```text Markdown rendered HTML ITM dependency graph Mermaid rendered SVG Graphviz rendered SVG Report preview Diagnostics summary Generated PNG preview Generated SVG preview ```
- `ARCH-4.3-P06` — lines 447–447: Derived surfaces must carry provenance: source resources, source versions, pipeline ID, generated asset ID if any, and stale/current state.
- `ARCH-4.3-P07` — lines 452–452: ---
### §5.1 — React 19 and Vite as the UI foundation

- `ARCH-5.1-P01` — lines 458–458: **Decision:** Use React 19.x with TypeScript and Vite.
- `ARCH-5.1-P02` — lines 463–463: **Rationale:**
- `ARCH-5.1-P03` — lines 468–471: - compatibility and coding-agent support matter more than minimum bundle size; - React is the default target for most reusable UI components and examples; - React Arborist, React Flow, react-resizable-panels, dnd-kit, T…
- `ARCH-5.1-P04` — lines 476–476: **Non-goal:** Do not adopt server-first React patterns. TextForge should remain a static browser application. React Server Components, Next.js server routes, telemetry, hosted services, and runtime network dependencies…
- `ARCH-5.1-P05` — lines 481–481: Recommended baseline:
- `ARCH-5.1-P06` — lines 486–494: ```text React 19.x TypeScript Vite React TypeScript template Vitest Playwright ESLint Prettier or equivalent formatting ```
### §5.2 — Surface workbench architecture

- `ARCH-5.2-P01` — lines 502–502: **Decision:** Introduce a custom Surface abstraction rather than treating CodeMirror as the only main work area and viewers as popup-only components.
- `ARCH-5.2-P02` — lines 507–507: **Rationale:**
- `ARCH-5.2-P03` — lines 512–515: - TextForge is a workbench over mixed resources, not only a text editor. - Read-only images, reference PDFs, rendered reports, ITM graphs, BPMN diagrams, and generated SVG/PNG previews often deserve to be the main surfa…
- `ARCH-5.2-P04` — lines 520–520: Recommended initial target:
- `ARCH-5.2-P05` — lines 525–530: ```text Stage 1: one main surface + optional popup placement Phase 3.1 usability recovery: narrow main-session document tab strip and cleaner React shell Stage 2: advanced tabbed main surface groups, added later in the…
- `ARCH-5.2-P06` — lines 535–535: Use custom TextForge types for `SurfaceContribution`, `SurfaceSession`, `SurfacePlacement`, and `SurfaceCapability`. Do not over-adopt a complete IDE layout framework early.
### §5.3 — Editable surfaces and controlled write-back

- `ARCH-5.3-P01` — lines 542–542: **Decision:** Treat editors as Surface contributions with editing capabilities, not as a separate UI class that bypasses the workbench model.
- `ARCH-5.3-P02` — lines 547–547: A surface may be read-only, source-editing, rich-text-editing, table-editing, diagram-editing, model-editing, annotation-editing, or hybrid. Placement remains independent: an editor can appear in the main surface, a pop…
- `ARCH-5.3-P03` — lines 552–552: The critical rule is that every non-source editor must declare its write-back contract before it is accepted into TextForge. The contract must identify:
- `ARCH-5.3-P04` — lines 557–562: - the canonical resource format it edits; - the operations it supports; - constructs it cannot preserve; - how edits are represented as a patch or regenerated canonical source; - the fallback source editor; - the requir…
- `ARCH-5.3-P05` — lines 567–567: This protects the spirit of TextForge: visual convenience is allowed, but canonical text and explicit resources remain the authority.
- `ARCH-5.3-P06` — lines 572–572: Recommended contribution shape:
- `ARCH-5.3-P07` — lines 577–610: ```ts export interface EditableSurfaceContribution<TInput = SurfaceInput> extends SurfaceContribution<TInput> { editKind: | "source" | "rich-markdown" | "table" | "diagram" | "model" | "annotation" | "hybrid"; canonical…
- `ARCH-5.3-P08` — lines 615–615: The initial implementation should not attempt to deliver all rich and visual editors. It should make CodeMirror universal, add mature standalone editors where they are isolated and valuable, and defer more fragile rich/…
### §5.4 — Editor library selection and maturity posture

- `ARCH-5.4-P01` — lines 622–622: TextForge should prefer mature, open-source-compatible editor libraries that either preserve source directly or expose a controlled data model suitable for patch generation.
- `ARCH-5.4-P02` — lines 627–639: | Editing need | Selected approach | Maturity / licensing posture | Roadmap posture | |---|---|---|---| | Source editing for all text formats | CodeMirror 6 | Mature, MIT | Foundational and early | | BPMN visual editing…
- `ARCH-5.4-P03` — lines 644–644: Libraries that are not open-source-compatible, require commercial production keys, or impose non-commercial/source-available-only terms should not enter the default TextForge baseline.
### §5.5 — Open-source dependency licensing gate

- `ARCH-5.5-P01` — lines 651–651: TextForge should include a dependency policy from the beginning. The policy should be used for all editor, viewer, pipeline, and UI dependencies.
- `ARCH-5.5-P02` — lines 656–656: Allowed by default:
- `ARCH-5.5-P03` — lines 661–667: ```text MIT BSD-2-Clause BSD-3-Clause Apache-2.0 ISC ```
- `ARCH-5.5-P04` — lines 672–672: Allowed only with explicit review:
- `ARCH-5.5-P05` — lines 677–682: ```text MPL-2.0 LGPL custom attribution licenses, such as the bpmn.io license licenses with branding or notice requirements ```
- `ARCH-5.5-P06` — lines 687–687: Rejected by default:
- `ARCH-5.5-P07` — lines 692–699: ```text commercial-only non-commercial-only production-license-key required source-available but non-OSI licenses that prevent normal open-source redistribution copyleft dependencies that unexpectedly constrain the whol…
- `ARCH-5.5-P08` — lines 704–704: Practical baseline decisions:
- `ARCH-5.5-P09` — lines 709–713: - use TanStack Table and possibly AG Grid Community instead of Handsontable; - use Excalidraw instead of tldraw for the open-source baseline; - use Milkdown before MDXEditor unless MDXEditor and its dependency tree pass…
### §5.6 — CodeMirror 6 for editing

- `ARCH-5.6-P01` — lines 720–720: **Decision:** Preserve CodeMirror 6.
- `ARCH-5.6-P02` — lines 725–725: **Rationale:**
- `ARCH-5.6-P03` — lines 730–734: - modular extension model; - good fit for custom languages and DSLs; - supports linting, folding, decorations, diagnostics, and source ranges; - lighter and more composable than Monaco; - already aligned with TextForge’…
- `ARCH-5.6-P04` — lines 739–739: **Do not use Monaco by default.** Monaco is excellent for a browser IDE, but TextForge is not primarily a clone of VS Code. It is a structured-text workbench with custom model and viewer pipelines.
### §5.7 — React Arborist for workspace explorer

- `ARCH-5.7-P01` — lines 746–746: **Decision:** Use React Arborist as the virtual workspace tree UI.
- `ARCH-5.7-P02` — lines 751–751: **Rationale:**
- `ARCH-5.7-P03` — lines 756–760: - tree virtualization; - file-explorer-like UX; - drag/drop support; - rename/select/open patterns; - allows TextForge to own the underlying workspace model.
- `ARCH-5.7-P04` — lines 765–765: React Arborist must be treated as a **view component only**. It must not own persistence, paths, language IDs, include resolution, document identity, or security decisions.
- `ARCH-5.7-P05` — lines 770–770: Recommended adapter model:
- `ARCH-5.7-P06` — lines 775–785: ```ts export interface WorkspaceTreeNode { id: string; kind: "folder" | "file"; name: string; parentId: string | null; path: string; documentId?: string; children?: WorkspaceTreeNode[]; } ```
### §5.8 — Dexie.js for IndexedDB

- `ARCH-5.8-P01` — lines 792–792: **Decision:** Use Dexie.js for persistence.
- `ARCH-5.8-P02` — lines 797–797: **Rationale:**
- `ARCH-5.8-P03` — lines 802–804: - more maintainable than direct IndexedDB for multi-store workspace state; - supports versioned schemas and migrations; - useful for documents, folders, pipeline preferences, Lua scripts, resource metadata, and persiste…
- `ARCH-5.8-P04` — lines 809–809: Minimum stores:
- `ARCH-5.8-P05` — lines 814–823: ```ts export interface TextForgeDbSchema { documents: PersistedDocument; workspaceNodes: PersistedWorkspaceNode; settings: PersistedSetting; pluginPreferences: PersistedPluginPreferences; luaScripts: PersistedLuaScript;…
### §5.9 — fflate for zip import/export

- `ARCH-5.9-P01` — lines 830–830: **Decision:** Use fflate.
- `ARCH-5.9-P02` — lines 835–835: **Rationale:**
- `ARCH-5.9-P03` — lines 840–843: - small and fast; - browser-compatible; - supports folder/workspace import/export through explicit user action; - avoids requiring File System Access API.
- `ARCH-5.9-P04` — lines 848–848: Required use cases:
- `ARCH-5.9-P05` — lines 853–858: - import zip into current folder; - import zip as new workspace; - export selected folder; - export workspace root; - preserve relative paths; - reject dangerous paths such as `../`, absolute paths, drive roots, or hidd…
### §5.10 — markdown-it plus unified/remark/rehype

- `ARCH-5.10-P01` — lines 865–865: **Decision:** Use both, for different jobs.
- `ARCH-5.10-P02` — lines 870–873: ```text Interactive preview: markdown-it Report/document pipeline: unified + remark + rehype ```
- `ARCH-5.10-P03` — lines 878–878: **Rationale:**
- `ARCH-5.10-P04` — lines 883–885: - markdown-it is fast and practical for preview; - unified/remark/rehype is better for AST-level document transformation; - ITM-in-Markdown report generation needs structural extraction and reconstruction, not just HTML…
### §5.11 — Binary resources, image assets, and PDF viewing

- `ARCH-5.11-P01` — lines 893–893: **Decision:** Treat binary resources as first-class workspace files, but keep them read-only unless a specific transformer generates a new derived artifact.
- `ARCH-5.11-P02` — lines 898–898: Required binary resource classes:
- `ARCH-5.11-P03` — lines 903–908: ```text Images: PNG, JPEG, GIF, WebP, SVG Reference documents: PDF Generated diagram assets: SVG and PNG Future generated report assets: HTML and possibly PDF ```
- `ARCH-5.11-P04` — lines 913–913: **Image resources** should use native browser image rendering through object URLs or blob URLs created from workspace content. Markdown image references should resolve through the workspace resolver, not through direct…
- `ARCH-5.11-P05` — lines 918–918: **PDF resources** should be viewable as read-only reference documents. Use PDF.js if consistent local rendering, page navigation, zoom, and text layer/search are needed. Browser-native PDF embedding is acceptable as an…
- `ARCH-5.11-P06` — lines 923–923: **Generated SVG and PNG assets** should be stored in the workspace as derived files. SVG is the preferred canonical generated diagram asset. PNG should be produced by local rasterization when users need bitmap output fo…
- `ARCH-5.11-P07` — lines 928–928: **Markdown-to-PDF generation** should be treated as a late-stage capability. The first reliable path should be print-optimized HTML. Direct browser-local PDF generation from complex Markdown HTML should be introduced on…
- `ARCH-5.11-P08` — lines 933–933: Rationale:
- `ARCH-5.11-P09` — lines 938–942: - Markdown projects need local image references. - ITM and diagram pipelines need a place to store generated SVG/PNG artifacts. - Reference PDFs are common workspace inputs even when they are not edited. - The virtual w…
### §5.12 — Cytoscape.js, Sigma.js/Graphology, jsMind

- `ARCH-5.12-P01` — lines 949–949: **Decision:** Preserve multiple model viewers.
- `ARCH-5.12-P02` — lines 954–959: ```text ITM -> Cytoscape.js rich interactive graph ITM -> Sigma/Graphology large graph exploration ITM -> jsMind mind map ITM -> Tree viewer hierarchy/source navigation ```
- `ARCH-5.12-P03` — lines 964–964: **Rationale:**
- `ARCH-5.12-P04` — lines 969–969: No single graph/mindmap library covers all use cases well. TextForge should allow the same ITM source to be projected into multiple derived views.
### §5.13 — bpmn-js and bpmn-moddle

- `ARCH-5.13-P01` — lines 976–976: **Decision:** Use bpmn-js for BPMN rendering and future controlled editing.
- `ARCH-5.13-P02` — lines 981–981: **Rationale:**
- `ARCH-5.13-P03` — lines 986–989: - BPMN XML is complex; - rebuilding BPMN visualization is wasteful; - bpmn-moddle provides BPMN XML parsing/serialization; - bpmn-js provides the rendering/modeling surface.
- `ARCH-5.13-P04` — lines 994–994: TextForge must still preserve the source-of-truth rule:
- `ARCH-5.13-P05` — lines 999–1001: ```text BPMN XML source -> bpmn-js viewer/modeler -> reviewed write-back patch -> XML source ```
### §5.14 — Enterprise architecture and ArchiMate support

- `ARCH-5.14-P01` — lines 1008–1008: **Decision:** Add enterprise architecture and ArchiMate as first-class model workflows, parallel to BPMN support.
- `ARCH-5.14-P02` — lines 1013–1013: **Rationale:**
- `ARCH-5.14-P03` — lines 1018–1021: - TextForge should support enterprise architecture repositories and views, not only generic graph rendering. - ArchiMate is a structured enterprise architecture language with concepts, relationships, viewpoints, and exc…
- `ARCH-5.14-P04` — lines 1026–1026: Required capabilities:
- `ARCH-5.14-P05` — lines 1031–1057: ```text ITM ArchiMate profile entity types, relationship types, constraints, viewpoints, styles ArchiMate exchange import ArchiMate exchange XML -> ITM model package ArchiMate exchange export ITM ArchiMate model/package…
- `ARCH-5.14-P06` — lines 1062–1062: Recommended version strategy:
- `ARCH-5.14-P07` — lines 1067–1072: ```text Use profile packages, not hardcoded assumptions. Provide a current ArchiMate profile as the default. Allow additional compatibility profiles where enterprise tools still use earlier ArchiMate versions. Keep the…
- `ARCH-5.14-P08` — lines 1077–1077: The important architectural principle is the same as for BPMN: external standards are supported through explicit profile and transformation layers, while TextForge keeps text and ITM as the inspectable source layer wher…
### §5.15 — Fengari for Lua

- `ARCH-5.15-P01` — lines 1084–1084: **Decision:** Use Fengari as Lua VM only.
- `ARCH-5.15-P02` — lines 1089–1089: **Rationale:**
- `ARCH-5.15-P03` — lines 1094–1096: - browser-compatible Lua execution; - good basis for the Lua pivot; - allows user-defined transformations without user-provided JavaScript.
- `ARCH-5.15-P04` — lines 1101–1101: TextForge must own the sandbox policy, worker isolation, module whitelist, limits, bridge API, and diagnostics.
- `ARCH-5.15-P05` — lines 1106–1106: ---
### §6.1 — Application shell

- `ARCH-6.1-P01` — lines 1112–1112: Responsibilities:
- `ARCH-6.1-P02` — lines 1117–1121: - initialize services; - host layout; - host top-level menus/actions; - coordinate editor, workspace, popups, diagnostics, plugins, and resource browser; - remain thin.
- `ARCH-6.1-P03` — lines 1126–1126: Suggested folder:
- `ARCH-6.1-P04` — lines 1131–1141: ```text src/app/ App.tsx AppShell.tsx useAppServices.ts useWorkspacePersistence.ts usePipelineActions.ts usePopupManager.ts useSourceSelectionBridge.ts useAttentionState.ts ```
- `ARCH-6.1-P05` — lines 1146–1146: The rebuild should explicitly prevent `App.tsx` becoming the central orchestration module.
### §6.2 — Workspace manager

- `ARCH-6.2-P01` — lines 1153–1153: Responsibilities:
- `ARCH-6.2-P02` — lines 1158–1166: - own documents; - own folders; - own virtual paths; - own tabs; - own current document; - track dirty/current/stale state; - increment document version on all content, filename, language, metadata, and identity changes…
- `ARCH-6.2-P03` — lines 1171–1171: Interfaces:
- `ARCH-6.2-P04` — lines 1176–1212: ```ts export interface TextDocument { id: string; fileName: string; languageId: string; text: string; version: number; dirty: boolean; identity: DocumentIdentity; folderPath?: string; createdAt: string; updatedAt: strin…
### §6.3 — Virtual file system

- `ARCH-6.3-P01` — lines 1219–1219: The virtual file system is not a filesystem API wrapper. It is an application model.
- `ARCH-6.3-P02` — lines 1224–1224: Responsibilities:
- `ARCH-6.3-P03` — lines 1229–1235: - normalize workspace paths; - prevent path traversal; - support folder import/export; - support folder rename/move/delete; - maintain stable document IDs independent of display path; - expose read-only resolver functio…
- `ARCH-6.3-P04` — lines 1240–1240: Forbidden:
- `ARCH-6.3-P05` — lines 1245–1249: - File System Access API; - directory handles; - automatic sync to local folders; - silent file writes; - network repository resolution unless explicitly introduced in a separately accredited mode.
### §6.4 — Storage service

- `ARCH-6.4-P01` — lines 1256–1256: Responsibilities:
- `ARCH-6.4-P02` — lines 1261–1266: - Dexie schema definition; - migrations; - workspace load/save; - localStorage fallback only for emergency/minimal state; - backup/export state; - uniqueness repair for document identities/badges after restore or batch…
- `ARCH-6.4-P03` — lines 1271–1271: Suggested Dexie schema:
- `ARCH-6.4-P04` — lines 1276–1285: ```ts class TextForgeDb extends Dexie { documents!: Table<PersistedDocument, string>; workspaceNodes!: Table<PersistedWorkspaceNode, string>; settings!: Table<PersistedSetting, string>; pluginPreferences!: Table<Persist…
### §6.5 — Binary resource and asset service

- `ARCH-6.5-P01` — lines 1293–1293: TextForge should support workspace files that are not editable text documents. These files are still part of the virtual workspace and can participate in Markdown, reports, generated assets, and reference workflows.
- `ARCH-6.5-P02` — lines 1298–1298: Responsibilities:
- `ARCH-6.5-P03` — lines 1303–1311: - store binary content through the workspace storage layer; - classify binary resources by media type and extension; - create scoped object URLs/blob URLs for viewers; - revoke object URLs when no longer needed; - expos…
- `ARCH-6.5-P04` — lines 1316–1316: Suggested interfaces:
- `ARCH-6.5-P05` — lines 1321–1354: ```ts export type WorkspaceResourceKind = | "text" | "image" | "svg" | "pdf" | "binary" | "generated"; export interface WorkspaceResource { id: string; path: string; kind: WorkspaceResourceKind; mediaType: string; size:…
- `ARCH-6.5-P06` — lines 1359–1359: Important distinction:
- `ARCH-6.5-P07` — lines 1364–1368: ```text Editable text document: opened in CodeMirror and changed by the user. Read-only binary resource: stored in workspace, previewed, referenced, exported, or used by pipelines. Generated artifact: derived from a sou…
- `ARCH-6.5-P08` — lines 1373–1373: This distinction should be visible in the UI and in diagnostics.
### §6.6 — Language registry

- `ARCH-6.6-P01` — lines 1380–1380: Responsibilities:
- `ARCH-6.6-P02` — lines 1385–1389: - identify language from filename/content/user choice; - expose CodeMirror language extensions; - expose lint providers; - expose available pipelines; - maintain language hierarchy.
- `ARCH-6.6-P03` — lines 1394–1394: Language IDs should include at least:
- `ARCH-6.6-P04` — lines 1399–1415: ```text text markdown itm lua json xml bpmn-xml csv tsv mermaid graphviz-dot svg html javascript python ```
- `ARCH-6.6-P05` — lines 1421–1421: Resource classifications should include non-text files:
- `ARCH-6.6-P06` — lines 1426–1433: ```text image.png / image.jpeg / image.webp / image.gif -> resource.image image.svg -> resource.svg, with optional source-text view .pdf -> resource.pdf unknown binary -> resource.binary generated diagram SVG -> resourc…
- `ARCH-6.6-P07` — lines 1438–1438: Binary resources should normally open in viewers, not in CodeMirror. SVG may have both a rendered viewer and a source-text editor mode because SVG is XML text.
### §6.7 — Plugin and contribution registry

- `ARCH-6.7-P01` — lines 1445–1445: Internal TypeScript contributions should remain trusted and packaged.
- `ARCH-6.7-P02` — lines 1450–1450: Contribution kinds:
- `ARCH-6.7-P03` — lines 1455–1467: ```ts export type ContributionKind = | "language" | "editorExtension" | "linter" | "parser" | "transformer" | "viewer" | "exporter" | "pipeline" | "diagnosticsProvider" | "luaBridge"; ```
- `ARCH-6.7-P04` — lines 1472–1472: Pipeline conflicts must be errors, not override points.
- `ARCH-6.7-P05` — lines 1477–1489: ```ts export interface RegisteredPipeline { pipeline: PipelineContribution; pluginId: string; enabled: boolean; disabledReason?: "user" | "conflict"; conflictWith?: Array<{ pluginId: string; pipelineId: string; pipeline…
- `ARCH-6.7-P06` — lines 1494–1494: Registry API:
- `ARCH-6.7-P07` — lines 1499–1509: ```ts export interface PluginRegistry { registerManifest(manifest: PluginManifest): PluginRegistrationResult; loadPlugin(pluginId: string): Promise<void>; listPipelinesForLanguage(languageId: string): PipelineContributi…
### §6.8 — Pipeline runner

- `ARCH-6.8-P01` — lines 1516–1516: Responsibilities:
- `ARCH-6.8-P02` — lines 1521–1527: - execute ordered steps; - connect contributions by ID; - collect trace; - collect diagnostics; - expose intermediate values; - allow intermediate results to open as editable documents; - distinguish viewer, exporter, t…
- `ARCH-6.8-P03` — lines 1532–1532: Pipeline value model:
- `ARCH-6.8-P04` — lines 1537–1561: ```ts export type PipelineValueKind = | "text" | "html" | "svg" | "json" | "table" | "itm-document" | "graph-projection" | "tree-projection" | "bpmn-xml" | "diagnostics" | "viewer-result"; export interface PipelineValue…
- `ARCH-6.8-P05` — lines 1566–1566: Trace model:
- `ARCH-6.8-P06` — lines 1571–1582: ```ts export interface PipelineTraceStep { stepId: string; contributionId: string; inputKind: PipelineValueKind; outputKind: PipelineValueKind; startedAt: string; finishedAt: string; diagnostics: Diagnostic[]; serializa…
### §6.9 — ITM integration module

- `ARCH-6.9-P01` — lines 1589–1589: The ITM module is one of the highest-risk and highest-value parts.
- `ARCH-6.9-P02` — lines 1594–1594: Responsibilities:
- `ARCH-6.9-P03` — lines 1599–1605: - call `@textforge/itm` for parsing/resolution; - provide TextForge workspace resolver functions; - map ITM diagnostics into TextForge diagnostics; - expose ITM document value to pipelines; - project ITM to viewer-speci…
- `ARCH-6.9-P04` — lines 1610–1610: TextForge-side include resolver:
- `ARCH-6.9-P05` — lines 1615–1633: ```ts export function createWorkspaceItmResolver(workspace: WorkspaceManager): ItmIncludeResolver { return { async resolveInclude(request) { const doc = workspace.resolveVirtualPath(request.target, request.fromUri); if…
- `ARCH-6.9-P06` — lines 1638–1638: ITM processing sequence:
- `ARCH-6.9-P07` — lines 1643–1661: ```mermaid flowchart TD Raw[Raw ITM text] Directives[Parse directives] Includes[Resolve includes] Namespaces[Resolve namespaces] Packages[Resolve packages/usings] Entities[Parse entities, descriptions, attrs, links] Imp…
### §6.10 — Enterprise architecture and ArchiMate module

- `ARCH-6.10-P01` — lines 1668–1668: Enterprise architecture support should be implemented as a profile-driven model package on top of ITM. It should not be a single monolithic viewer.
- `ARCH-6.10-P02` — lines 1673–1673: Responsibilities:
- `ARCH-6.10-P03` — lines 1678–1686: - provide one or more ArchiMate ITM profile packages; - define ArchiMate element types, relationship types, layers, aspects, and viewpoints; - validate ArchiMate relationship constraints and view consistency; - import A…
- `ARCH-6.10-P04` — lines 1691–1691: Suggested files:
- `ARCH-6.10-P05` — lines 1696–1709: ```text src/ea/ archimateProfile.ts archimateTypes.ts archimateRelationshipRules.ts archimateViewpoints.ts archimateStyles.ts archimateExchangeImport.ts archimateExchangeExport.ts archimateDiagnostics.ts archimateCatalo…
- `ARCH-6.10-P06` — lines 1714–1714: Suggested profile/resource files:
- `ARCH-6.10-P07` — lines 1719–1727: ```text resources/profiles/archimate/ archimate-profile.itm archimate-relationships.itm archimate-viewpoints.itm archimate-styles.itm archimate-validation-rules.itm archimate-report-templates.md ```
- `ARCH-6.10-P08` — lines 1732–1732: The import pipeline should be explicit:
- `ARCH-6.10-P09` — lines 1737–1744: ```text ArchiMate exchange XML -> parse XML -> validate exchange structure -> map elements/relationships/views to ITM -> preserve source IDs and documentation -> emit ITM model package + diagnostics ```
- `ARCH-6.10-P10` — lines 1749–1749: The export pipeline should also be explicit:
- `ARCH-6.10-P11` — lines 1754–1759: ```text ITM ArchiMate model package -> validate ArchiMate profile conformance -> map ITM elements/relationships/views to exchange XML -> emit exchange XML + diagnostics ```
- `ARCH-6.10-P12` — lines 1764–1764: Export should be conservative. If TextForge has ITM content that cannot be faithfully represented in the selected ArchiMate exchange profile, it should preserve the ITM source and emit diagnostics rather than pretending…
- `ARCH-6.10-P13` — lines 1769–1769: Recommended ITM authoring pattern:
- `ARCH-6.10-P14` — lines 1774–1786: ```itm %using archimate_profile &customer [archimate::BusinessActor] Customer &online_sales [archimate::BusinessProcess] Online Sales &crm [archimate::ApplicationComponent] CRM Platform &customer_data [archimate::DataOb…
- `ARCH-6.10-P15` — lines 1791–1791: The exact relationship names should be defined by the ArchiMate profile package rather than scattered across application code.
- `ARCH-6.10-P16` — lines 1796–1796: Enterprise architecture outputs should include:
- `ARCH-6.10-P17` — lines 1801–1811: ```text Capability maps Application landscapes Business/application/technology layer views Motivation-to-implementation traceability Application dependency graphs Interface and data-flow views Relationship matrices Elem…
- `ARCH-6.10-P18` — lines 1816–1816: These outputs can be rendered as surfaces, exported as SVG/PNG/HTML/CSV where appropriate, and embedded into Markdown reports.
### §6.11 — Surface registry

- `ARCH-6.11-P01` — lines 1823–1823: The Surface registry replaces the older viewer-only registry concept. It registers any UI contribution that can occupy a workbench surface: editors, viewers, inspectors, consoles, diagnostics views, report previews, and…
- `ARCH-6.11-P02` — lines 1828–1828: Responsibilities:
- `ARCH-6.11-P03` — lines 1833–1838: - register surface contributions; - choose compatible surfaces for workspace resources and pipeline outputs; - expose common surface capabilities; - avoid central `viewers.tsx` or `openEditor.tsx` branching; - support b…
- `ARCH-6.11-P04` — lines 1843–1843: Core interface:
- `ARCH-6.11-P05` — lines 1848–1897: ```ts export type SurfaceKind = | "editor" | "viewer" | "inspector" | "console" | "diagnostics" | "report"; export type SurfaceCapability = | "edit-text" | "edit-rich-text" | "edit-table" | "edit-diagram" | "edit-model"…
- `ARCH-6.11-P06` — lines 1902–1902: The registry should support a command such as:
- `ARCH-6.11-P07` — lines 1907–1916: ```text Open With... CodeMirror Text Editor Markdown Preview ITM Graph ITM Inspector Image Viewer PDF Viewer SVG Viewer ```
### §6.12 — Editor registry as part of the Surface registry

- `ARCH-6.12-P01` — lines 1923–1923: Do not create a separate editor subsystem that bypasses Surface lifecycle, placement, provenance, or diagnostics. Instead, define editor contributions as a specialized subset of Surface contributions.
- `ARCH-6.12-P02` — lines 1928–1928: Editor contributions should be grouped by risk and maturity:
- `ARCH-6.12-P03` — lines 1933–1940: | Editor class | Examples | Default posture | |---|---|---| | Source editors | ITM, Markdown, Lua, XML, JSON, Mermaid, DOT, SVG, CSV text | early, default, low risk | | Standalone domain editors | BPMN modeler | early w…
- `ARCH-6.12-P04` — lines 1945–1945: A controlled editor must never silently replace the canonical source. The accepted pattern is:
- `ARCH-6.12-P05` — lines 1950–1958: ```text Open canonical resource -> create editor session -> edit temporary/editor-native state -> preview patch or regenerated canonical source -> user applies or discards -> workspace resource version increments -> dia…
- `ARCH-6.12-P06` — lines 1963–1963: For pure source editors, CodeMirror edits the canonical text directly because the canonical source is already visible and editable. For rich/visual/structured editors, the patch boundary must be explicit.
### §6.13 — Surface session manager

- `ARCH-6.13-P01` — lines 1971–1971: The Surface Session Manager tracks open surface instances independently from their placement.
- `ARCH-6.13-P02` — lines 1976–1976: Responsibilities:
- `ARCH-6.13-P03` — lines 1981–1986: - open surfaces for resources or pipeline results; - track title, dirty state, stale state, source binding, and provenance; - keep editor/viewer state separate from workspace file identity; - close, refresh, pin, and re…
- `ARCH-6.13-P04` — lines 1991–1991: Suggested model:
- `ARCH-6.13-P05` — lines 1996–2023: ```ts export type SurfaceInput = | { kind: "workspace-resource"; resourceId: string; preferredSurfaceId?: string } | { kind: "pipeline-result"; resultId: string; preferredSurfaceId?: string } | { kind: "diagnostics"; sc…
- `ARCH-6.13-P06` — lines 2028–2028: A derived surface should become stale when any source resource version changes. A generated resource surface should also show the generated artifact path and source pipeline.
### §6.14 — Placement manager and hosts

- `ARCH-6.14-P01` — lines 2035–2035: The Placement Manager decides where a surface appears. This is intentionally separate from the surface contribution itself.
- `ARCH-6.14-P02` — lines 2040–2040: Stage 1 placements:
- `ARCH-6.14-P03` — lines 2045–2049: ```ts export type SurfacePlacement = | { kind: "main" } | { kind: "popup"; popupId: string }; ```
- `ARCH-6.14-P04` — lines 2054–2054: Stage 2 later adds:
- `ARCH-6.14-P05` — lines 2059–2064: ```ts export type SurfacePlacement = | { kind: "main" } | { kind: "popup"; popupId: string } | { kind: "tab"; groupId: string; tabId: string }; ```
- `ARCH-6.14-P06` — lines 2069–2069: Future expansions may add splits and detached windows, but those should not be part of the first implementation target.
- `ARCH-6.14-P07` — lines 2074–2074: Shared chrome requirements:
- `ARCH-6.14-P08` — lines 2079–2091: ```text title resource path or source binding stale/current badge dirty marker where relevant refresh open source / reveal source open with... move to main open as popup export/download where supported close ```
- `ARCH-6.14-P09` — lines 2096–2096: Hosts:
- `ARCH-6.14-P10` — lines 2101–2106: ```text MainSurfaceHost primary work area, initially one active surface PopupSurfaceHost floating viewer/editor/inspector windows Future TabHost tabbed main surface group Future SplitHost split-pane workbench surfaces `…
- `ARCH-6.14-P11` — lines 2111–2111: The existing popup concept becomes one placement option. Popups should remain useful for quick previews, generated diagrams, and secondary references, but they should no longer be the only way viewers appear.
### §6.15 — Initial built-in surface contributions

- `ARCH-6.15-P01` — lines 2118–2118: The initial surface list should include both editors and viewers.
- `ARCH-6.15-P02` — lines 2123–2146: ```text CodeMirrorTextEditorSurface editable text resources MarkdownPreviewSurface rendered Markdown preview ReportPreviewSurface Markdown + ITM report preview SourceViewerSurface read-only source or pipeline intermedia…
- `ARCH-6.15-P03` — lines 2151–2151: Required read-only resource behavior:
- `ARCH-6.15-P04` — lines 2156–2162: ```text Image resources open read-only with zoom, fit, copy path, export/download, and reveal in workspace. SVG resources open rendered, with optional source mode and export/store as SVG or PNG. PDF resources open read-…
### §6.16 — Source/view bridge

- `ARCH-6.16-P01` — lines 2169–2169: Responsibilities:
- `ARCH-6.16-P02` — lines 2174–2180: - map source ranges to model elements; - map model elements to visual nodes/edges; - support visual click to source; - support editor cursor to viewer selection; - support source-aware diagnostics; - support Markdown em…
- `ARCH-6.16-P03` — lines 2185–2185: Core types:
- `ARCH-6.16-P04` — lines 2190–2216: ```ts export interface SourceRange { documentId: string; version: number; from: number; to: number; line?: number; column?: number; } export interface ModelElementRef { modelKind: "itm-node" | "itm-relationship" | "dire…
### §6.17 — Diagnostics service

- `ARCH-6.17-P01` — lines 2223–2223: Diagnostics should be universal.
- `ARCH-6.17-P02` — lines 2228–2247: ```ts export type DiagnosticSeverity = "error" | "warning" | "information" | "observation"; export interface Diagnostic { id: string; source: string; severity: DiagnosticSeverity; message: string; documentId?: string; r…
- `ARCH-6.17-P03` — lines 2252–2252: Sources:
- `ARCH-6.17-P04` — lines 2257–2266: - parser; - ITM resolver; - Markdown/report engine; - Lua runtime; - pipeline runner; - plugin registry; - viewer renderer; - exporter; - security checker; - workspace importer.
### §6.18 — Markdown preview and report engine

- `ARCH-6.18-P01` — lines 2273–2273: Two paths should coexist.
- `ARCH-6.18-P02` — lines 2278–2278: #### Preview path
- `ARCH-6.18-P03` — lines 2283–2285: ```text Markdown source -> markdown-it -> HTML viewer ```
- `ARCH-6.18-P04` — lines 2290–2290: Supports:
- `ARCH-6.18-P05` — lines 2295–2300: - syntax highlighting; - Mermaid fences; - Graphviz/DOT fences; - KaTeX; - SVG popout/export; - source-aware embedded blocks.
- `ARCH-6.18-P06` — lines 2305–2305: #### Report path
- `ARCH-6.18-P07` — lines 2310–2318: ```text Markdown source -> remark AST -> extract ITM blocks -> resolve/import model cells -> run ITM viewpoints -> generate sections/tables/diagrams/annexes -> rehype/HTML or Markdown output ```
- `ARCH-6.18-P08` — lines 2323–2323: This report path is central to the “ITM becomes the source for report generation through embedding into Markdown” concept. The same path should support enterprise architecture publication: ArchiMate views, application c…
- `ARCH-6.18-P09` — lines 2328–2328: Recommended embedded block patterns:
- `ARCH-6.18-P10` — lines 2333–2345: ````markdown ```itm name=core-model &capability [Capability] Deployable C2 &function [Function] Plan operation ``` ```itm-pub view=capability-map import=core-model %view capability_map { viewpoint: dependency_graph } ``…
- `ARCH-6.18-P11` — lines 2350–2350: Key rules:
- `ARCH-6.18-P12` — lines 2355–2359: - Markdown is the narrative envelope; - ITM blocks are semantic model sources; - rendered diagrams/tables are derived; - duplicate named model blocks should be rejected unless the syntax explicitly defines overlays/impo…
- `ARCH-6.18-P13` — lines 2365–2365: #### Local image and asset resolution
- `ARCH-6.18-P14` — lines 2370–2370: Markdown rendering must resolve relative image paths through the virtual workspace.
- `ARCH-6.18-P15` — lines 2375–2375: Example:
- `ARCH-6.18-P16` — lines 2380–2383: ```markdown ![Context diagram](assets/context-diagram.svg) ![Screenshot](../images/screenshot.png) ```
- `ARCH-6.18-P17` — lines 2388–2388: Resolution rule:
- `ARCH-6.18-P18` — lines 2393–2395: ```text Markdown file path + relative href -> WorkspaceReferenceResolver -> AssetService -> scoped object URL -> rendered HTML ```
- `ARCH-6.18-P19` — lines 2400–2400: Requirements:
- `ARCH-6.18-P20` — lines 2405–2410: - resolve relative image references from the Markdown file location; - support workspace images imported manually or via ZIP; - support generated SVG/PNG assets stored in workspace; - block or mark unresolved local refe…
- `ARCH-6.18-P21` — lines 2415–2415: #### Diagram asset generation
- `ARCH-6.18-P22` — lines 2420–2420: Generated diagrams should be saveable into the workspace.
- `ARCH-6.18-P23` — lines 2425–2425: Examples:
- `ARCH-6.18-P24` — lines 2430–2435: ```text Markdown Mermaid block -> generated/diagram-001.svg Markdown Graphviz block -> generated/dependency-view.svg ITM viewpoint -> generated/capability-map.svg Generated SVG -> generated/capability-map.png ```
- `ARCH-6.18-P25` — lines 2440–2440: SVG export should preserve the generated vector output. PNG export should rasterize locally, normally by loading the SVG into an image/canvas pipeline and writing the resulting PNG blob back to the workspace or offering…
- `ARCH-6.18-P26` — lines 2445–2445: #### Late-stage Markdown-to-PDF generation
- `ARCH-6.18-P27` — lines 2450–2450: PDF generation from rendered Markdown HTML should be a late capability. It should not block Markdown preview, image embedding, report generation, or SVG/PNG asset export.
- `ARCH-6.18-P28` — lines 2455–2455: Recommended staged approach:
- `ARCH-6.18-P29` — lines 2460–2464: 1. produce print-optimized HTML and CSS; 2. support browser print/save-as-PDF as a user-mediated output path; 3. evaluate client-side PDF generation only after report HTML is stable; 4. store generated PDF into the work…
### §6.19 — Lua runtime service

- `ARCH-6.19-P01` — lines 2471–2471: Responsibilities:
- `ARCH-6.19-P02` — lines 2476–2482: - run Lua snippets/documents/selections; - discover named Lua actions; - expose safe `tf.*` modules; - run in Worker where possible; - enforce limits; - return structured diagnostics and outputs; - integrate with pipeli…
- `ARCH-6.19-P03` — lines 2487–2487: Suggested files:
- `ARCH-6.19-P04` — lines 2492–2509: ```text src/lua/ luaRuntime.ts luaBridge.ts luaWorker.ts luaModules.ts luaTransformService.ts luaScriptRegistry.ts luaActionRegistry.ts luaConsoleService.ts libs/ tf.lua tf_tree.lua tf_graph.lua tf_table.lua tf_itm.lua…
- `ARCH-6.19-P05` — lines 2514–2514: Lua safety rules:
- `ARCH-6.19-P06` — lines 2519–2530: ```text No DOM. No browser globals. No fetch/XMLHttpRequest/WebSocket. No localStorage/indexedDB access from Lua. No io/os/debug libraries. No unrestricted package searchers. No loadfile/dofile. No user-controlled dynam…
### §6.20 — Reusable accreditation harness

- `ARCH-6.20-P01` — lines 2537–2537: The security accreditation harness should be a **reusable browser-envelope checker**, not a TextForge-specific architectural static analyzer.
- `ARCH-6.20-P02` — lines 2542–2542: Purpose:
- `ARCH-6.20-P03` — lines 2547–2550: - verify that the delivered app remains inside the approved secure local-first deployment profile; - check the safeguards that the browser or extension platform enforces; - produce an accreditation evidence package that…
- `ARCH-6.20-P04` — lines 2555–2555: The harness should check:
- `ARCH-6.20-P05` — lines 2560–2594: ```text Deployment envelope: CSP for static/PWA targets extension manifest permissions PWA manifest service-worker pattern final HTML entry points final JavaScript bundles final worker bundles Network and remote code po…
- `ARCH-6.20-P06` — lines 2599–2599: The harness should **not** check:
- `ARCH-6.20-P07` — lines 2604–2611: ```text Whether only WorkspaceStorageGateway touches IndexedDB. Whether only FileGateway uses ordinary user-mediated file input. Whether every TextForge module follows ideal layering. Whether all ITM references are sema…
- `ARCH-6.20-P08` — lines 2616–2616: Those are important engineering and test concerns, but they are not the reusable accreditation boundary. IndexedDB is an allowed browser storage mechanism for the application-private workspace. Ordinary user-mediated fi…
- `ARCH-6.20-P09` — lines 2621–2621: Suggested files:
- `ARCH-6.20-P10` — lines 2626–2645: ```text tools/accreditation/ profile.schema.json profiles/ local-only-manual-file-workspace-webapp.yml one-backend-manual-file-workspace-webapp.yml check.ts checks/ checkCsp.ts checkStaticHtml.ts checkFinalBundles.ts ch…
- `ARCH-6.20-P11` — lines 2650–2650: Recommended npm scripts:
- `ARCH-6.20-P12` — lines 2655–2662: ```json { "scripts": { "verify:envelope": "tsx tools/accreditation/check.ts --profile security/security-profile.yml --target dist", "verify:release": "npm run test && npm run build && npm run verify:envelope" } } ```
- `ARCH-6.20-P13` — lines 2667–2667: The harness may include lightweight source checks as a convenience, but its authoritative role should be artifact and deployment-envelope verification. A release should be assessed against what the browser will actually…
### §6.21 — Resource browser

- `ARCH-6.21-P01` — lines 2674–2674: Responsibilities:
- `ARCH-6.21-P02` — lines 2679–2684: - expose bundled docs/examples; - preview resources; - open resources as editable copies; - copy resource text; - render Markdown resources directly; - include manual test plans and future-feature docs.
- `ARCH-6.21-P03` — lines 2689–2689: Resource groups:
- `ARCH-6.21-P04` — lines 2694–2711: ```text README User manual Security whitepapers ITM specification Lua scripting tutorial Lua console tutorial Markdown examples Mermaid examples Graphviz examples ITM examples BPMN examples Enterprise architecture examp…
### §6.22 — Export/import subsystem

- `ARCH-6.22-P01` — lines 2718–2718: Responsibilities:
- `ARCH-6.22-P02` — lines 2723–2737: - explicit user-triggered import; - explicit user-triggered export; - zip import/export; - SVG export; - PNG export from SVG; - generated SVG/PNG asset storage into workspace; - image/reference-PDF export as workspace f…
- `ARCH-6.22-P03` — lines 2742–2742: Security rules:
- `ARCH-6.22-P04` — lines 2747–2751: - never export automatically; - never overwrite local files silently; - never sync to a local folder; - never preserve absolute host paths in zip exports; - sanitize zip paths on import.
- `ARCH-6.22-P05` — lines 2756–2756: ---
### §7 — UI requirements

- `ARCH-7-P01` — lines 2760–2760: The UI should be a **React workbench of surfaces**, not an editor with popup-only viewers. Components should be selected for good TypeScript types, documented examples, accessibility where practical, and predictable tes…
- `ARCH-7-P02` — lines 2765–2765: Recommended React UI support stack:
- `ARCH-7-P03` — lines 2770–2780: ```text React Arborist workspace tree MainSurfaceHost custom primary surface container PopupSurfaceHost custom floating surface container Floating UI / Radix menus, popovers, dialogs react-resizable-panels shell-level p…
### §7.1 — Security-visible workspace boundary

- `ARCH-7.1-P01` — lines 2787–2787: The UI should make the workspace boundary understandable without turning security into noise. TextForge should say, in user-facing wording, that workspace files are stored inside the browser-managed TextForge workspace…
- `ARCH-7.1-P02` — lines 2792–2792: Required UI cues:
- `ARCH-7.1-P03` — lines 2797–2802: - workspace root clearly labelled as an application workspace, not a live local folder; - import actions labelled as manual import/open/ZIP import; - export actions labelled as manual download/export/ZIP export; - optio…
- `ARCH-7.1-P04` — lines 2807–2807: This is a product requirement, not an accreditation-harness static-analysis requirement.
### §7.2 — Stage 1 main layout

- `ARCH-7.2-P01` — lines 2814–2814: Stage 1 should be the first implementation target. It should support one main surface and optional popup surfaces. The main surface may be CodeMirror, a viewer, a diagnostics surface, a report preview, or a binary-resou…
- `ARCH-7.2-P02` — lines 2819–2830: ```text +--------------------------------------------------------------------------------+ | Top bar: New | Open | Import Zip | Export | Actions | Surface | Diagnostics | +----------------------+------------------------…
- `ARCH-7.2-P03` — lines 2835–2835: Important Stage 1 rules:
- `ARCH-7.2-P04` — lines 2840–2846: ```text Double-clicking a text file may open CodeMirror in the main surface. Double-clicking an image/PDF/SVG may open the matching read-only viewer in the main surface. Pipeline previews may open in the main surface or…
### §7.3 — Stage 2 target: advanced tabbed main surfaces

- `ARCH-7.3-P01` — lines 2853–2853: Stage 2 is the target advanced workbench model, but it should be implemented later in the roadmap after the basic surface abstraction is stable. The roadmap may introduce a narrow Phase 3.1 main-session tab strip earlie…
- `ARCH-7.3-P02` — lines 2858–2858: Stage 2 adds a tabbed main surface group where editors and viewers are peers:
- `ARCH-7.3-P03` — lines 2863–2873: ```text +--------------------------------------------------------------------------------+ | Top bar | +----------------------+---------------------------------------------------------+ | Workspace Explorer | Tabs: [mod…
- `ARCH-7.3-P04` — lines 2878–2878: Tab requirements:
- `ARCH-7.3-P05` — lines 2883–2891: - surface icon or type marker; - resource/file name or derived view title; - dirty marker for editable resources; - stale marker for derived surfaces; - close button; - optional pinned state; - `Open With...`; - `Move t…
- `ARCH-7.3-P06` — lines 2896–2896: Stage 2 should not introduce full split-pane complexity yet. It should simply allow multiple surfaces in the main area.
### §7.4 — Future layout expansions

- `ARCH-7.4-P01` — lines 2903–2903: After Stage 2, the following can be considered:
- `ARCH-7.4-P02` — lines 2908–2912: ```text Stage 3: split panes, open to side, bottom diagnostics/console panel Stage 4: saved layouts and workspace layout restoration Stage 5: detached browser windows or multi-monitor workflows ```
- `ARCH-7.4-P03` — lines 2917–2917: These are intentionally future expansions. The rebuild should design the Surface interfaces so they are possible, but should not require them for the first rebuild.
### §7.5 — Workspace explorer UI

- `ARCH-7.5-P01` — lines 2924–2924: Use React Arborist for:
- `ARCH-7.5-P02` — lines 2929–2939: - folders/files; - expand/collapse; - rename; - drag/drop move; - context menu; - multi-select if needed; - open on click/double click; - dirty indicators; - generated/stale indicators; - language/resource icons; - docu…
- `ARCH-7.5-P03` — lines 2944–2944: Required context menu actions:
- `ARCH-7.5-P04` — lines 2949–2964: ```text New File New Folder Rename Duplicate Move Delete Import Files Import Zip Here Export Folder as Zip Download File Open With... Open in Main Surface Open as Popup Copy Path ```
### §7.6 — Binary resource UI

- `ARCH-7.6-P01` — lines 2971–2971: The workspace explorer should show read-only binary resources distinctly from editable text files.
- `ARCH-7.6-P02` — lines 2976–2976: Required UI behavior:
- `ARCH-7.6-P03` — lines 2981–2988: ```text Image file double-click -> open ImageViewerSurface, preferably in main surface SVG double-click -> open SvgViewerSurface, with optional source mode PDF double-click -> open PdfViewerSurface Unsupported binary fi…
- `ARCH-7.6-P04` — lines 2993–2993: Surface toolbar requirements:
- `ARCH-7.6-P05` — lines 2998–3003: ```text Images/SVGs: zoom, fit, copy path, export/download, reveal in workspace SVGs: export as SVG, rasterize/store as PNG PDFs: page navigation, zoom, search if supported, download/export, reveal in workspace Generate…
- `ARCH-7.6-P06` — lines 3008–3008: The UI should avoid suggesting that PDFs and raster images are editable source files. They are workspace resources, references, or generated artifacts.
### §7.7 — Surface chrome

- `ARCH-7.7-P01` — lines 3015–3015: All surfaces should share a common outer chrome where practical.
- `ARCH-7.7-P02` — lines 3020–3020: Common controls:
- `ARCH-7.7-P03` — lines 3025–3039: ```text Title / resource path / view title Surface type Dirty marker Stale/current marker Refresh, if derived Open source / reveal in workspace Open With... Move to main Open as popup Export/download, if supported Searc…
- `ARCH-7.7-P04` — lines 3044–3044: The chrome should adapt to capability flags. For example, a PDF surface shows page/zoom controls, while a CodeMirror surface shows editor actions and a generated report surface shows refresh/export/print controls.
### §7.8 — Diagnostics UI

- `ARCH-7.8-P01` — lines 3051–3051: Diagnostics should be available both as a popup and as a main surface.
- `ARCH-7.8-P02` — lines 3056–3056: Diagnostics button should indicate attention when any of these exist:
- `ARCH-7.8-P03` — lines 3061–3066: - document diagnostics; - plugin conflicts; - security verification failures; - pipeline failures; - Lua runtime errors; - workspace import warnings.
- `ARCH-7.8-P04` — lines 3071–3071: Diagnostics view should support grouping by:
- `ARCH-7.8-P05` — lines 3076–3083: ```text Document Severity Source Pipeline Plugin Security check ```
### §7.9 — Plugin manager UI

- `ARCH-7.9-P01` — lines 3090–3090: The plugin manager can initially be a popup or dialog, but should later be usable as a main surface if it grows.
- `ARCH-7.9-P02` — lines 3095–3095: Must show:
- `ARCH-7.9-P03` — lines 3100–3108: - packaged plugins; - loaded/failed status; - contribution list; - surface contributions; - pipelines; - enabled/disabled pipeline state; - conflicts; - user override selection; - persisted preferences.
- `ARCH-7.9-P04` — lines 3113–3113: Pipeline conflicts must be visible and resolvable by the user.
### §7.10 — Lua console UI

- `ARCH-7.10-P01` — lines 3120–3120: The Lua console should be a surface, not a special case. It can open in the main area or popup.
- `ARCH-7.10-P02` — lines 3125–3125: Can use xterm.js if a terminal-like interaction is desired.
- `ARCH-7.10-P03` — lines 3130–3130: Required actions:
- `ARCH-7.10-P04` — lines 3135–3141: - run current Lua document; - run selection; - run snippet; - list actions; - inspect last result; - open last result as document or surface; - show diagnostics.
- `ARCH-7.10-P05` — lines 3146–3146: ---
### §8 — Relationships between modules

- `ARCH-8-P01` — lines 3150–3188: ```mermaid flowchart TD AppShell --> WorkspaceManager AppShell --> PluginRegistry AppShell --> PipelineRunner AppShell --> PopupManager AppShell --> DiagnosticsService AppShell --> ResourceBrowser WorkspaceManager --> S…
- `ARCH-8-P02` — lines 3193–3193: ---
### §9 — Repository pivot and preservation strategy

- `ARCH-9-P01` — lines 3198–3198: TextForge should keep its existing repository name and Git history while moving to the modular rebuild. The pivot should be explicit, reversible, and easy for coding agents to understand.
- `ARCH-9-P02` — lines 3203–3203: The recommended approach is:
- `ARCH-9-P03` — lines 3208–3216: ```text 1. Preserve the current implementation with tag `textforge-v1-final`. 2. Preserve the same point with archival branch `archive/v1-current`. 3. Create `rewrite/v2-monorepo` for the modular greenfield rebuild. 4.…
- `ARCH-9-P04` — lines 3221–3221: This avoids a separate `TextForge2` repository while avoiding a confusing side-by-side codebase. The old implementation remains available through normal Git history, the archival branch, and the final tag. The new imple…
### §10 — Companion roadmap set and authority split

- `ARCH-10-P01` — lines 3228–3228: The implementation roadmap is deliberately separated from this main architecture paper. This document defines the target architecture, invariants, security posture, surface model, and long-lived design rules. The compan…
- `ARCH-10-P02` — lines 3233–3233: Use the roadmap set as follows:
- `ARCH-10-P03` — lines 3238–3253: ```text roadmap/AGENTS_START_HERE.md First operational instructions for every coding agent run. roadmap/00_package_aware_roadmap.md Authoritative phase order, including the runnable-shell checkpoint and package-by-packa…
- `ARCH-10-P04` — lines 3258–3258: When this whitepaper and the roadmap set overlap, the roadmap set is authoritative for implementation sequencing and package rollout. The correct fix for drift is to update or reduce the duplicate implementation text he…
### §11.1 — Unit tests

- `ARCH-11.1-P01` — lines 3268–3268: Required:
- `ARCH-11.1-P02` — lines 3273–3283: - workspace path normalization; - document versioning; - Dexie migrations; - zip path sanitizer; - plugin conflict handling; - pipeline runner sequencing; - diagnostics merge/grouping; - ITM resolver adapter; - Markdown…
### §11.2 — Parser/model tests

- `ARCH-11.2-P01` — lines 3290–3290: Required:
- `ARCH-11.2-P02` — lines 3295–3307: - ITM include resolution from workspace; - missing include diagnostics; - circular include diagnostics; - duplicate ID / overlay behavior; - namespaces with `::` and typed links with `:`; - multiline directives; - descr…
### §11.3 — UI tests

- `ARCH-11.3-P01` — lines 3314–3314: Required:
- `ARCH-11.3-P02` — lines 3319–3328: - create/rename/delete/move in workspace tree; - tab reorder; - stale popup state; - diagnostics attention indicators; - plugin conflict UI; - viewer popup controls; - Markdown embedded diagram popout; - source/view cli…
### §11.4 — Security and accreditation tests

- `ARCH-11.4-P01` — lines 3335–3335: Security tests should be split into two groups.
### §11.4.1 — Reusable accreditation-envelope checks

- `ARCH-11.4.1-P01` — lines 3342–3342: These are application-independent checks that can be reused across secure local-first web apps:
- `ARCH-11.4.1-P02` — lines 3347–3375: ```text CSP/static target: no unapproved connect-src no remote scripts/modules/workers no CDN runtime assets no object/embed escape path Extension target: no broad host permissions no <all_urls> no file:// access no nat…
- `ARCH-11.4.1-P03` — lines 3380–3380: These checks support accreditation because they verify browser-enforced safeguards and privileged browser API absence.
### §11.4.2 — TextForge project security tests

- `ARCH-11.4.2-P01` — lines 3387–3387: These are ordinary project tests. They are useful, but they should not be confused with the reusable accreditation harness:
- `ARCH-11.4.2-P02` — lines 3392–3399: ```text Lua cannot access DOM/network/filesystem/browser globals. Lua cannot use forbidden libraries such as io/os/debug/loadfile/dofile. Zip import rejects path traversal and absolute paths. Workspace import/export rou…
- `ARCH-11.4.2-P03` — lines 3404–3404: The distinction matters. The reusable harness verifies the accredited browser envelope. TextForge tests verify that TextForge's own features are implemented well.
### §11.5 — Golden-output tests

- `ARCH-11.5-P01` — lines 3411–3411: Required:
- `ARCH-11.5-P02` — lines 3416–3429: - Markdown preview fixtures; - Markdown image-reference fixtures; - generated SVG fixtures; - generated PNG smoke fixtures where stable; - print-optimized HTML report fixtures; - ITM parse fixtures; - ITM-to-graph fixtu…
- `ARCH-11.5-P03` — lines 3434–3434: ---
### §12 — Files and documents to preserve, migrate, or recreate

- `ARCH-12-P01` — lines 3438–3438: The rebuild should maintain the following source-of-truth documents or their updated equivalents.
### §12.1 — Product and architecture documents

- `ARCH-12.1-P01` — lines 3445–3453: | File | Preserve as | Reason | |---|---|---| | `README.md` | top-level product README | Captures current user-facing scope, local-first posture, supported formats, Lua pivot, resource browser, and build targets. | | `S…
### §12.2 — Format specifications

- `ARCH-12.2-P01` — lines 3460–3465: | File | Preserve as | Reason | |---|---|---| | `indented_text_model_format_description_updated.md` | ITM specification | Required canonical model spec. | | `docs/itm-tree-style-support.md` | viewer style support refere…
### §12.3 — User-facing resources

- `ARCH-12.3-P01` — lines 3472–3488: | File/group | Preserve as | Reason | |---|---|---| | User manual | bundled resource | Required for offline documentation. | | Lua scripting tutorial | bundled resource | Required for user automation. | | Lua console tu…
### §12.4 — Code assets to preserve conceptually

- `ARCH-12.4-P01` — lines 3495–3495: Even in a full rewrite, preserve these conceptual assets:
- `ARCH-12.4-P02` — lines 3500–3512: | Existing or intended asset | Preserve concept | |---|---| | CodeMirror setup | editor extension model, language switching, lint surface | | popup host | source-aware, stale-aware viewer windows | | plugin registry | t…
- `ARCH-12.4-P03` — lines 3517–3517: ---
### §12.5 — Security whitepaper integration notes

- `ARCH-12.5-P01` — lines 3521–3521: When maintaining this rebuild document, preserve the distinction from the secure webapp accreditation whitepaper:
- `ARCH-12.5-P02` — lines 3526–3531: - the application-private workspace is allowed and can be persisted in IndexedDB; - the workspace is not a live local filesystem mirror; - local file exchange is manual import/export, including ZIP import/export for fol…
### §13 — Coding-agent implementation guidance

- `ARCH-13-P01` — lines 3538–3538: This section records architecture-level guardrails for implementation work. Operational run instructions, current phase control, and repository-state handling belong to the roadmap set and RAPID log, not to this whitepa…
### §13.1 — General rules for the coding agent

- `ARCH-13.1-P01` — lines 3545–3559: 1. Do not introduce app-code network access. 2. Do not introduce File System Access API. 3. Do not introduce user-provided JavaScript plugin execution. 4. Do not make viewers own canonical models. 5. Do not silently ove…
### §13.2 — Preferred folder structure

- `ARCH-13.2-P01` — lines 3566–3583: ```text src/ app/ workspace/ storage/ security/ domain/ languages/ plugins/ pipelines/ itm/ markdown/ lua/ viewers/ resources/ export/ tests/ ```
### §13.3 — Implementation sequencing authority

- `ARCH-13.3-P01` — lines 3590–3590: This whitepaper must not maintain its own phase summary, phase-number mapping, or package rollout checklist. Those details change more frequently than the architectural doctrine in this paper and are therefore owned by…
- `ARCH-13.3-P02` — lines 3595–3595: For implementation sequencing, always use:
- `ARCH-13.3-P03` — lines 3600–3603: - `roadmap/00_package_aware_roadmap.md` for the authoritative phase order. - `roadmap/01_repository_and_package_strategy.md` for runnable-shell and repository-boundary rules. - `roadmap/packages/*.md` for package-specif…
- `ARCH-13.3-P04` — lines 3608–3608: When updating this whitepaper, keep only the architecture-level statements that remain valid across multiple roadmap revisions. If a change affects phase order, package creation timing, or current work sequencing, updat…
### §13.4 — Cross-document maintenance rule

- `ARCH-13.4-P01` — lines 3615–3615: If the whitepaper and the roadmap set ever diverge again, treat that as documentation drift:
- `ARCH-13.4-P02` — lines 3620–3623: 1. keep the architectural target state here; 2. keep implementation order and current phase control in the roadmap set; 3. remove or shorten duplicated implementation guidance in this whitepaper; 4. record the correctio…
- `ARCH-13.4-P03` — lines 3628–3628: ---
### §13.8 — Binary-resource and export completeness requirements

- `ARCH-13.8-P01` — lines 3633–3633: The Surface-based workbench architecture must not remove the resource and export requirements. The following items remain mandatory:
- `ARCH-13.8-P02` — lines 3638–3651: ```text Read-only binary workspace resources are first-class workspace files. Images can be imported, viewed, embedded in Markdown, and resolved through workspace-relative paths. Reference PDFs can be imported and opene…
- `ARCH-13.8-P03` — lines 3656–3656: The Surface architecture strengthens these requirements because images, SVGs, PDFs, and generated report previews become peer surfaces rather than popup-only side effects.
### §14 — Definition of done

- `ARCH-14-P01` — lines 3663–3663: The rebuild is successful when:
- `ARCH-14-P02` — lines 3668–3685: 1. A user can maintain a multi-folder virtual workspace entirely in the browser. 2. The workspace persists in IndexedDB and can be manually imported/exported as zip. 3. No feature silently reads or writes local files. 4…
- `ARCH-14-P03` — lines 3690–3690: ---
### §14.1 — Editor-specific definition of done

- `ARCH-14.1-P01` — lines 3694–3694: An editor contribution is done only when:
- `ARCH-14.1-P02` — lines 3699–3708: 1. it is registered as a Surface contribution; 2. it declares whether it is source, rich-text, table, diagram, model, annotation, or hybrid; 3. it declares the canonical resource format it edits; 4. it has a source-edit…
### §15 — Final architectural position

- `ARCH-15-P01` — lines 3715–3715: The rebuilt TextForge should be deliberately narrow in its security claim, React-based in its implementation posture, and deliberately broad in its structured-text usefulness.
- `ARCH-15-P02` — lines 3720–3720: It should not claim to protect users from every malicious transformation. A Lua script or built-in transformation can still damage the text the user chooses to process. The stronger and more defensible claim is:
- `ARCH-15-P03` — lines 3725–3725: > TextForge runs inside a browser-enforced local-first security envelope: no unapproved network egress, no remote code loading, no privileged silent local filesystem access, an application-private workspace, and manual…
- `ARCH-15-P04` — lines 3730–3730: That claim is compatible with powerful local authoring, binary workspace resources, local image embedding, generated SVG/PNG assets, model transformation, enterprise architecture modelling, ArchiMate viewpoints, graph v…
- `ARCH-15-P05` — lines 3735–3735: The result is not just an editor. It is a local, inspectable, accreditation-friendly workbench for text-based digital engineering artifacts, including enterprise architecture and process-modelling assets, where richer e…
