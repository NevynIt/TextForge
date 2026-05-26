# Phase Architecture References and pnpm Package Install Matrix — V16

This matrix is the consolidated implementation dependency companion to `00_package_aware_roadmap.md`. It makes two things explicit for every phase:

1. the exact architecture paragraphs/blocks that must be considered;
2. the pnpm workspace or third-party packages that should be installed for each package touched in that phase.

Architecture anchors resolve through `02_architecture_paragraph_reference_index.md`. Commands omit pinned versions by default so the lockfile, license gate, and RAPID log remain the control points for actual resolved versions.


## V16 backend-optional reference rule

Backend-related sub-phases use `roadmap/textforge_backend_optional_architecture_whitepaper.md` and `roadmap/grilling/backend-grilling.md` as architecture references in addition to the original `ARCH-*` anchors. These phases preserve existing phase numbering and add explicit package/dependency actions without replacing Phase 5 contribution/capability work.

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

## Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass

Architecture paragraphs: `ARCH-4-P04..P06`, `ARCH-5.1-P03`, `ARCH-5.2-P01..P06`, `ARCH-6.1-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.3-P01..P05`, `ARCH-7.7-P01..P04`, `ARCH-11.3-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | No new core dependency; consume existing placement/session contracts unless a tiny shared type is unavoidable. | No new package install. |
| `@textforge/surfaces` | Popup placement/session behavior and popup/main separation. | No new package install. |
| `@textforge/ui` | Popup overlay host, resizable side panels, chrome deduplication primitives, and screenshot-review helpers. | `pnpm --filter @textforge/ui add react-resizable-panels` |
| `@textforge/editors` | Editor fit/readability validation inside resized/collapsed shell regions. | No new package install. |
| `@textforge/assets` | Viewer fit/readability validation inside resized/collapsed shell regions. | No new package install. |
| `apps/textforge-web` | Integrate real popups, bounded panel resizing, deduplicated document chrome, and screenshot checks. | No new package install. |
| `@textforge/security-profile` | Verify popup/resize state stays local and does not introduce browser-window, permission, network, sync, or filesystem changes. | No new package install. |
| `@textforge/examples-docs` | Screenshot-based validation checklist and evidence guidance. | No new package install. |

## Phase 3.6 — Unified workspace resources and representation-based surface routing

Architecture paragraphs: `ARCH-5.2-P01..P06`, `ARCH-5.9-P01..P05`, `ARCH-5.11-P01..P09`, `ARCH-6.3-P01..P05`, `ARCH-6.5-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.12-P01..P05`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-6.22-P01..P04`, `ARCH-11.3-P01..P02`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Minimal content/representation contracts; remove/deprecate `text`/`binary` as resource-kind ontology. | No new package install. |
| `@textforge/workspace` | Unified resource model, Dexie/archive compatibility migration, safer import classification, SVG-as-text handling. | No new package install. |
| `@textforge/surfaces` | Representation/MIME/language/path compatibility predicates for open-with routing. | No new package install. |
| `@textforge/editors` | Text-representation source-editor compatibility and SVG source editing. | No new package install. |
| `@textforge/assets` | Image/SVG/PDF viewer compatibility for supported text/byte representations; SVG visual preview from text. | No new package install. |
| `@textforge/ui` | Resource/open-with labels and inspector wording that avoid text/binary taxonomy. | No new package install. |
| `apps/textforge-web` | Integrate unified resources, import classification, open-with routing, and placement defaults. | No new package install. |
| `@textforge/security-profile` | Verify no new filesystem, remote sniffing, permission, or sync behavior. | No new package install. |
| `@textforge/examples-docs` | Add fixtures/guidance for SVG text storage, opaque byte assets, archive migration, and open-with behavior. | No new package install. |

## Phase 3.7 — Context menus as thin command projections

