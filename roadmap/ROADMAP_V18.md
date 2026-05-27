# Roadmap V18 — Workpackage-Based TextForge Roadmap

## 1. Purpose

V18 replaces the V16/V17 linear phase planning layer with a cleaned, dependency-based workpackage roadmap.

The goal is not to reduce scope. The goal is to make the existing scope easier to execute without false blockers.

## 2. Non-loss rule

No V16/V17 content is deleted.

Each prior item is handled in one of four ways:

1. promoted into a canonical V18 workpackage, spec, package guide, validation file, or decision record;
2. copied into a clearer V18 folder;
3. preserved as exact source history under `archive/source-v17-roadmap/`;
4. cross-referenced from `archive/CONTENT_PRESERVATION_MANIFEST.md`.

The old V16 phase roadmap remains available at `archive/v16-linear-roadmap.md` and in the full source archive.

## 3. Roadmap model

### 3.1 Historical foundation

The following remain phase-shaped history:

```text
Phase -1 through Phase 4.1
```

They are treated as already-established foundation unless a future RAPID decision explicitly reopens an item.

### 3.2 Active roadmap

From WP5 onward, the roadmap is managed as workpackages.

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

## 4. Workpackage types

| Type | Meaning |
|---|---|
| `core` | Generic platform work needed by most later work. |
| `contract` | Stable API/schema/model contract. |
| `implementation` | Concrete feature or backend implementation. |
| `adapter` | Provider-specific integration behind a stable contract. |
| `profile` | Deployment/security/distribution posture. |
| `ui` | Workbench, editor, or usability capability. |
| `domain` | Markdown, ITM, BPMN, ArchiMate, tables, diagrams, etc. |
| `security` | Security invariant, accreditation, CSP, packaging, or evidence work. |
| `validation` | Test/check/evidence work. |
| `investigation` | Exploratory work that may or may not become product scope. |

## 5. Canonical WP5+ backbone

The generic implementation spine is:

```text
WP-05A Contribution manifest and registry model
  -> WP-05B Capability activation and resolver context
  -> WP-05C Pipeline/contribution execution integration
  -> WP-RES-01 Provider-aware resource descriptors
  -> WP-RES-02 Revisions, dirty state, conflict diagnostics
  -> WP-RES-03 Multi-resource changesets and provider allowlists
  -> WP-REPO-01 Repository/include resolver
```

This preserves the accepted Phase 5 contribution/capability direction while making later backend/resource work modular.

## 6. Backend and identity backbone

The generic backend path is:

```text
WP-ID-01 Identity contract
  -> WP-ID-DEV Development identity fixture provider
  -> WP-POLICY-01 Provider-neutral server policy engine
  -> WP-BE-HOST Enterprise container and app host
  -> WP-BE-API Backend API contract and frontend provider
  -> WP-BE-PERSIST Reference persistence server
```

Microsoft Entra is not part of this generic backbone. It is an optional production adapter:

```text
WP-SSO-ENTRA Microsoft Entra SSO adapter
```

Other SSO providers can later use the same pattern:

```text
WP-SSO-OIDC
WP-SSO-SAML
WP-SSO-KEYCLOAK
```

## 7. Security/accreditation invariants

All V18 workpackages must preserve these invariants unless a later decision explicitly creates a separate security profile:

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

## 8. Scheduling model

V18 supports several valid delivery strategies:

| Strategy | Description |
|---|---|
| Core-first | Execute WP-05A/B/C, resource descriptors, revisions, and repository resolution before major features. |
| Local-authoring-first | Prioritize ITM/Markdown/report/domain capabilities that do not require backend work. |
| Backend-preview-first | Build local Node/container backend with dev fixture identity before production SSO. |
| Enterprise-adapter-first | After contracts exist, implement a selected adapter such as Entra or GitLab for a specific deployment. |
| UX-pressure-first | Pull UI/surface capacity work forward when the current workbench blocks usability. |

The selected path must be recorded in RAPID and reflected in `workpackages/implementation-status.md`.

## 9. Canonical files

| File | Role |
|---|---|
| `workpackages/workpackage-register.md` | Canonical WP5+ scope and dependencies. |
| `workpackages/implementation-status.md` | Mutable implementation status tracker. |
| `workpackages/dependency-map.md` | Mermaid dependency map. |
| `workpackages/*.md` cluster files | Grouped detailed planning views. |
| `decisions/RAPID.md` | Append-only decision/progress/action log. |
| `archive/CONTENT_PRESERVATION_MANIFEST.md` | Proof that old content was preserved or moved. |

## 10. Immediate recommendation

The former contribution/capability spine plus the minimal inspector and provider-aware resource foundation are now validated:

```text
WP-05A -> WP-05B -> WP-05C
WP-05D
WP-RES-01
```

The nearest ready follow-on slice is now:

```text
WP-ITM-VISUALS
```

`WP-LUA-POWER-SESSION`, `WP-REPO-01`, and `WP-ITM-02` are now validated on top of their respective foundations. The remaining first-shippable implementation order is `WP-ITM-VISUALS -> WP-MD-REPORT -> WP-BPMN-SEM -> WP-BPMN-VISUAL -> WP-TABLES -> WP-SKETCH -> WP-ARCHIMATE-SEM -> WP-ARCHIMATE-VISUAL -> WP-SET-01`; completing that sequence defines the first version to polish and ship. `WP-RES-02`, `WP-ID-01`, `WP-SET-01`, `WP-BPMN-SEM`, `WP-ARCHIMATE-SEM`, `WP-ITM-VISUALS`, and `WP-TABLES` remain separately startable when those foundations or optional follow-ons need to move earlier.
