# Roadmap V19a — Active Workpackage Roadmap

## 1. Purpose

V19a is the active, cleaned TextForge roadmap. It keeps the V19 cleanup and adds the selected implementation strategy: complete ITM visual runtime recovery first, then follow the shortest well-gated chain to BPMN visual consumption.

It keeps the V18 workpackage-first model but removes the old archive-oriented operating layer from the active roadmap package. The intent is to reduce agent confusion: implementation agents should work from the current roadmap files, not preserved V16/V17 material.

## 2. Active-roadmap rule

The active roadmap consists of:

- `AGENTS_START_HERE.md`;
- `ROADMAP_V19A.md`;
- `decisions/RAPID.md`;
- `workpackages/workpackage-register.md`;
- `workpackages/implementation-status.md`;
- relevant `workpackages/*.md` cluster files;
- relevant `package-guides/*.md`;
- relevant `specs/architecture/*.md`;
- relevant `grilling/*.md` records;
- relevant `validation/*` evidence.

Legacy/source-roadmap material is not part of the active implementation package. If historical detail is needed, retrieve it from Git history rather than editing preserved archive files.

## 3. Frozen baseline

The following are treated as frozen validated baseline unless a later RAPID decision explicitly reopens a defect:

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
```

Frozen means: do not restructure or reinterpret these workpackages to absorb new scope. Add follow-on workpackages instead.

## 4. Workpackage model

From WP5 onward, planning is dependency-based rather than strictly linear.

A workpackage declares:

- stable ID;
- title;
- type;
- status;
- dependencies;
- outputs;
- validation criteria;
- package impact;
- whether it can be skipped/deferred;
- whether it is required for production or only for selected profiles.

## 5. Workpackage types

| Type | Meaning |
|---|---|
| `core` | Generic platform work needed by most later work. |
| `contract` | Stable API/schema/model contract. |
| `implementation` | Concrete feature or backend implementation. |
| `adapter` | Provider-specific or format-specific integration behind a stable contract. |
| `profile` | Deployment/security/distribution or document/profile posture. |
| `ui` | Workbench, editor, surface, or usability capability. |
| `domain` | Markdown, ITM, BPMN, ArchiMate, tables, diagrams, Visual ITM, etc. |
| `security` | Security invariant, accreditation, CSP, packaging, or evidence work. |
| `validation` | Test/check/evidence work. |
| `investigation` | Exploratory work that may or may not become product scope. |

## 6. Core implementation backbone

The generic implementation spine remains:

```text
WP-05A -> WP-05B -> WP-05C
WP-RES-01 -> WP-RES-02 -> WP-RES-03
WP-REPO-01
```

The already validated contribution/capability and resource/repository work is frozen baseline. `WP-RES-02` and `WP-RES-03` remain available when revisions, conflict diagnostics, changesets, backend writes, AI patches, or visual edit write-back need them.

## 7. ITM visual recovery backbone

V19a keeps the ITM visual runtime recovery chain as the immediate implementation backbone.

`WP-ITM-VISUALS` remains validated as the static projection/publication baseline. It is **not** full runtime renderer parity.

The selected recovery chain is:

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
```

Standalone related tracks:

```text
WP-VITM-TRANSLATORS
WP-GRAPH-EDIT-VITM
```

Key rule: ITM visual recovery must treat `%viewpoint` and `%view` as first-class visual targets. A `.itm` file is not merely a monolithic graph-like model.


## 8. Minimal chain from ITM visual recovery to BPMN visual consumption

After ITM visual runtime recovery, the shortest viable BPMN visual path is:

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
  -> WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-VISUAL-B
```

`WP-BPMN-VISUAL-C` is explicitly later. It covers BPMN modeler/edit/write-back behavior and must not block read-only BPMN visual consumption.

The following gates must be resolved before implementation:

| WP | Gate | Reason |
|---|---|---|
| WP-VITM-01 | Further definition | Needs a concrete Visual ITM v1 profile document before coding. |
| WP-ITM-VRESOLVE-01 | Grilling | Central resolver contract for views, viewpoints, raw model fallback, renderer selection, diagnostics, and `render:` precedence. |
| WP-BPMN-SEM | Grilling / further definition | Needs a sharply bounded BPMN MVP subset before any visual work depends on it. |
| WP-BPMN-VISUAL-A/B/C | Split confirmed | Viewer, ITM/BPMN visual target integration, and modeler/write-back must remain separate. |

Not on the minimal BPMN visual consumption path: `WP-ITM-PUB-VISUAL-01`, `WP-MD-REPORT`, `WP-TABLES`, `WP-VITM-TRANSLATORS`, `WP-GRAPH-EDIT-VITM`, `WP-RES-03`, backend, identity, policy, and persistence work.

## 9. Backend and identity backbone

The generic backend path remains:

```text
WP-ID-01 Identity contract
  -> WP-ID-DEV Development identity fixture provider
  -> WP-POLICY-01 Provider-neutral server policy engine
  -> WP-BE-HOST Enterprise container and app host
  -> WP-BE-API Backend API contract and frontend provider
  -> WP-BE-PERSIST Reference persistence server
```

Production identity providers are optional adapters, not generic blockers:

```text
WP-SSO-ENTRA
WP-SSO-OIDC
WP-SSO-SAML
WP-SSO-KEYCLOAK
```

## 10. Security/accreditation invariants

All V19 workpackages must preserve these invariants unless a later decision explicitly creates a separate security profile:

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

## 11. Scheduling model

V19 supports several valid delivery strategies:

| Strategy | Description |
|---|---|
| Visual-recovery-first | Restore ITM view/viewpoint-aware runtime consumption before BPMN/ArchiMate visual work. |
| Local-authoring-first | Prioritize Markdown/ITM/report/domain capabilities that do not require backend work. |
| Core-first | Execute resource revisions/changesets before write-back-heavy features. |
| Backend-preview-first | Build local Node/container backend with dev fixture identity before production SSO. |
| Enterprise-adapter-first | After contracts exist, implement a selected adapter such as Entra or GitLab for a specific deployment. |
| UX-pressure-first | Pull UI/surface capacity work forward when current workbench constraints block usability. |

The selected path must be recorded in RAPID and reflected in `workpackages/implementation-status.md`. V19a records the selected path as ITM visual recovery first, then the minimal BPMN visual consumption chain.

## 12. Canonical files

| File | Role |
|---|---|
| `workpackages/workpackage-register.md` | Canonical WP5+ scope and dependencies. |
| `workpackages/implementation-status.md` | Mutable implementation status tracker. |
| `workpackages/dependency-map.md` | Generated Mermaid dependency map. |
| `workpackages/*.md` cluster files | Grouped detailed planning views. |
| `decisions/RAPID.md` | Decision/progress/action/issue log. |
| `grilling/itm-visuals-grilling.md` | Binding grilling record for the V19 visual recovery chain. |

## 13. Immediate recommendation

Start with the selected V19a chain: `WP-VITM-01 -> WP-ITM-VTARGET-01 -> WP-ITM-VRESOLVE-01 -> WP-RENDER-CYTOSCAPE -> WP-RENDER-JSMIND -> WP-RENDER-SIGMA`, then proceed to `WP-BPMN-SEM -> WP-BPMN-VISUAL-A -> WP-BPMN-VISUAL-B`.

Do not start `WP-BPMN-VISUAL-C`, `WP-GRAPH-EDIT-VITM`, `WP-RES-03`, backend, or report/dashboard publication work as blockers for BPMN visual consumption.
