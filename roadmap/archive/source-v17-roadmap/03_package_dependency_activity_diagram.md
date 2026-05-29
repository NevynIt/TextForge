# TextForge Package Dependency Activity Diagram — V16

Direction convention: `A ->> B` means **package A starts consuming or depending on package B** at that phase.

```mermaid
sequenceDiagram
  autonumber

  participant App as apps/textforge-web
  participant Core as @textforge/core
  participant Sec as @textforge/security-profile
  participant UI as @textforge/ui
  participant Docs as @textforge/examples-docs
  participant WS as @textforge/workspace
  participant Surf as @textforge/surfaces
  participant Edit as @textforge/editors
  participant Assets as @textforge/assets
  participant Pipe as @textforge/pipeline
  participant MD as @textforge/markdown
  participant Diag as @textforge/diagrams
  participant ITM as @textforge/itm
  participant Lua as @textforge/lua
  participant BPMN as @textforge/bpmn
  participant Tables as @textforge/tables
  participant Archi as @textforge/archimate
  participant Repo as repository/provider contracts
  participant Settings as user-settings packages
  participant Server as backend/server packages
  participant Identity as identity/private-space packages
  participant AI as AI packages

  rect rgb(245,245,245)
    Note over App,Docs: Phase -1 — repository pivot and archival preservation
    App->>App: preserve v1 tag/branch and create rewrite branch
    App->>Docs: preserve selected legacy docs/reference/specs/examples/fixtures
    App->>App: create pnpm workspace monorepo skeleton
  end

  rect rgb(235,245,255)
    Note over App,Docs: Phase 0 — foundation, security envelope, dependency policy
    App->>Core: create stable contracts package
    Sec->>Core: consume shared profile/diagnostic conventions if needed
    UI->>Core: consume shared capability/command/status conventions
    Docs->>Core: document package template and examples conventions
    App->>Sec: use browser-envelope profile/check skeleton
    App->>UI: use initial app frame placeholders
  end

  rect rgb(240,255,240)
    Note over WS,Assets: Phase 1 — workspace and Stage 1 surface skeleton
    WS->>Core: consume resource, diagnostic, command contracts
    Surf->>Core: consume surface/session/capability contracts
    UI->>Surf: provide surface frame chrome
    UI->>WS: provide workspace tree frame
    Edit->>Surf: contribute CodeMirror text editor surface
    Edit->>Core: consume source range and diagnostic contracts
    Assets->>WS: bind read-only binary resources to workspace resources
    Assets->>Surf: contribute image/SVG/PDF/binary viewer surfaces
    App->>WS: use virtual workspace service
    App->>Surf: use main and popup surface hosts
    App->>Edit: register text editor surface
    App->>Assets: register asset viewer surfaces
  end

  rect rgb(255,250,235)
    Note over Core,Edit: Phase 2 — source-editor coverage and language foundation
    Surf->>Core: consume stabilized language/editor capability contracts
    Edit->>Core: consume lint/diagnostic bridge types
    Edit->>Surf: expose source editor fallback and language-specific CodeMirror configs
    App->>Edit: open Markdown, ITM, Lua, JSON, XML, BPMN XML, ArchiMate XML, CSV/TSV, Mermaid, DOT, SVG, YAML
  end

  rect rgb(250,245,255)
    Note over WS,Sec: Phase 3 — ZIP workspace import/export
    WS->>Core: extend resource model with workspace manifest and archive metadata
    WS->>Assets: preserve binary resources through ZIP round-trip
    Assets->>WS: validate restored asset bindings after ZIP import
    Sec->>App: verify browser-envelope file safeguards, not internal gateway layering
    App->>WS: expose selected-folder and full-workspace ZIP import/export
  end

  rect rgb(255,245,245)
    Note over App,Sec: Phase 3.1 — React workbench shell and UI recovery
    App->>UI: replace imperative shell with React-rendered workbench chrome
    UI->>Surf: render dominant main surface frame and narrow main-session tab strip
    Surf->>UI: adapt host props/state to React shell
    Edit->>Surf: validate CodeMirror surfaces mount in React shell
    Assets->>Surf: validate image/SVG/PDF/binary surfaces mount in React shell
    Sec->>App: re-check dependency/license and runnable-artifact constraints after React adoption
  end

  rect rgb(235,255,250)
    Note over WS,Assets: Phase 3.2 — Dexie workspace persistence recovery
    WS->>Core: persist folders, text resources, binary resources, metadata, language IDs, manifest data
    App->>WS: hydrate workspace state on startup and handle reset/recovery
    UI->>WS: show browser-managed workspace and reset/clear-storage cues
    Assets->>WS: rehydrate binary resources and maintain blob URL lifecycle
    Sec->>App: confirm no File System Access API, directory handles, remote sync, or silent local file access
  end

  rect rgb(245,250,255)
    Note over Core,App: Phase 3.3 — command palette and contribution-driven shell commands
    UI->>Core: consume minimal command manifest/registry/context contracts
    WS->>Core: expose workspace commands
    Surf->>Core: expose surface commands
    Edit->>Core: expose existing editor commands
    Assets->>Core: expose existing asset viewer commands
    App->>UI: replace hard-coded toolbar/menu behaviour with command palette and slots
  end


  rect rgb(250,250,235)
    Note over WS,UI: Phase 3.4 — resource identity badges and workbench readability pass
    WS->>Core: expose minimal placement-based badge token contract only where the cross-package shape is shared
    WS->>UI: provide persisted badge assignments and collision-repair diagnostics
    Surf->>WS: carry source-resource badge metadata into session/tab models
    UI->>Surf: render badges and compact identity/state chrome in tabs and surfaces
    UI->>UI: use bundled lucide-react only for generic shell icon affordances
    UI->>Core: consume Phase 3.3 command contracts to calm toolbar/menu presentation
    App->>UI: apply overflow-safe layout, compact header, stable utility drawer, inspector, active-resource states, and empty/error states
    App->>WS: display stable badges across workspace tree, active resource header, and main tabs
    Edit->>Surf: validate text-editor fit and metadata in cleaned shell chrome
    Assets->>Surf: validate asset-viewer fit and metadata in cleaned shell chrome
    Sec->>UI: verify local deterministic badge rendering and no remote icon/image loading
    Docs->>UI: document badge/readability style and fixture expectations
  end

  rect rgb(235,250,250)
    Note over Surf,App: Phase 3.5 — popup usability, resizable panels, and chrome deduplication pass
    Surf->>UI: expose popup/main placement state for real in-app popup hosts
    UI->>UI: use react-resizable-panels for bounded shell side panels only
    UI->>Surf: render popup sessions as overlays, not right-panel content
    App->>UI: deduplicate active-resource cards, title rows, buttons, and repeated paths
    App->>UI: enforce no page-level horizontal scrollbar and no orphaned collapsed-panel space
    Edit->>UI: validate editor readability after panel resize/collapse
    Assets->>UI: validate viewer readability after panel resize/collapse
    Sec->>UI: verify popup/resize state is local UI state with no new browser permissions
    Docs->>UI: capture screenshot evidence against the Phase 3.5 checklist
  end

  rect rgb(245,255,250)
    Note over Core,App: Phase 3.6 — unified workspace resources and representation-based surface routing
    Core->>Core: remove or deprecate text/binary as public resource-kind ontology
    WS->>Core: consume minimal resource content representation contracts
    WS->>WS: migrate/present unified resources with text or byte content
    WS->>Assets: keep SVG text-stored while opaque images/PDF remain byte-stored
    Surf->>Core: replace hard-coded kind filters with compatibility predicates
    Edit->>Surf: accept text-representation resources including SVG source
    Assets->>Surf: accept compatible image/SVG/PDF resources across text/byte representations
    App->>Surf: route open-with candidates by representation, MIME, language, and path
    App->>UI: remove user-facing text/binary taxonomy from resource chrome
    Sec->>WS: verify no remote sniffing, silent file probing, or filesystem API expansion
    Docs->>WS: document SVG-as-text and opaque asset fixtures
  end

  rect rgb(255,250,240)
    Note over Core,App: Phase 3.7 — context menus as thin command projections
    Core->>Core: add minimal target-aware command context if needed
    UI->>Core: render context menus from resolved command registry entries
    WS->>Core: reuse existing workspace commands for tree item targets
    Surf->>Core: reuse existing session commands for tab and popup targets
    Edit->>Core: reuse existing editor commands for target text resources
    Assets->>Core: reuse asset/open-with/download commands for target resources
    App->>UI: wire tree, tab, and popup/session context menus
    Sec->>UI: verify context menus remain local UI affordances
    Docs->>UI: document expected context-menu behavior
  end

  rect rgb(250,240,255)
    Note over Pipe,Diag: Phase 4 — Markdown profile baseline, local assets, generated diagram assets
    Pipe->>Core: consume pipeline value, trace, diagnostics, generated resource contracts
    MD->>Pipe: contribute TF-MD baseline preview pipeline and diagnostics
    MD->>WS: resolve workspace-relative images
    MD->>Surf: contribute Markdown preview surface
    MD->>MD: implement anchors, style references, tf-md blocks, metadata, and style directives
    Diag->>Pipe: contribute Mermaid and Graphviz rendering pipelines
    Diag->>WS: write generated SVG/PNG resources
    Diag->>Assets: reuse SVG/image viewer surfaces
    MD->>Diag: use local handlers for mermaid, dot, and graphviz fenced blocks
    Assets->>Pipe: display generated asset provenance and stale state
  end

  rect rgb(255,245,235)
    Note over Core,App: Phase 4.1 — foundation stabilization before contribution registries
    Core->>Core: stabilize diagnostic, action, contribution, capability-state, and public API contracts
    WS->>Core: align resource facts and import diagnostics with shared contracts
    Surf->>Core: route eligibility through resource facts and capability predicates
    Pipe->>Core: audit step identity, trace, diagnostics, and intermediate metadata contracts
    MD->>Core: isolate provisional block dispatch and prepare default block-handler contributions
    Assets->>Surf: validate SVG source/visual dual eligibility and default viewer contributions
    Edit->>Surf: audit source editor and language contributions as default contributions
    Diag->>Pipe: audit Mermaid/Graphviz handlers as default contributions with shared diagnostics
    UI->>Core: ensure toolbar, context menu, and surface actions project one command/action spine
    Sec->>App: preserve source-owned local artifact path and local/extension launch checks
    App->>Core: remove or document temporary shell-owned feature routing before Phase 5
    Docs->>Docs: store grilling records and append RAPID decisions
  end

  rect rgb(240,240,255)
    Note over Core,UI: Phase 5 — contribution registries and package composition
    Core->>Core: own canonical contribution manifests, IDs, statuses, and pure document resolver
    Surf->>Core: consume active document contribution context for compatible surfaces
    Pipe->>Core: resolve step contributions through active capabilities with deterministic diagnostics
    UI->>Core: render package/capability inspector and deterministic package status views
    MD->>Core: parse %require as capability activation/check against bundled capabilities
    MD->>Pipe: register fenced-block handlers through contribution manifests
    App->>Core: compose bundled package manifests without remote loading or shell feature logic
    Sec->>App: verify static bundled composition and %require no-fetch/no-load behavior
  end



  rect rgb(235,255,245)
    Note over Core,Settings: Phases 5.1–5.3 — provider contracts, identity contract, local settings
    Core->>Repo: define provider-aware ResourceDescriptor, revisions, changesets, repository diagnostics
    WS->>Repo: expose IndexedDB/ZIP/generated resources as local providers
    ITM->>Repo: store repository declarations without frontend fetch
    MD->>Repo: preserve repository/include declarations as provider references
    Core->>Identity: define neutral identity and permission diagnostic contracts
    Core->>Settings: define local settings and command preference contracts
    WS->>Settings: persist local settings in browser-managed storage
    UI->>Settings: consume settings without granting permissions
    Sec->>Repo: enforce local provider allowlists and no File System Access API
  end

  rect rgb(245,245,245)
    Note over ITM,MD: Phase 6 — ITM integration and model/report foundation
    ITM->>Core: consume diagnostics, source ranges, model contracts
    ITM->>WS: resolve workspace includes/packages
    ITM->>Pipe: contribute parse/validate/select/view pipelines
    Edit->>ITM: provide ITM source assistance and diagnostics integration
    MD->>ITM: embed TF-MD itm and itm-pub blocks, diagnostics, publication views, and report fragments
  end



  rect rgb(250,255,245)
    Note over ITM,Repo: Phase 6.1 — provider-backed repository resolver
    ITM->>Repo: resolve %repository/%include through active providers
    MD->>Repo: reuse repository diagnostics before full report composition
    WS->>Repo: expose local bundle/package roots
    Sec->>Repo: reject arbitrary frontend fetch from repository values
  end

  rect rgb(235,245,255)
    Note over ITM,Diag: Phase 7 — ITM visual projections
    Surf->>ITM: register ITM projection surfaces
    Diag->>ITM: consume tree/graph/mindmap/catalogue/matrix projection APIs
    Diag->>Pipe: expose ITM-to-Mermaid/Graphviz/Cytoscape/Sigma adapters
  end



  rect rgb(245,255,255)
    Note over WS,Settings: Phases 7.1–7.2 — service-folder conventions and settings UI
    WS->>Repo: add local /services, /packages, /templates data-plane conventions
    Pipe->>Repo: classify generated outputs as source/derived/controlled-generated
    Assets->>Repo: show provenance and persistence state for generated artifacts
    UI->>Settings: add settings UI for commands, menus, palette, layout, profiles
    Sec->>WS: verify service folders do not become fake control APIs
  end

  rect rgb(240,255,240)
    Note over Lua,Edit: Phase 8 — Lua automation
    Lua->>Core: consume diagnostics and command contracts
    Lua->>WS: consume scoped workspace capabilities
    Lua->>Pipe: contribute Lua-backed pipeline/action steps
    Lua->>Surf: contribute Lua console surface
    Lua->>Edit: reuse Lua CodeMirror mode and action helpers
  end



  rect rgb(255,245,250)
    Note over Identity,UI: Phase 8.1 — private/group space contracts
    Core->>Identity: define private/group roots, ownership metadata, permission diagnostics
    WS->>Identity: support contract fixtures only, not local enforcement claims
    UI->>Identity: keep private/group roots hidden until backend policy exists
    Sec->>Identity: prevent misleading local privacy/group claims
  end

  rect rgb(255,250,235)
    Note over MD,ITM: Phase 9 — Markdown + ITM report generation
    ITM->>Pipe: expose report-oriented model fragment export
    MD->>ITM: consume report-oriented view extraction
    MD->>WS: resolve TF-MD includes and repository-qualified Markdown references
    MD->>Diag: consume generated SVG/PNG report assets
    Diag->>WS: store reportable generated diagram assets
  end



  rect rgb(235,240,255)
    Note over App,Server: Phases 9.1–9.7 — enterprise backend profile and persistence
    Server->>App: serve compiled frontend from one approved enterprise origin
    Server->>Server: expose /api, /schemas, /health, fail-fast manifest
    WS->>Server: register optional backend provider only from approved manifest
    Server->>Repo: implement data plane, provider endpoints, revisions, changesets
    Server->>Identity: enforce SSO/session/policy and capability filtering
    Server->>Settings: sync roaming settings without granting permissions
    Server->>Repo: expose private/group roots after policy enables them
    Server->>Server: keep GitLab adapter backend-only behind resource/changeset API
    Sec->>Server: verify no backend-only adapter leaks into frontend-safe packages
  end

  rect rgb(255,245,245)
    Note over BPMN,Surf: Phase 10 — BPMN support and first mature visual editor
    BPMN->>Surf: contribute BPMN viewer/modeler surfaces
    BPMN->>Edit: reuse BPMN XML source editor
    BPMN->>Pipe: contribute BPMN XML value, diagnostics, import/export extension points
    BPMN->>Core: consume controlled write-back contracts
  end



  rect rgb(240,250,255)
    Note over Server,UI: Phases 10.1–10.2 — backend services and soft collaboration leases
    Server->>WS: expose server-backed /services artifacts through providers
    Pipe->>Server: create/cancel/check backend jobs through explicit APIs
    Server->>UI: expose advisory time-bound lease state and stale revision diagnostics
    UI->>Server: renew/release leases and prompt after inactivity
    Sec->>Server: verify data-plane/control-plane split and no permanent locks
  end

  rect rgb(245,250,255)
    Note over Tables,BPMN: Phase 11 — tables, catalogues, matrices
    Tables->>Core: consume patch/write-back contracts
    Tables->>Surf: contribute semantic table/grid surfaces
    Tables->>UI: consume table toolbar/filter/sort components
    Tables->>ITM: consume node/relationship catalogue and matrix projections
    BPMN->>Tables: optionally expose BPMN task/event/gateway catalogues
  end



  rect rgb(245,240,255)
    Note over AI,UI: Phases 11.1–11.3 — backend-mediated AI, chat, preferences
    AI->>Server: mediate AI through backend policy, scope, redaction, audit
    UI->>AI: provide chat surface for selected document/folder context
    AI->>WS: read explicit authorized context only
    AI->>UI: return explanations, summaries, and unapplied patch text
    Settings->>AI: apply AI preferences without expanding permissions
    Sec->>AI: verify no direct frontend LLM provider calls and no silent mutation
  end

  rect rgb(250,245,255)
    Note over Archi,MD: Phase 12 — enterprise architecture and ArchiMate foundation
    Archi->>ITM: provide ArchiMate ITM profile and validation hooks
    Archi->>Tables: consume EA catalogue/matrix editors
    Archi->>Pipe: contribute ArchiMate exchange XML import/export and validation
    Archi->>MD: contribute EA report blocks
    Archi->>Diag: generate EA diagrams and viewpoints
  end

  rect rgb(255,255,240)
    Note over Surf,UI: Phase 13 — Stage 2 advanced tabbed main surfaces
    Surf->>Core: consume optional session persistence types
    UI->>Surf: add advanced tab chrome, movement affordances, richer indicators
  end

  rect rgb(245,245,245)
    Note over MD,Diag: Phases 14–18 — optional rich/visual/annotation/PDF capabilities
    MD->>Edit: add Milkdown rich Markdown surface behind feature flag and preserve TF-MD source round trips
    Diag->>ITM: add React Flow controlled graph/layout-delta editing patches
    Diag->>Pipe: add visual pipeline editor schema
    Archi->>Sec: perform license/dependency review for ArchiMate visual library
    Archi->>Surf: optionally add experimental ArchiMate visual editor surface
    Assets->>MD: provide sketch/annotation assets for reports
    MD->>Assets: evaluate late Markdown/HTML-to-PDF and PDF annotation paths
  end

  rect rgb(235,245,255)
    Note over Sec,Docs: Phase 19 — release-envelope verification and accreditation evidence
    Sec->>App: verify static/extension/PWA browser envelope and enterprise one-origin backend profile evidence
    Docs->>Sec: publish release checklist, accreditation examples, tutorial workspace
  end
```