Architecture paragraphs: `ARCH-6.1-P01..P05`, `ARCH-6.7-P01..P07`, `ARCH-6.11-P01..P07`, `ARCH-6.13-P01..P05`, `ARCH-6.14-P01..P06`, `ARCH-7.2-P01..P04`, `ARCH-7.7-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-11.3-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Minimal target-aware command context if existing selection/active-surface context is insufficient. | No new package install. |
| `@textforge/ui` | Accessible context-menu primitive that renders existing resolved commands. | No new package install by default. |
| `@textforge/workspace` | Reuse workspace command contributions for tree context menus with target context. | No new package install. |
| `@textforge/surfaces` | Reuse surface/session command contributions for tab and popup context menus with target context. | No new package install. |
| `@textforge/editors` | Reuse existing editor commands where valid for target text resources. | No new package install. |
| `@textforge/assets` | Reuse asset/open-with/download commands where valid for target resources. | No new package install. |
| `apps/textforge-web` | Wire workspace tree, main tab, and popup/session context menus through the command dispatcher. | No new package install. |
| `@textforge/security-profile` | Verify context menus remain local UI affordances with no new browser permissions or native shell integration. | No new package install. |
| `@textforge/examples-docs` | Document expected context-menu behavior and usage notes. | No new package install. |

## Phase 4 — Markdown, local assets, and generated diagram assets

Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.8-P01..P06`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/pipeline` | Minimal pipeline contribution registry/runner. | `pnpm --filter @textforge/pipeline add @textforge/core@workspace:* @textforge/workspace@workspace:*` |
| `@textforge/markdown` | TF-MD Level 1/2 baseline, markdown-it preview, diagnostics, and local asset resolution. | `pnpm --filter @textforge/markdown add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* markdown-it markdown-it-anchor markdown-it-footnote markdown-it-katex katex` |
| `@textforge/diagrams` | Mermaid and Graphviz rendering pipelines. | `pnpm --filter @textforge/diagrams add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/assets@workspace:* mermaid @viz-js/viz` |
| `@textforge/assets` | Generated asset provenance/stale display. | No new package install. |

## Phase 4.1 — Foundation stabilization before contribution registries

Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-5.11-P01..P09`, `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-6.22-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`, `ARCH-13.8-P01..P03`

Required grilling record: `roadmap/grilling/phase-4.1-grilling.md`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Stabilize shared diagnostic, command/action, contribution/default-contribution, capability-state, resolver-seam, and public API boundary contracts. | No new package install. |
| `@textforge/workspace` | Align resource identity/content facts and import diagnostics with contribution-driven surface eligibility. | No new package install. |
| `@textforge/surfaces` | Audit and adapt surface eligibility/open-with routing to resource facts and active capability predicates. | No new package install. |
| `@textforge/pipeline` | Audit Phase 4 pipeline registry/trace/diagnostics against shared diagnostics and active-capability lookup contracts. | No new package install. |
| `@textforge/markdown` | Isolate provisional block dispatch and shape built-in handlers as default contributions. | No new package install. |
| `@textforge/assets` | Audit asset viewers/generated asset actions and SVG dual eligibility as default contribution candidates. | No new package install. |
| `@textforge/editors` | Audit source editors/language support as default contribution candidates. | No new package install. |
| `@textforge/diagrams` | Audit Mermaid/Graphviz handlers/renderers as default contributions with stable IDs and shared diagnostics. | No new package install. |
| `@textforge/ui` | Audit toolbar/context-menu/surface actions against the single command/action spine. | No new package install. |
| `@textforge/security-profile` | Preserve source-owned local artifact validation and reject remote/CDN/module-script regressions in the shipped local path. | No new package install. |
| `apps/textforge-web` | Audit shell-owned feature logic, duplicate command/action concepts, and cross-package `src/` imports before Phase 5. | No new package install. |
| `roadmap/` | Store grilling records and append RAPID decisions/progress. | No pnpm package install. |

## Phase 5 — Contribution registries and package composition

Precondition: Phase 4.1 closure. Required grilling record: `roadmap/grilling/phase-5-grilling.md`.

Architecture paragraphs: `ARCH-6.7-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.11-P01..P07`, `ARCH-6.17-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-7.9-P01..P04`, `ARCH-8-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Canonical manifests, package/capability/contribution identities, status model, pure document resolver, deterministic ordering, diagnostic source identity, and registry/context read model. | No new package install. |
| `@textforge/surfaces` | Package-provided surface registration, active-context compatibility, and intermediate reopening surface selection. | No new package install. |
| `@textforge/pipeline` | Active-capability-scoped step loading, short/qualified-name resolution, conflict diagnostics, intermediate metadata, and golden resolver fixtures. | No new package install. |
| `@textforge/ui` | Minimal package/capability inspector, grouped diagnostics, deterministic package/status views. | No new package install. |
| `@textforge/markdown` | `%require` as activation/check only, default Markdown capabilities, capability-aware fenced-block handlers, and source-identifiable diagnostics. | No new package install. |
| `@textforge/security-profile` | Verify static bundled package composition and `%require` no-fetch/no-load behavior. | No new package install. |


## Phase 5.1 — Workspace and repository provider contracts

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 7-9, 14-16; `grilling/backend-grilling.md` Q1-Q5, Q11, Q13-Q22, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Provider/resource descriptor, revisions, changesets, provenance, repository diagnostics. | No new package install. |
| `@textforge/workspace` | Local provider wrappers over IndexedDB, ZIP, generated resources, dirty state, changesets. | No new package install. |
| `@textforge/itm` | Repository declaration structures without frontend fetch. | No new package install. |
| `@textforge/markdown` | Preserve repository/include declarations as provider references. | No new package install. |
| `@textforge/security-profile` | Provider allowlist and forbidden local file API checks. | No new package install. |

## Phase 5.2 — Identity contract

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 11, 13, 14, 16, 18; `grilling/backend-grilling.md` Q6-Q7, Q15, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` or `identity-contract` | Neutral user/group/claim/policy diagnostic contracts. | No new package install. |
| `@textforge/security-profile` | Validate identity metadata is not permission authority. | No new package install. |

