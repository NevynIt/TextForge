# V17 Dependency Reassessment — Start

**Status:** Initial reassessment, not a final full conversion  
**Date:** 2026-05-26  
**Input baseline:** Roadmap V16 with backend-optional subphases inserted after Phase 4.1

## Executive conclusion

V17 should keep Phases -1 through 4.1 as the fixed foundation and convert everything from Phase 5 onward into dependency-gated workpackages.

The major finding is that V16 mixed three different kinds of work under one linear sequence:

1. **Core gates** that truly unlock many later capabilities, such as contribution registries, resource descriptors, revisions, changesets, identity contracts, policy decisions, and repository resolution.
2. **Feature/domain workpackages** that add value but do not necessarily block each other, such as ITM visuals, Lua automation, tables, BPMN, ArchiMate, rich Markdown, sketching, and PDF export.
3. **Optional adapters/profile workpackages** that should be implementable any time after their contracts exist, such as Entra SSO, GitLab, AI provider integrations, OIDC/SAML adapters, browser extension packaging, and future PWA/native wrappers.

The roadmap should therefore stop using linear phase position as the primary source of truth after WP5. Numeric order should remain as a useful recommended path and traceability handle, but each workpackage should declare explicit dependencies.

## Fixed foundation

The current RAPID record in V16 says Phase 4.1 has been closed and Phase 5 is the next open implementation action. V17 should therefore avoid reopening earlier implementation unless a specific defect is found.

Recommended rule:

```text
Phases -1 through 4.1 = foundation history.
WP5 onward = dependency-based workpackage backlog.
```

## Major dependency corrections

### 1. Entra SSO is not a blocking phase

Current V16 has `Phase 9.4 — Enterprise SSO and server-side policy` as one phase. That is too coarse.

Split it into:

| New WP | Purpose | Dependency role |
|---|---|---|
| `WP-ID-01` | Identity contract | Core contract, early |
| `WP-ID-DEV` | Local development fixture identity | Development enabler |
| `WP-POLICY-01` | Provider-neutral server policy engine | Backend gate |
| `WP-SSO-ENTRA` | Microsoft Entra adapter | Optional production adapter |
| `WP-SSO-OIDC` / `WP-SSO-SAML` | Other SSO adapters | Optional future adapters |

This allows backend development to continue locally using a Node/container preview server and fixture users/groups/claims. Entra only blocks production Entra validation/accreditation.

### 2. Reference persistence should not depend on Entra

Reference persistence needs:

- backend API contract;
- provider/resource descriptors;
- revisions and changesets;
- dev identity fixture;
- provider-neutral policy decisions.

It does **not** need Entra.

### 3. Private/group spaces need policy, not a specific SSO provider

Private/group server implementation should depend on identity-contract + policy engine + dev fixture for development. Production identity adapters can be added later.

### 4. Backend adapters should be standalone optional WPs

GitLab, AI provider routing, Entra, OIDC/SAML, SharePoint-like repository providers, and future publication/audit adapters should all be optional adapter workpackages. They should depend on contracts, not hold up core roadmap work.

### 5. Domain profiles can split semantic work from visual editing

BPMN and ArchiMate should be split into:

- semantic profile/types/rules;
- rendering/viewing/projection;
- visual editing/write-back.

This allows useful validation/catalogue/report value before mature visual editing exists.

### 6. Release evidence should become recurring, not only final

Phase 19 should be reframed as a recurring release/accreditation gate. It should run at meaningful delivery milestones, not only at the end of all features.

## Proposed modularization by cluster

### Core implementation spine

```text
WP-05A Contribution manifest and registry model
  -> WP-05B Capability activation and resolver context
  -> WP-05C Pipeline/contribution execution integration
  -> WP-RES-01 Provider-aware resource descriptors
  -> WP-RES-02 Revisions, dirty state, conflict diagnostics
  -> WP-RES-03 Multi-resource changesets and provider allowlists
  -> WP-REPO-01 Repository/include resolver
```

This is the nearest equivalent to the old linear phase path.

### Identity/backend spine

```text
WP-ID-01 Identity contract
  -> WP-ID-DEV Development identity fixture provider
  -> WP-POLICY-01 Provider-neutral server policy engine
  -> WP-BE-HOST Enterprise app host/container
  -> WP-BE-API Backend API contract and frontend provider
  -> WP-BE-PERSIST Reference persistence server
```

This path supports local backend development without enterprise SSO.

### Optional production identity adapters

```text
WP-POLICY-01
  -> WP-SSO-ENTRA
  -> WP-SSO-OIDC
  -> WP-SSO-SAML / Keycloak / other adapters
```

These are production/integration workpackages, not core development blockers.

### Backend capability workpackages

```text
WP-BE-PERSIST + WP-POLICY-01
  -> WP-PRIVATE-SERVER
  -> WP-SET-SYNC
  -> WP-GITLAB
  -> WP-SERVICES-BE
  -> WP-COLLAB-LEASES
  -> WP-AI-MEDIATOR
```

Each should be individually optional unless the selected release scope requires it.

### Domain and authoring workpackages

```text
WP-ITM-01 -> WP-ITM-02 -> WP-REPO-01
  -> WP-MD-REPORT
  -> WP-ITM-VISUALS
  -> WP-BPMN-SEM -> WP-BPMN-VISUAL
  -> WP-TABLES
  -> WP-ARCHIMATE-SEM -> WP-ARCHIMATE-VISUAL
```

### UX/editor capacity workpackages

```text
WP-SET-01 -> WP-SET-UI
WP-SURFACES-ADV
WP-MD-RICH
WP-GRAPH-EDIT -> WP-PIPELINE-EDITOR
WP-SKETCH
WP-PDF-EXPORT -> WP-PDF-ANNOTATE
```

These can be scheduled based on usability pressure, not only numeric order.

## Candidate splits needing confirmation

| Existing phase | Suggested split | Reason |
|---|---|---|
| Phase 5 | WP-05A/05B/05C/05D | Separate manifests, resolver/capability context, execution, and inspector. |
| Phase 5.1 | WP-RES-01/02/03 | Separate descriptors, revisions/conflicts, and changesets/allowlists. |
| Phase 9.4 | WP-ID-DEV/WP-POLICY-01/WP-SSO-ENTRA | Entra should not block local backend development. |
| Phase 10 | WP-BPMN-SEM/WP-BPMN-VISUAL | Semantic BPMN value can arrive before mature visual editing. |
| Phase 15 | WP-GRAPH-EDIT/WP-PIPELINE-EDITOR | Write-back infrastructure is more fundamental than specific editor surfaces. |
| Phase 18 | WP-PDF-EXPORT/WP-PDF-ANNOTATE | PDF generation and annotation have different dependencies. |
| Phase 19 | WP-RELEASE-GATE recurring | Release/accreditation evidence should happen at milestones. |

## Immediate V17 implementation recommendation

Do not attempt to rewrite every roadmap file at once.

Recommended next steps:

1. Accept the workpackage register as the V17 planning layer.
2. Add a V17 note to `README.md` and `AGENTS_START_HERE.md` telling agents to use the workpackage register from WP5 onward.
3. Keep `00_package_aware_roadmap.md` as the detailed scope source for now.
4. Gradually convert the Phase 5 onward entries into full workpackage files or rows.
5. Update the matrix and dependency diagram only after the workpackage register stabilizes.

## Initial conclusion

The V17 shift is justified. It preserves the good parts of V16 while removing false blockers, especially Entra SSO. It also creates a practical way to run local backend development with a fixture identity provider while leaving enterprise SSO adapters as standalone integration workpackages.
