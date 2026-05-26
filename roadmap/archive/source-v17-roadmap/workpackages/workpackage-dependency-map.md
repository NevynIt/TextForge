# Workpackage Dependency Map — V17 Starter

**Status:** Initial map for reassessment; use `workpackage-register.md` as the current source of status.

## Core graph

```mermaid
flowchart TD
  F41[Phase 4.1 closed foundation]

  F41 --> WP05A[WP-05A Contribution manifests]
  WP05A --> WP05B[WP-05B Capability resolver context]
  WP05B --> WP05C[WP-05C Contribution execution]
  WP05B --> WP05D[WP-05D Package inspector]

  F41 --> RES01[WP-RES-01 Resource descriptors]
  RES01 --> RES02[WP-RES-02 Revisions and conflicts]
  RES02 --> RES03[WP-RES-03 Changesets and allowlists]

  F41 --> ID01[WP-ID-01 Identity contract]
  ID01 --> IDDEV[WP-ID-DEV Dev identity fixture]
  IDDEV --> POLICY[WP-POLICY-01 Provider-neutral policy]

  WP05C --> ITM01[WP-ITM-01 ITM parser/model]
  ITM01 --> ITM02[WP-ITM-02 Directives/packages/rules]
  RES01 --> REPO01[WP-REPO-01 Repository/include resolver]
  ITM02 --> REPO01
  RES03 --> REPO01

  REPO01 --> MDREP[WP-MD-REPORT Markdown + ITM reports]
  ITM01 --> VIS[WP-ITM-VISUALS ITM visual projections]
  ITM02 --> BPMNSEM[WP-BPMN-SEM BPMN semantics]
  BPMNSEM --> BPMNVIS[WP-BPMN-VISUAL BPMN visual surface]
  ITM02 --> ARCHSEM[WP-ARCHIMATE-SEM ArchiMate semantics]
  ARCHSEM --> ARCHVIS[WP-ARCHIMATE-VISUAL ArchiMate visual investigation]
  ITM01 --> TABLES[WP-TABLES Tables/catalogues/matrices]

  RES03 --> BEHOST[WP-BE-HOST Enterprise container/app host]
  BEHOST --> BEAPI[WP-BE-API Backend API and provider]
  BEAPI --> BEPERSIST[WP-BE-PERSIST Reference persistence server]
  POLICY --> BEPERSIST

  POLICY --> SSOENTRA[WP-SSO-ENTRA Optional Entra adapter]
  POLICY --> SSOOIDC[WP-SSO-OIDC Optional OIDC/Keycloak adapter]

  BEPERSIST --> PRIVATE[WP-PRIVATE-SERVER Private/group spaces]
  BEPERSIST --> SETSYNC[WP-SET-SYNC Roaming settings]
  BEPERSIST --> GITLAB[WP-GITLAB Optional GitLab adapter]
  BEPERSIST --> SERVICESBE[WP-SERVICES-BE Backend service folders]
  BEPERSIST --> LEASES[WP-COLLAB-LEASES Soft collaboration leases]
  BEPERSIST --> AIMED[WP-AI-MEDIATOR AI mediator]
  AIMED --> AICHAT[WP-AI-CHAT AI chat surface]

  WP05A --> SET01[WP-SET-01 Settings core/local]
  SET01 --> SETUI[WP-SET-UI Settings UI]
  SET01 --> SETSYNC
  SET01 --> AIPREF[WP-AI-PREF AI preferences]
  AICHAT --> AIPREF

  VIS --> GRAPHEDIT[WP-GRAPH-EDIT Visual write-back infra]
  GRAPHEDIT --> BPMNVIS
  GRAPHEDIT --> PIPEEDIT[WP-PIPELINE-EDITOR Pipeline editor]

  MDREP --> PDFEXPORT[WP-PDF-EXPORT]
  PDFEXPORT --> PDFANNOTATE[WP-PDF-ANNOTATE]
```

## Dependency interpretation

- `WP-SSO-ENTRA` is downstream of the provider-neutral policy engine. It is not upstream of backend persistence, private/group spaces, settings sync, leases, GitLab, or AI development.
- `WP-ID-DEV` is the local development bridge that keeps backend work testable without enterprise infrastructure.
- `WP-RELEASE-GATE` is intentionally not shown as a terminal node only. It should be run whenever a selected release slice needs evidence.