## Phase 5.3 — User settings core and local storage

Backend references: `textforge_backend_optional_architecture_whitepaper.md` section 13; `grilling/backend-grilling.md` Q6, Q15, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` or `user-settings-core` | Settings schema, command preference metadata, precedence metadata. | No new package install. |
| `@textforge/workspace` or `user-settings-local` | Local settings persistence in browser-managed storage. | No new package install. |
| `@textforge/ui` | Consume settings read model. | No new package install. |
| `@textforge/security-profile` | Validate settings never grant permissions/providers. | No new package install. |

## Phase 6 — ITM integration and model/report foundation

Architecture paragraphs: `ARCH-6.6-P01..P07`, `ARCH-6.8-P01..P06`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P12`, `ARCH-11.2-P01..P02`, `ARCH-12.2-P01`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Parser/serializer/resolver/selectors/styles/views/rules. | `pnpm --filter @textforge/itm add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/pipeline@workspace:* yaml` |
| `@textforge/pipeline` | ITM model value and transformation step contracts. | No new package install. |
| `@textforge/markdown` | TF-MD model-aware `itm` and `itm-pub` fenced blocks. | `pnpm --filter @textforge/markdown add @textforge/itm@workspace:*` |


## Phase 6.1 — Repository resolver integration

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 7, 9, 16; `grilling/backend-grilling.md` Q16-Q17, Q20, Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` | Repository diagnostics and resolver result contracts. | No new package install. |
| `@textforge/workspace` | Provider-backed repository roots and local bundle/package roots. | No new package install. |
| `@textforge/itm` | `%repository`/`%include` resolver integration through provider contracts. | No new package install. |
| `@textforge/markdown` | Share resolver diagnostics; defer full report composition to Phase 9. | No new package install. |
| `@textforge/security-profile` | No arbitrary frontend fetch from URL-like repository values. | No new package install. |

## Phase 7 — ITM visual projections

Architecture paragraphs: `ARCH-5.12-P01..P04`, `ARCH-6.9-P01..P07`, `ARCH-6.18-P01..P25`, `ARCH-6.21-P01..P04`, `ARCH-11.5-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/itm` | Projection APIs and generated asset provenance. | No new package install. |
| `@textforge/diagrams` | ITM-to-graph/mindmap adapters and viewers. | `pnpm --filter @textforge/diagrams add cytoscape graphology sigma jsmind` |


## Phase 7.1 — Local service-folder convention

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 3.3, 10, 16; `grilling/backend-grilling.md` Q5, Q22, Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/workspace` or `workspace-services` | `/services`, `/packages`, `/templates`, generated-output conventions. | No new package install. |
| `@textforge/pipeline` | Service-compatible output descriptors and explicit generated-resource categories. | No new package install. |
| `@textforge/assets` | Generated/service artifact provenance display. | No new package install. |
| `@textforge/security-profile` | Validate service folders are data-plane only. | No new package install. |

## Phase 7.2 — User settings UI

Backend references: `textforge_backend_optional_architecture_whitepaper.md` section 13; `grilling/backend-grilling.md` Q6, Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/ui` or `user-settings-ui` | Settings surface/panel components. | No new package install by default. |
| `@textforge/workspace` or `user-settings-local` | Persist UI preference changes. | No new package install. |
| `@textforge/security-profile` | Validate settings UI cannot enable unavailable capabilities/providers. | No new package install. |

## Phase 8 — Lua automation

Architecture paragraphs: `ARCH-5.15-P01..P04`, `ARCH-6.19-P01..P06`, `ARCH-7.10-P01..P05`, `ARCH-11.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/lua` | Restricted Fengari runtime, API allow-list, Lua console surface. | `pnpm --filter @textforge/lua add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* fengari` |
| `@textforge/pipeline` | Lua script pipeline step type. | No new package install. |


## Phase 8.1 — Private and group space contracts

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 11, 14, 16, 18; `grilling/backend-grilling.md` Q7, Q15, Q20, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/core` or `private-spaces-contract` | Private/group root descriptors, owner metadata, permission diagnostics. | No new package install. |
| `@textforge/workspace` | Contract/test roots only; no real local enforcement claim. | No new package install. |
| `@textforge/ui` | Gate/hide private/group roots until backend identity/policy exists. | No new package install. |
| `@textforge/security-profile` | Validate no local enterprise privacy claim. | No new package install. |

