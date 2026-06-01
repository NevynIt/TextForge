# Roadmap V20 - Active Workpackage Roadmap

## Purpose

V20 is the active TextForge roadmap. It keeps the workpackage-first dependency model, records that the Visual ITM/runtime renderer and read-only BPMN visual chains are validated through `WP-BPMN-VISUAL-B`, and adds explicit candidate workpackages for the knowledge-workspace layer.

Implementation agents should work from the current roadmap files, not older phase-roadmap material.

## Active Roadmap

The active roadmap consists of:

- `AGENTS_START_HERE.md`
- `ROADMAP_V20.md`
- `decisions/RAPID.md`
- `workpackages/workpackage-register.md`
- `workpackages/implementation-status.md`
- relevant `workpackages/*.md` cluster files
- relevant `package-guides/*.md`
- relevant `specs/architecture/*.md`
- relevant `grilling/*.md` records
- relevant `validation/*` checklists and evidence

## Frozen Baseline

Validated baseline work is frozen unless a later RAPID decision explicitly reopens a defect. Do not restructure or reinterpret frozen workpackages to absorb new scope.

```text
WP-05A Contribution manifest and registry model
WP-05B Capability activation and resolver context
WP-05C Pipeline/contribution execution integration
WP-05D Minimal package/capability inspector
WP-RES-01 Provider-aware resource descriptors
WP-REPO-01 Repository reference and include resolver
WP-ITM-01 ITM parser/model foundation
WP-ITM-02 ITM directives/packages/validation/diagnostics
WP-ITM-VISUALS ITM static visual projections/publication baseline
WP-LUA Lua automation
WP-LUA-POWER-SESSION Lua self-escalation session and recovery
WP-VITM-01 Visual ITM profile v1
WP-ITM-VTARGET-01 ITM visual target picker MVP
WP-ITM-VRESOLVE-01 Shared ITM visual target resolver
WP-RENDER-CYTOSCAPE Cytoscape runtime renderer package
WP-RENDER-JSMIND jsMind runtime renderer package
WP-RENDER-SIGMA Sigma/Graphology runtime renderer package
WP-BPMN-SEM BPMN semantic profile and validation
WP-BPMN-VISUAL-A BPMN.io viewer surface
WP-BPMN-DI-01 BPMN Diagram Interchange read-only fidelity
WP-BPMN-VISUAL-B ITM/BPMN visual target integration
```

## Workpackage Model

From WP5 onward, planning is dependency-based rather than strictly linear.

A workpackage declares stable ID, title, type, status, dependencies, outputs, validation criteria, package impact, deferrability, and production relevance.

## Current Backbones

Core platform:

```text
WP-05A -> WP-05B -> WP-05C
WP-RES-01 -> WP-RES-02 -> WP-RES-03
WP-REPO-01
```

Visual/runtime baseline already validated:

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
  -> WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-DI-01
  -> WP-BPMN-VISUAL-B
```

Backend and enterprise path:

```text
WP-ID-01
  -> WP-ID-DEV
  -> WP-POLICY-01
  -> WP-BE-HOST
  -> WP-BE-API
  -> WP-BE-PERSIST
```

Production SSO, GitLab, SharePoint-like repositories, AI, and other adapters remain optional dependent workpackages.

## V20 Knowledge-Workspace Candidates

V20 makes the Obsidian-like knowledge layer explicit without claiming implementation:

- `WP-LINK-INDEX` for document links, backlinks, mentions, unresolved links, and link diagnostics.
- `WP-DOC-GRAPH` for document-neighborhood and local graph surfaces over the link index.
- `WP-CANVAS` for a persisted spatial workspace/canvas resource that can arrange documents, cards, and embedded surfaces.
- `WP-COMMENTS-SIDECAR` for comments and review sidecars over Markdown/source ranges and later visual targets.
- `WP-CHANGE-PROPOSALS` for reviewable multi-resource change proposals distinct from raw changesets, GitLab merge requests, and AI patch suggestions.

## Security And Accreditation Invariants

All V20 workpackages must preserve these invariants unless a later decision explicitly creates a separate security profile:

1. Local/offline mode remains fully supported.
2. Local/offline mode has no File System Access API, persistent directory handles, silent local reads/writes, or background folder sync.
3. Local/offline mode has no arbitrary network providers.
4. Enterprise mode uses one approved backend origin per app session/deployment.
5. Backend-only adapters never leak into frontend-safe packages.
6. Settings personalize UI/defaults only; they do not grant permissions.
7. Backend-backed writes use revisions and multi-resource changesets.
8. AI is backend-mediated and non-mutating at first.
9. Optional backend capabilities hide/disable actions or emit diagnostics; they do not change document semantics.
10. Provider-specific identity adapters cannot become prerequisites for generic backend development.
11. Static publication output must not be counted as runtime renderer parity.
12. Runtime renderers consume validated Visual ITM or renderer-specific contracts, not arbitrary private ITM internals.

## Scheduling

V20 supports several valid delivery strategies:

| Strategy | Description |
|---|---|
| Knowledge-workspace-first | Add backlinks, document graph, comments, or canvas after their dependencies are settled. |
| Local-authoring-first | Prioritize Markdown, ITM, report, table, or domain capabilities that do not require backend work. |
| Core-first | Execute resource revisions/changesets before write-back-heavy features. |
| Backend-preview-first | Build local Node/container backend with dev fixture identity before production SSO. |
| Enterprise-adapter-first | After contracts exist, implement a selected adapter such as Entra or GitLab for a specific deployment. |
| UX-pressure-first | Pull UI/surface capacity work forward when current workbench constraints block usability. |

The selected next slice must be recorded in RAPID and reflected in `workpackages/implementation-status.md`.

## Immediate Recommendation

Choose the next dependency-ready slice after the validated read-only BPMN visual chain. Current candidates include `WP-ARCHIMATE-SEM`, `WP-MD-REPORT`, `WP-RES-02`, `WP-ID-01`, `WP-SET-01`, `WP-ITM-PUB-VISUAL-01`, or one of the V20 knowledge-workspace candidates after its dependencies are confirmed.

Do not start `WP-TABLES` until its dedicated grilling session is complete. Do not treat `WP-BPMN-VISUAL-C`, visual write-back, backend collaboration, or AI patch application as blockers for read-only visual consumption.
