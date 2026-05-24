# Phase Architecture References and pnpm Package Install Matrix

This matrix is the consolidated implementation dependency companion to `00_package_aware_roadmap.md`. It makes two things explicit for every phase:

1. the exact architecture paragraphs/blocks that must be considered;
2. the pnpm workspace or third-party packages that should be installed for each package touched in that phase.

Architecture anchors resolve through `02_architecture_paragraph_reference_index.md`. Commands omit pinned versions by default so the lockfile, license gate, and RAPID log remain the control points for actual resolved versions.

## Phase -1 — Repository pivot and archival preservation

Architecture paragraphs: `ARCH-9-P01..P04`, `ARCH-10-P01..P04`, `ARCH-12.1-P01`, `ARCH-13.2-P01`, `ARCH-13.3-P01..P04`, `ARCH-13.4-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| workspace root | Create pnpm workspace metadata; install root dev tooling only. | `corepack enable`; `pnpm init`; `pnpm add -D -w typescript vitest eslint prettier @changesets/cli` |
| `apps/textforge-web` | Create placeholder app package only; no React/Vite app dependency decision is made here unless the runnable-shell slice is also executed. | `pnpm --filter ./apps/textforge-web add -D vite typescript vitest` |
| `packages/*` placeholders | Create package manifests and scripts; do not add feature libraries yet. | No package-specific install beyond root tooling. |

## Phase 0 — Repository foundation, package skeleton, security envelope, and dependency policy

Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.1-P01..P05`, `ARCH-6.17-P01..P04`, `ARCH-6.20-P01..P07`, `ARCH-10-P01..P04`, `ARCH-11.4-P01`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Core contract package; keep runtime dependencies empty unless implementation proves otherwise. | `pnpm --filter @textforge/core add -D typescript vitest` |
| `@textforge/security-profile` | Security profile package consuming core diagnostics/contracts; static license tooling remains dev-only. | `pnpm --filter @textforge/security-profile add @textforge/core@workspace:*`; optional scan tooling: `pnpm --filter @textforge/security-profile add -D license-checker-rseidelsohn` |
| `@textforge/ui` | Initial dependency-light UI contracts and tokens. | `pnpm --filter @textforge/ui add @textforge/core@workspace:*` |
| `@textforge/examples-docs` | Docs/examples package, using core conventions only. | `pnpm --filter @textforge/examples-docs add @textforge/core@workspace:*` |
| `roadmap/` | Documentation-only update. | No pnpm package install. |

## Phase 1 — Workspace and Stage 1 surface skeleton

Architecture paragraphs: `ARCH-4.1-P01..P02`, `ARCH-4.2-P01..P03`, `ARCH-4.3-P01..P07`, `ARCH-5.2-P01..P06`, `ARCH-5.3-P01..P05`, `ARCH-5.6-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.2-P01..P04`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.15-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.6-P01..P06`, `ARCH-7.7-P01..P04`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | Workspace contracts and in-memory service; Dexie and fflate stay for later phases. | `pnpm --filter @textforge/workspace add @textforge/core@workspace:*` |
| `@textforge/surfaces` | Surface registry/session/host contracts. | `pnpm --filter @textforge/surfaces add @textforge/core@workspace:* @textforge/ui@workspace:*` |
| `@textforge/ui` | Workspace/surface frame primitives; keep third-party UI libraries out until React recovery. | No new external package. Keep `@textforge/core@workspace:*`; pass workspace/surface data through typed props unless a deliberate package-dependency change is recorded. |
| `@textforge/editors` | CodeMirror source surface. | `pnpm --filter @textforge/editors add @textforge/core@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/search` |
| `@textforge/assets` | Read-only image/SVG/PDF/binary viewers and blob URL lifecycle. | `pnpm --filter @textforge/assets add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* pdfjs-dist` |

## Phase 2 — Source-editor coverage and language foundation

Architecture paragraphs: `ARCH-5.6-P01..P04`, `ARCH-6.6-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Language IDs, editor capability IDs, diagnostics bridge. | No new package install. |
| `@textforge/surfaces` | Open-with selection and source-editor fallback indicators. | No new package install. |
| `@textforge/editors` | Language packs and lint support for source editors. | `pnpm --filter @textforge/editors add @codemirror/lang-markdown @codemirror/lang-json @codemirror/lang-xml @codemirror/lang-yaml @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript @codemirror/legacy-modes @codemirror/lint` |

## Phase 3 — ZIP workspace import/export

Architecture paragraphs: `ARCH-5.9-P01..P05`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | ZIP import/export and manifest support. | `pnpm --filter @textforge/workspace add fflate` |
| `@textforge/security-profile` | Archive-boundary and forbidden-file-API checks. | No new package install unless scan implementation needs dev-only parser tooling; record any added tool in RAPID. |
| `@textforge/assets` | Binary ZIP round-trip validation. | No new package install. |

## Phase 3.1 — React workbench shell and UI recovery

Architecture paragraphs: `ARCH-5.1-P01..P06`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.5-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `apps/textforge-web` | React-rendered app shell and Vite React wiring. | `pnpm --filter ./apps/textforge-web add react react-dom`; `pnpm --filter ./apps/textforge-web add -D @vitejs/plugin-react @types/react @types/react-dom` |
| `@textforge/ui` | Real React workbench primitives and workspace tree component. | `pnpm --filter @textforge/ui add react react-dom react-arborist`; `pnpm --filter @textforge/ui add -D @types/react @types/react-dom` |
| `@textforge/surfaces` | React-consumable host props/state adapters. | `pnpm --filter @textforge/surfaces add react react-dom`; `pnpm --filter @textforge/surfaces add -D @types/react @types/react-dom` |
| `@textforge/editors` | React-shell mounting validation for CodeMirror surfaces. | `pnpm --filter @textforge/editors add react react-dom`; `pnpm --filter @textforge/editors add -D @types/react @types/react-dom` |
| `@textforge/assets` | React-shell mounting validation for asset viewers. | `pnpm --filter @textforge/assets add react react-dom`; `pnpm --filter @textforge/assets add -D @types/react @types/react-dom` |
| `@textforge/security-profile` | Dependency/license and runnable-artifact checks after React adoption. | No new runtime package install. |

## Phase 3.2 — Dexie workspace persistence recovery

Architecture paragraphs: `ARCH-5.8-P01..P05`, `ARCH-6.2-P01..P04`, `ARCH-6.4-P01..P04`, `ARCH-7.1-P01..P04`, `ARCH-11.1-P01..P02`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` | Dexie runtime persistence and migration stores. | `pnpm --filter @textforge/workspace add dexie` |
| `apps/textforge-web` | Hydrate persisted workspace at startup. | No new package install. |
| `@textforge/ui` | Storage/reset/recovery cues only. | No new package install. |
| `@textforge/assets` | Binary rehydration validation through workspace service. | No new package install. |
| `@textforge/security-profile` | Browser-managed storage boundary checks. | No new package install. |

## Phase 3.3 — Command palette and contribution-driven shell commands

Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Minimal shell-command substrate. | No new package install. |
| `@textforge/ui` | Command palette/menu/toolbar slots. | No new package install by default; add a palette library only through an explicit RAPID decision. |
| `@textforge/workspace` | Expose existing workspace actions as command contributions. | No new package install. |
| `@textforge/surfaces` | Expose existing surface actions as command contributions. | No new package install. |
| `@textforge/editors` | Expose existing editor actions as command contributions. | No new package install. |
| `@textforge/assets` | Expose existing asset viewer actions as command contributions. | No new package install. |
| `apps/textforge-web` | Compose package commands in shell. | No new package install. |

## Phase 3.4 — Resource identity badges and workbench readability pass

Architecture paragraphs: `ARCH-5.7-P04`, `ARCH-6.1-P01..P05`, `ARCH-6.4-P02`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P08`, `ARCH-7.3-P05`, `ARCH-7.5-P02`, `ARCH-7.7-P01..P04`, `ARCH-12.4-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Shared badge/resource identity contracts only if required. | No new package install. |
| `@textforge/workspace` | Deterministic badge identity, collision repair, persisted badge metadata, and import/restore uniqueness validation. | No new package install. |
| `@textforge/ui` | Badge primitives plus overflow-safe layout, compact chrome, grouped command/menu, utility drawer, inspector, active-state, empty-state components, and bundled `lucide-react` shell icons. | `pnpm --filter @textforge/ui add lucide-react` |
| `@textforge/surfaces` | Badge metadata projection into surface sessions and tab/header chrome; common chrome state display. | No new package install. |
| `@textforge/editors` | Text-editor fit/readability validation after shell layout cleanup. | No new package install. |
| `@textforge/assets` | Asset-viewer fit/readability validation after shell layout cleanup. | No new package install. |
| `apps/textforge-web` | Integrated readability pass: no global horizontal scroll, compact header/status area, calmer command surface, stable utility drawer, clearer tree/tabs/editor/inspector, badges, active-resource highlighting, and small empty/error/help states. Use `@textforge/ui` icon-bearing components rather than adding a second icon library. | No new package install. |
| `@textforge/security-profile` | Local deterministic rendering and browser-boundary checks; no remote icon/image loading or filesystem identity. | No new package install. |
| `@textforge/examples-docs` | Badge/readability style note, fixtures, and collision-repair examples. | No new package install. |

## Phase 4 — Markdown, local assets, and generated diagram assets

Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/pipeline` | Minimal pipeline contribution registry/runner. | `pnpm --filter @textforge/pipeline add @textforge/core@workspace:* @textforge/workspace@workspace:*` |
| `@textforge/markdown` | markdown-it preview and local asset resolution. | `pnpm --filter @textforge/markdown add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* markdown-it markdown-it-anchor markdown-it-footnote markdown-it-katex katex` |
| `@textforge/diagrams` | Mermaid and Graphviz rendering pipelines. | `pnpm --filter @textforge/diagrams add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* mermaid @viz-js/viz` |
| `@textforge/assets` | Generated asset provenance/stale display. | No new package install. |

## Phase 5 — Contribution registries and package composition

Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Full contribution-pack manifests and dependency/capability declarations. | No new package install. |
| `@textforge/surfaces` | Package-provided surface registration. | No new package install. |
| `@textforge/pipeline` | Step contribution loading, diagnostics aggregation, intermediate reopening. | No new package install. |
| `@textforge/ui` | Feature package status and diagnostics/package-composition feedback. | No new package install. |

## Phase 6 — ITM integration and model/report foundation

Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Parser/serializer/resolver/selectors/styles/views/rules. | `pnpm --filter @textforge/itm add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/pipeline@workspace:* yaml` |
| `@textforge/pipeline` | ITM model value and transformation step contracts. | No new package install. |
| `@textforge/markdown` | Embedded ITM publication/report fragments. | `pnpm --filter @textforge/markdown add @textforge/itm@workspace:*` |

## Phase 7 — ITM visual projections

Architecture paragraphs: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Projection APIs and generated asset provenance. | No new package install. |
| `@textforge/diagrams` | ITM-to-graph/mindmap adapters and viewers. | `pnpm --filter @textforge/diagrams add cytoscape graphology sigma jsmind` |

## Phase 8 — Lua automation

Architecture paragraphs: `ARCH-5.15-P01..P04`, `ARCH-6.19-P01..P06`, `ARCH-7.10-P01..P05`, `ARCH-11.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/lua` | Restricted Fengari runtime, API allow-list, Lua console surface. | `pnpm --filter @textforge/lua add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* fengari` |
| `@textforge/pipeline` | Lua script pipeline step type. | No new package install. |

## Phase 9 — Markdown + ITM report generation

Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/markdown` | AST-level report pipeline. | `pnpm --filter @textforge/markdown add unified remark-parse remark-rehype rehype-stringify rehype-sanitize rehype-slug rehype-autolink-headings unist-util-visit` |
| `@textforge/itm` | Report fragment model integration. | No new package install. |
| `@textforge/diagrams` | Report asset embedding integration. | No new package install. |

## Phase 10 — BPMN support and first mature visual editor

Architecture paragraphs: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/bpmn` | BPMN XML support, bpmn-js viewer/modeler, controlled write-back. | `pnpm --filter @textforge/bpmn add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/editors@workspace:* @textforge/itm@workspace:* bpmn-js bpmn-moddle` |

## Phase 11 — Tables, catalogues, and matrices

Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/tables` | Semantic table surfaces, CSV/TSV grid, catalogue/matrix abstractions. | `pnpm --filter @textforge/tables add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @textforge/itm@workspace:* @tanstack/react-table` |
| `@textforge/bpmn` | Optional BPMN catalogues. | No new package install. |

## Phase 12 — Enterprise architecture and ArchiMate foundation

Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-6.18-P08..P12`, `ARCH-11.2-P01..P02`, `ARCH-11.5-P01..P03`, `ARCH-12.2-P01`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/archimate` | ArchiMate ITM profile, exchange XML import/export, EA catalogues/matrices. | `pnpm --filter @textforge/archimate add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/itm@workspace:* @textforge/tables@workspace:* @textforge/markdown@workspace:* fast-xml-parser` |
| `@textforge/markdown` | EA report blocks. | No new package install. |
| `@textforge/tables` | Reusable EA catalogue/matrix editors. | No new package install. |

## Phase 13 — Stage 2 advanced tabbed main surfaces

Architecture paragraphs: `ARCH-5.2-P04..P06`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.3-P01..P06`, `ARCH-7.4-P01..P03`, `ARCH-11.3-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/surfaces` | Advanced placement/session model. | No new package install. |
| `@textforge/ui` | Advanced tab chrome, movement affordances, group-aware keyboard navigation. | `pnpm --filter @textforge/ui add react-resizable-panels @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| `@textforge/core` | Stable session persistence types if needed. | No new package install. |

## Phase 14 — Rich Markdown editing, optional and round-trip gated

Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.12-P01..P05`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/editors` | Rich-editor capability conventions and unsupported-construct diagnostics. | No new package install. |
| `@textforge/markdown` | Milkdown rich Markdown surface behind feature flag. | `pnpm --filter @textforge/markdown add @milkdown/kit @milkdown/react` |

## Phase 15 — Controlled graph, diagram, and pipeline editors

Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/pipeline` | Visual pipeline editor schema and controlled write-back patches. | No new package install. |
| `@textforge/itm` | Small-subgraph patch contracts and view-layout deltas. | No new package install. |
| `@textforge/diagrams` | Controlled graph/flowchart editor adapter. | `pnpm --filter @textforge/diagrams add @xyflow/react` |

## Phase 16 — ArchiMate visual editing investigation

Architecture paragraphs: `ARCH-5.14-P01..P08`, `ARCH-6.10-P01..P13`, `ARCH-5.4-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/security-profile` | Dependency/license review for any ArchiMate visual library. | No package install by default; record investigation result before adding anything. |
| `@textforge/archimate` | Experimental ArchiMate visual editor or React Flow fallback. | Candidate only: `pnpm --filter @textforge/archimate add archimate-js` if the investigation accepts it; otherwise use existing `@xyflow/react` through the diagrams fallback path. |

## Phase 17 — Sketch and annotation resources

Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-5.11-P01..P09`, `ARCH-6.5-P01..P07`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/assets` | Excalidraw sketch/annotation resource surface. | `pnpm --filter @textforge/assets add @excalidraw/excalidraw` |
| `@textforge/markdown` | Sketch asset insertion in reports. | No new package install. |

## Phase 18 — Late PDF generation and PDF annotation

Architecture paragraphs: `ARCH-5.11-P05..P09`, `ARCH-6.18-P26..P29`, `ARCH-6.22-P01..P04`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/assets` | Optional PDF annotation layer over PDF.js. | No new package install if implemented over existing `pdfjs-dist`; add annotation helper packages only after a RAPID decision. |
| `@textforge/markdown` | Evaluate local Markdown/HTML-to-PDF generation. | No new package install by default; prefer browser print/save-as-PDF until a reliable client-side package is selected. |

## Phase 19 — Release-envelope verification and accreditation evidence

Architecture paragraphs: `ARCH-3.1-P01..P03`, `ARCH-3.2-P01..P03`, `ARCH-3.3-P01..P03`, `ARCH-5.5-P01..P09`, `ARCH-6.20-P01..P07`, `ARCH-11.4-P01`, `ARCH-14-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/security-profile` | Finalize reusable browser-envelope checks and evidence artifacts. | No new package install by default; any additional scanner must pass the license gate and be recorded in RAPID. |
| `@textforge/examples-docs` | Release checklist, sample artifacts, tutorial workspace. | No new package install. |