## Phase 9 — Markdown + ITM report generation

Architecture paragraphs: `ARCH-5.10-P01..P04`, `ARCH-6.18-P01..P25`, `ARCH-11.5-P01..P03`, `ARCH-13.8-P01..P03`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/markdown` | TF-MD include/repository resolver and AST-level report pipeline. | `pnpm --filter @textforge/markdown add unified remark-parse remark-rehype rehype-stringify rehype-sanitize rehype-slug rehype-autolink-headings unist-util-visit` |
| `@textforge/itm` | Report fragment model integration. | No new package install. |
| `@textforge/diagrams` | Report asset embedding integration. | No new package install. |


## Phase 9.1 — Enterprise distribution profile

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 4-6, 14-16, 18; `grilling/backend-grilling.md` Q4, Q10, Q12, Q25-Q27.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `apps/textforge-web` | Frontend build consumable by server host. | No new package install. |
| `server-app-host` / `enterprise-container` | Node app host, `/api`, `/schemas`, `/health`, manifest. | Add server runtime only after RAPID dependency decision. |
| `@textforge/security-profile` | Enterprise one-origin/CSP/manifest checks. | No new package install by default. |

## Phase 9.2 — Backend API contract and optional frontend provider

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 3.2, 5, 7, 8, 14-16; `grilling/backend-grilling.md` Q2-Q4, Q10-Q12, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `persistence-client` | Frontend-safe optional backend provider client. | No new package install by default. |
| `persistence-server-contract` | DTO/schema/version/diagnostic contracts. | No new package install by default. |
| `@textforge/workspace` | Register backend provider only from approved manifest. | No new package install. |
| `@textforge/security-profile` | No direct GitLab/AI/Entra/adapters in frontend. | No new package install. |

## Phase 9.3 — Reference persistence server

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 3.3, 5-8, 10, 14-16, 18; `grilling/backend-grilling.md` Q5, Q10-Q14, Q20-Q22, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `persistence-server-reference` | Reference data/control-plane server. | Add server dependencies only after RAPID license/dependency decision. |
| `persistence-server-contract` | Contract tests and schema compatibility. | No new package install by default. |
| `@textforge/security-profile` | Manifest/schema/adapter-boundary checks. | No new package install by default. |

## Phase 9.4 — Enterprise SSO and server-side policy

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 3.4, 11, 14-16, 18; `grilling/backend-grilling.md` Q6-Q7, Q10, Q15, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `identity-entra-server` | Backend-only identity adapter. | Add Entra/auth libraries only after RAPID decision. |
| `identity-contract` / `@textforge/core` | Align frontend metadata with server policy decisions. | No new package install. |
| `persistence-server-reference` | Enforce policy on provider/resource actions. | No new package install by default. |

## Phase 9.5 — Private and group spaces server

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 11, 16; `grilling/backend-grilling.md` Q15, Q20, Q24, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `private-spaces-server` | Backend-only private/group storage. | No new package install by default. |
| `persistence-server-reference` | `/private/me/` and `/groups/{groupId}/` roots with policy. | No new package install by default. |
| `@textforge/ui` | Show roots only when manifest/policy enable them. | No new package install. |

## Phase 9.6 — Roaming user settings

Backend references: `textforge_backend_optional_architecture_whitepaper.md` section 13; `grilling/backend-grilling.md` Q6, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `user-settings-server-sync` | Backend sync client/server slice. | No new package install by default. |
| `@textforge/ui` | Sync state and policy-disabled preferences. | No new package install. |
| `persistence-server-reference` | SSO-bound preferences and optional org/group defaults. | No new package install by default. |

## Phase 9.7 — GitLab adapter behind the persistence server

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 8, 9, 14-16; `grilling/backend-grilling.md` Q8, Q10-Q11, Q16-Q17, Q21-Q22, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `persistence-gitlab-adapter` | Backend-only GitLab adapter. | Add GitLab client only after RAPID dependency/security decision. |
| `persistence-server-reference` | GitLab-backed provider roots and changeset-to-commit/MR mapping. | No new package install by default. |
| `@textforge/security-profile` | Verify GitLab SDK/tokens/URLs do not enter frontend. | No new package install. |

## Phase 10 — BPMN support and first mature visual editor

Architecture paragraphs: `ARCH-5.13-P01..P05`, `ARCH-5.3-P01..P08`, `ARCH-6.12-P01..P05`, `ARCH-6.16-P01..P04`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/bpmn` | BPMN XML support, bpmn-js viewer/modeler, controlled write-back. | `pnpm --filter @textforge/bpmn add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/pipeline@workspace:* @textforge/editors@workspace:* @textforge/itm@workspace:* bpmn-js bpmn-moddle` |


