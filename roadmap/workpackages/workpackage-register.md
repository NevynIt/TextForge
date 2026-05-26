# Workpackage Register — Roadmap V18

**Status:** Canonical mutable WP5+ planning register  
**Initialized from:** V18 dependency reassessment, promoted in V18  
**Scope:** WP5 onward. Earlier phases remain preserved foundation history.

V18 keeps legacy phase references for traceability, but dependencies and selected release scope are the scheduling authority.

## Status vocabulary

| Status | Meaning |
|---|---|
| Ready / next | Suitable next implementation target. |
| Not started | Defined but not yet implemented. |
| In progress | Actively being implemented. |
| Implemented | Code/docs changed and basic verification passed. |
| Validated | Implementation evidence satisfies acceptance criteria. |
| Deferred / standalone | Not blocking generic roadmap progress. |
| Candidate | Possible future workpackage; not yet committed. |
| Blocked | Cannot progress until dependency or decision clears. |

## Register

| WP ID | Legacy source | Title | Type | Status | Depends on | Enables | Can be skipped/deferred? | Production required? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| WP-05A | Phase 5 | Contribution manifest and registry model | Core gate | Validated | Phase 4.1 closed | WP-05B, WP-05C, WP-RES-01, WP-ITM-01, WP-SET-01 | No | Yes | Canonical bundled manifest normalization, deterministic registry package read model, dependency/conflict diagnostics, and shell registry inspector landed; document capability activation stays in WP-05B. |
| WP-05B | Phase 5 | Capability activation and resolver context | Core gate | Validated | WP-05A | WP-05C, WP-05D, WP-ITM-02, WP-REPO-01 | No | Yes | Pure document-scoped resolver, deterministic activation ordering, `%require` capability matching, active short-name diagnostics, and shell inspector context landed on top of the validated WP-05A registry. |
| WP-05C | Phase 5 | Pipeline/contribution execution integration | Core gate | Validated | WP-05A, WP-05B | WP-ITM-VISUALS, WP-LUA, WP-SERVICES-LOCAL, WP-PIPELINE-EDITOR | No | Yes | Canonical contribution execution now replaces the remaining shell runtime adapter and active-context pipeline execution records intermediate reopening metadata. |
| WP-05D | Phase 5 | Minimal package/capability inspector | Feature / diagnostics | Validated | WP-05A, WP-05B | All capability-heavy UX | Yes | No | Core-owned inspector read model, current-document capability routing, packaged contribution state cards, and shell-visible diagnostics now sit on top of the validated WP-05A/WP-05B registry/resolver contracts. |
| WP-RES-01 | Phase 5.1 | Provider-aware resource descriptors | Core foundation | Not started | Phase 4.1 resource facts | WP-RES-02, WP-REPO-01, WP-BE-API | No | Yes | May start after 4.1; does not need Entra or backend. |
| WP-RES-02 | Phase 5.1 | Revisions, dirty state, and conflict diagnostics | Core foundation | Not started | WP-RES-01 | WP-RES-03, WP-BE-PERSIST, WP-COLLAB-LEASES | No | Yes | Separates local revision model from backend persistence. |
| WP-RES-03 | Phase 5.1 | Multi-resource changesets and provider allowlists | Core foundation | Not started | WP-RES-02, WP-05B recommended | WP-BE-API, WP-GITLAB, WP-AI-MEDIATOR | No | Yes | Backend-backed writes and future Git/AI edits converge here. |
| WP-ID-01 | Phase 5.2 | Identity contract | Core contract | Not started | Phase 4.1 | WP-ID-DEV, WP-POLICY-01, WP-PRIVATE-CONTRACT | No | Yes | Backend-neutral user/group/claims/session/diagnostics shape. |
| WP-ID-DEV | New V18 split | Development identity fixture provider | Development enabler | Not started | WP-ID-01 | WP-POLICY-01, WP-BE-PERSIST, WP-PRIVATE-SERVER, WP-SET-SYNC | No | No | Local fake users/groups/claims from config. Enables backend development without Entra. |
| WP-POLICY-01 | Phase 9.4 split | Provider-neutral server policy engine | Core backend gate | Not started | WP-ID-01, WP-ID-DEV, WP-BE-HOST or WP-BE-PERSIST | WP-PRIVATE-SERVER, WP-SET-SYNC, WP-GITLAB, WP-SERVICES-BE, WP-COLLAB-LEASES, WP-AI-MEDIATOR | No | Yes | Mandatory backend policy using identity-contract; not tied to Entra. |
| WP-SSO-ENTRA | Phase 9.4 split | Microsoft Entra SSO adapter | Optional production adapter | Deferred / standalone | WP-ID-01, WP-POLICY-01, WP-BE-HOST manifest | Production Entra accreditation | Yes | Only for Entra deployments | Can be done anytime after provider-neutral identity/policy exists. |
| WP-SSO-OIDC | Future optional | Generic OIDC / Keycloak adapter | Optional production adapter | Candidate | WP-ID-01, WP-POLICY-01 | Alternative enterprise identity deployments | Yes | Only when chosen | Same contract as Entra; provider-specific mapping stays behind adapter. |
| WP-SET-01 | Phase 5.3 | User settings core and local persistence | Core UX foundation | Not started | WP-05A command metadata recommended | WP-SET-UI, WP-SET-SYNC, WP-AI-PREF | No | Yes | Settings personalize defaults/UI only; no permissions. |
| WP-ITM-01 | Phase 6 | ITM parser/model foundation | Domain foundation | Validated | WP-05A recommended | WP-ITM-02, WP-REPO-01, WP-ITM-VISUALS, WP-BPMN-SEM | No | Yes | Public `@textforge/itm` wrapper now vendors the upstream ITM runtime, exposes parse/serialize/resolve/validate/project contracts plus selector/style/view/profile interfaces, standardizes resolver diagnostic categories, ships workspace include resolution, and integrates Markdown `itm`/`itm-pub` publication rendering with vendored BPMN/ArchiMate profile fixtures. |
| WP-ITM-02 | Phase 6 | ITM directives, packages, validation, diagnostics | Domain foundation | Not started | WP-ITM-01, WP-05B | WP-REPO-01, WP-BPMN-SEM, WP-ARCHIMATE-SEM | No | Yes | Owns `%require` and package/capability evaluation semantics on top of WP-ITM-01 contracts; depends on WP-05B for active resolver context and capability activation behavior. |
| WP-REPO-01 | Phase 6.1 | Repository reference and include resolver | Core/domain bridge | Not started | WP-RES-01, WP-ITM-01 | WP-MD-REPORT, WP-GITLAB, package reuse | No | Yes | Provider-resolved `%repository`/`%include`; no arbitrary frontend fetch. |
| WP-ITM-VISUALS | Phase 7 | ITM visual projections | Feature | Not started | WP-ITM-01, WP-05C | WP-BPMN-VISUAL, WP-GRAPH-EDIT | Yes | No | Can split into mindmap, graph, viewpoint projection if useful. |
| WP-SERVICES-LOCAL | Phase 7.1 | Local service-folder convention | Core/service seam | Not started | WP-RES-01, WP-05C recommended | WP-SERVICES-BE | Yes | No | Data-plane convention before server-backed jobs. |
| WP-SET-UI | Phase 7.2 | User settings UI | Feature / UX | Not started | WP-SET-01, WP-05A/B | WP-AI-PREF | Yes | No | Can be deferred if command surfaces remain manageable. |
| WP-LUA | Phase 8 | Lua automation | Optional automation | Validated | WP-05C | Pipeline scripting use cases | Yes | No | Sandboxed/local and capability-gated runtime, reserved automation discovery root, tf.* bridge, and xterm console shipped with package-owned acceptance evidence; no separate Lua-only security gate workpackage. |
| WP-PRIVATE-CONTRACT | Phase 8.1 | Private/group space contracts | Core backend contract | Not started | WP-ID-01, WP-RES-01 | WP-PRIVATE-SERVER | Yes | Yes for backend profile | Define early; do not expose UI roots until server enforcement exists. |
| WP-MD-REPORT | Phase 9 | Markdown + ITM report generation | Feature | Not started | Phase 4 markdown baseline, WP-ITM-01, WP-REPO-01 | Publication/report flows, PDF later | Yes | No | Keeps Phase 9 report role separate from backend Phase 9.x inserts. |
| WP-BE-HOST | Phase 9.1 | Enterprise container and app host | Profile foundation | Not started | Build/profile packaging, manifest schema | WP-BE-API, WP-POLICY-01, optional SSO adapters | Yes | Required for enterprise profile | One local Node/container origin; no Entra required. |
| WP-BE-API | Phase 9.2 | Backend API contract and frontend provider | Backend foundation | Not started | WP-RES-03, WP-BE-HOST recommended | WP-BE-PERSIST | Yes | Required for backend profile | Optional frontend provider against approved backend origin. |
| WP-BE-PERSIST | Phase 9.3 | Reference persistence server | Backend foundation | Not started | WP-BE-API, WP-ID-DEV, WP-POLICY-01 recommended | WP-PRIVATE-SERVER, WP-SET-SYNC, WP-GITLAB, WP-COLLAB-LEASES | Yes | Required for backend profile | Implement against dev identity first; Entra not blocking. |
| WP-PRIVATE-SERVER | Phase 9.5 | Private/group spaces server | Backend feature | Not started | WP-PRIVATE-CONTRACT, WP-BE-PERSIST, WP-POLICY-01 | Enterprise storage value | Yes | Backend profile only | Depends on policy enforcement, not specifically Entra. |
| WP-SET-SYNC | Phase 9.6 | Roaming user settings | Backend feature | Not started | WP-SET-01, WP-BE-PERSIST, WP-POLICY-01 | Cross-device settings | Yes | No | Sync preferences only; never permissions. |
| WP-GITLAB | Phase 9.7 | GitLab persistence adapter | Optional adapter | Not started | WP-BE-PERSIST, WP-RES-03, WP-POLICY-01 | Git-backed repository workflows | Yes | Only if GitLab deployment is chosen | Frontend remains repository/resource/changeset-based. |
| WP-BPMN-SEM | Phase 10 split | BPMN semantic profile and validation | Domain profile | Not started | WP-ITM-02 | WP-BPMN-VISUAL, WP-TABLES | Yes | No | Can precede mature visual editing. |
| WP-BPMN-VISUAL | Phase 10 split | BPMN viewer/editor surface | Feature | Not started | WP-BPMN-SEM, WP-ITM-VISUALS, WP-GRAPH-EDIT optional | BPMN visual authoring | Yes | No | Split visual value from semantic profile. |
| WP-SERVICES-BE | Phase 10.1 | Backend-backed service folders | Backend feature | Not started | WP-SERVICES-LOCAL, WP-BE-PERSIST, WP-POLICY-01 | Controlled server validation/render/export jobs | Yes | No | Control plane remains explicit APIs. |
| WP-COLLAB-LEASES | Phase 10.2 | Soft collaboration leases | Backend feature | Not started | WP-BE-PERSIST, WP-RES-02, WP-POLICY-01 | Safer multi-user editing | Yes | No | Time-bound advisory leases only; no live collaboration. |
| WP-TABLES | Phase 11 | Tables, catalogues, and matrices | Feature | Not started | WP-ITM-01; WP-BPMN-SEM optional | Catalogue/matrix UX | Yes | No | Can proceed after semantic model projections. |
| WP-AI-MEDIATOR | Phase 11.1 | AI contract and backend mediator | Optional backend capability | Not started | WP-BE-PERSIST, WP-POLICY-01, audit hooks | WP-AI-CHAT | Yes | No | Read/suggest-only; backend-mediated. |
| WP-AI-CHAT | Phase 11.2 | AI client and chat surface | Optional feature | Not started | WP-AI-MEDIATOR | Talk-with-docs UX | Yes | No | No automatic patch application. |
| WP-AI-PREF | Phase 11.3 | AI preference integration | Optional feature | Not started | WP-AI-CHAT, WP-SET-01 or WP-SET-UI | Usable AI defaults | Yes | No | Preferences cannot expand scope or permissions. |
| WP-ARCHIMATE-SEM | Phase 12 split | ArchiMate semantic profile | Domain profile | Not started | WP-ITM-02 | WP-ARCHIMATE-VISUAL | Yes | No | Split from visual editing investigation. |
| WP-SURFACES-ADV | Phase 13 | Advanced tabbed main surfaces | UX capacity | Not started | Stable shell, WP-05A/B, WP-SET-UI recommended | Advanced multitasking | Yes | No | May move earlier if workflow complexity demands it. |
| WP-MD-RICH | Phase 14 | Rich Markdown editing | Optional editor feature | Not started | WP-MD-REPORT or Markdown base + contribution handlers | Authoring ergonomics | Yes | No | Round-trip gated. |
| WP-GRAPH-EDIT | Phase 15 split | Controlled visual edit/write-back infrastructure | Visual editing foundation | Not started | WP-ITM-VISUALS, WP-RES-03 recommended | BPMN visual edit, ArchiMate visual edit | Yes | No | Review/apply patch model before direct write-back. |
| WP-PIPELINE-EDITOR | Phase 15 split | Pipeline/diagram editor surfaces | Optional editor feature | Not started | WP-GRAPH-EDIT, WP-05C | Visual pipeline authoring | Yes | No | Can be deferred independently. |
| WP-ARCHIMATE-VISUAL | Phase 16 | ArchiMate visual editing investigation | Optional investigation | Not started | WP-ARCHIMATE-SEM, WP-GRAPH-EDIT | Potential visual EA editing | Yes | No | Investigation, not guaranteed product feature. |
| WP-SKETCH | Phase 17 | Sketch and annotation resources | Optional feature | Not started | WP-RES-01, surfaces | Annotations over resources | Yes | No | Independent of backend; may feed PDF annotation later. |
| WP-PDF-EXPORT | Phase 18 split | PDF generation/export | Optional export | Not started | WP-MD-REPORT, generated assets | Report/package export | Yes | No | Can split from PDF annotation. |
| WP-PDF-ANNOTATE | Phase 18 split | PDF annotation | Optional feature | Not started | WP-PDF-EXPORT or PDF viewer, WP-SKETCH optional | Annotation workflows | Yes | No | Separate from generation. |
| WP-RELEASE-GATE | Phase 19 reframed | Release envelope and accreditation evidence | Recurring gate | Not started | Selected release scope | Release readiness | No for release | Yes | Should recur at milestones, not only at final end. |
| WP-SSO-SAML | Future optional | Generic SAML / enterprise IdP adapter | Optional production adapter | Candidate | WP-ID-01, WP-POLICY-01 | Alternative enterprise identity deployments | Yes | Only when chosen | Same contract as Entra/OIDC; provider-specific mapping stays behind adapter. |
| WP-SSO-KEYCLOAK | Future optional | Keycloak adapter | Optional production adapter | Candidate | WP-ID-01, WP-POLICY-01 | Open-source/self-hosted SSO deployments | Yes | Only when chosen | Usually via OIDC/SAML, but may warrant a named adapter if needed. |
| WP-REPO-SHAREPOINT | Future optional | SharePoint-like repository adapter | Optional adapter | Candidate | WP-BE-PERSIST, WP-RES-03, WP-POLICY-01 | Enterprise document-library-backed repositories | Yes | Only if selected | Backend-only adapter; frontend remains repository/resource/changeset-based. |
| WP-DIST-PWA | Future optional | PWA/local packaged variant investigation | Optional distribution | Candidate | Local static build, security profile | Future installation/offline UX | Yes | No | Requires separate security profile if it changes storage/network guarantees. |


## Current reading

- The former Phase 5 contribution/capability spine plus the minimal inspector are now validated: `WP-05A -> WP-05B -> WP-05C`, with `WP-05D` landed on top of that registry/resolver baseline.
- The nearest ready follow-on slice is `WP-RES-01` provider-aware resource descriptors.
- `WP-ID-01`, `WP-SET-01`, and `WP-ITM-02` are also startable foundation workpackages under the current dependency posture.
- `WP-ITM-01` and `WP-LUA` are validated; the local ITM follow-on now moves to `WP-ITM-02`.
- `WP-LUA` is validated on top of `WP-05C`; sandbox and security-profile checks remain part of `WP-LUA` evidence rather than a separate gating workpackage.
- Resource-provider, identity-contract, and settings-core work can be developed as independent foundations once their small prerequisites are met.
- Entra SSO is now explicitly deferred as `WP-SSO-ENTRA`, a standalone production adapter that does not block local backend development.
- Backend private/group spaces, roaming settings, GitLab, service jobs, leases, and AI should depend on provider-neutral identity/policy plus a dev fixture first, not on Entra itself.