## Phase 10.1 — Backend-backed service folders

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 3.3, 10, 16; `grilling/backend-grilling.md` Q5, Q22, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `persistence-server-reference` | Service job APIs and service artifact storage. | No new package install by default. |
| `@textforge/workspace` | Server-backed service folders as provider resources. | No new package install. |
| `@textforge/pipeline` | Explicit backend jobs where enabled. | No new package install by default. |
| `@textforge/security-profile` | Data-plane/control-plane and policy checks. | No new package install. |

## Phase 10.2 — Soft collaboration leases

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 8, 17; `grilling/backend-grilling.md` Q23-Q24.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `persistence-server-reference` | Advisory lease API, inactivity expiry, logout/session release. | No new package install by default. |
| `persistence-client` | Lease status and stale revision diagnostics. | No new package install. |
| `@textforge/ui` | Lease owner/status, renewal prompts, stale warnings. | No new package install. |

## Phase 11 — Tables, catalogues, and matrices

Architecture paragraphs: `ARCH-5.4-P01..P03`, `ARCH-6.15-P01..P04`, `ARCH-6.21-P01..P04`, `ARCH-7.8-P01..P05`, `ARCH-11.5-P01..P03`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/tables` | Semantic table surfaces, CSV/TSV grid, catalogue/matrix abstractions. | `pnpm --filter @textforge/tables add @textforge/core@workspace:* @textforge/workspace@workspace:* @textforge/surfaces@workspace:* @textforge/ui@workspace:* @textforge/itm@workspace:* @tanstack/react-table` |
| `@textforge/bpmn` | Optional BPMN catalogues. | No new package install. |


## Phase 11.1 — AI contract and backend mediator

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 12, 14-16, 18; `grilling/backend-grilling.md` Q9, Q10, Q14, Q26-Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `ai-contract` | Request/response, context, policy, audit, patch suggestion contracts. | No new package install by default. |
| `ai-server-mediator` | Backend-only AI mediator seam. | Add provider SDKs only after RAPID decision. |
| `@textforge/security-profile` | No LLM provider access in frontend. | No new package install. |

## Phase 11.2 — AI client and chat surface

Backend references: `textforge_backend_optional_architecture_whitepaper.md` section 12; `grilling/backend-grilling.md` Q9, Q14, Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `ai-client` | Frontend-safe client to approved backend origin. | No new package install by default. |
| `ai-chat-surface` / `@textforge/ui` | Chat surface components. | Add UI dependencies only after RAPID decision. |
| `@textforge/workspace` | Explicit read-only selected-context snapshots. | No new package install. |

## Phase 11.3 — AI preference integration

Backend references: `textforge_backend_optional_architecture_whitepaper.md` sections 12, 13; `grilling/backend-grilling.md` Q6, Q9, Q28.

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `user-settings-core` / `@textforge/core` | AI preference keys and precedence rules. | No new package install. |
| `ai-client` / `ai-chat-surface` | Respect preferences without changing permissions. | No new package install. |
| `@textforge/security-profile` | Validate preferences do not expand context or rights. | No new package install. |

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
| `@textforge/ui` | Advanced tab chrome, movement affordances, group-aware keyboard navigation. Reuse the shell side-panel dependency introduced in Phase 3.5. | `pnpm --filter @textforge/ui add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` |
| `@textforge/core` | Stable session persistence types if needed. | No new package install. |

## Phase 14 — Rich Markdown editing, optional and round-trip gated

Architecture paragraphs: `ARCH-5.3-P01..P08`, `ARCH-5.4-P01..P03`, `ARCH-6.12-P01..P05`, `ARCH-14.1-P01..P02`

| Package | pnpm packages / dependency action | Command |
|---|---|---|
| `@textforge/editors` | Rich-editor capability conventions and unsupported-construct diagnostics for TF-MD. | No new package install. |
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
