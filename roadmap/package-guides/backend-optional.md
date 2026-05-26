# Backend-Optional Package Guidance — V16

## Purpose

This guide records the V16 package-split and dependency-boundary guidance for the backend-optional TextForge architecture. It is cross-cutting: use it together with the phase roadmap, the backend whitepaper, and the backend grilling record.

Required references:

- `roadmap/textforge_backend_optional_architecture_whitepaper.md`
- `roadmap/grilling/backend-grilling.md`
- `roadmap/00_package_aware_roadmap.md`
- `roadmap/02_phase_architecture_pnpm_matrix.md`

## Core rule

Backend support is optional. Local/offline TextForge remains first-class and must not acquire a backend dependency.

Resource providers are workspace/storage/repository abstractions. They do not register executable contributions, commands, renderers, transformers, validators, pipelines, or UI contributions. Those remain under the Phase 5 contribution/capability model.

## Security invariants

- Local/offline mode remains fully supported.
- Local/offline mode has no File System Access API, persistent directory handles, silent local reads/writes, background folder sync, or arbitrary network providers.
- Enterprise mode uses one approved backend origin per app session/deployment.
- Backend-only adapters never leak into frontend-safe packages.
- User settings personalize UI/defaults only and never grant permissions.
- Backend-backed writes use revisions and multi-resource changesets.
- GitLab, Entra, backend persistence, private/group enforcement, service control APIs, and AI provider access are backend-only.
- Initial AI is read/suggest only and non-mutating.
- Optional backend capabilities affect available actions/diagnostics, not document semantics.

## Planned package families

| Family | Planned packages | Notes |
|---|---|---|
| Workspace/repository | `workspace-core`, `workspace-indexeddb`, `workspace-zip`, `workspace-services`, `repository-core`, `repository-itm` | Start inside existing `@textforge/workspace` and `@textforge/itm`; extract when provider/repository seams stabilize. |
| User settings | `user-settings-core`, `user-settings-local`, `user-settings-ui`, `user-settings-server-sync` | Local settings before backend sync. Settings never grant permissions. |
| Persistence/backend | `persistence-client`, `persistence-server-contract`, `persistence-server-reference`, `persistence-gitlab-adapter` | Frontend may use client/contracts only. GitLab adapter is backend-only. |
| Identity/spaces | `identity-contract`, `identity-entra-server`, `private-spaces-contract`, `private-spaces-server` | Define contracts early; enforce private/group spaces only after backend identity/policy exists. |
| AI | `ai-contract`, `ai-client`, `ai-server-mediator`, `ai-chat-surface` | Backend-mediated; initial client/chat surface is read/suggest only. |
| Distribution | `app-distribution`, `server-app-host`, `enterprise-container`, `browser-extension-wrapper`, `local-static-build` | Local static and browser extension stay thin wrappers. Enterprise container serves frontend and API from one origin. |

## Phase responsibilities

| Phase | Responsibility |
|---|---|
| 5.1 | Provider-aware resource descriptors, revisions, dirty state, multi-resource changesets, provider allowlists, and local provider seams. |
| 5.2 | Neutral identity contract and permission diagnostic shapes. |
| 5.3 | User settings core and local persistence. |
| 6.1 | Provider-backed repository resolver and repository diagnostics. |
| 7.1 | Local service-folder data-plane conventions. |
| 7.2 | User settings UI. |
| 8.1 | Private/group space contracts, UI gated until backend enforcement exists. |
| 9.1 | Enterprise distribution profile and container skeleton. |
| 9.2 | Backend API contract and optional frontend provider client. |
| 9.3 | Reference persistence server with revisions/changesets and manifest/schema compatibility. |
| 9.4 | Enterprise SSO and server-side policy. |
| 9.5 | Private/group spaces server. |
| 9.6 | Roaming user settings. |
| 9.7 | GitLab adapter behind the persistence server. |
| 10.1 | Backend-backed service folders with explicit job APIs. |
| 10.2 | Advisory, time-bound soft collaboration leases. |
| 11.1 | AI contract and backend mediator. |
| 11.2 | AI client and chat surface, non-mutating. |
| 11.3 | AI preference integration under settings/policy. |

## Definition of done for backend-related phases

A backend-related phase is done only when:

- the local/offline profile remains buildable and runnable;
- frontend package dependency graphs contain no backend-only adapters;
- capability unavailability produces UI state or diagnostics, not alternate document semantics;
- backend writes use changesets and base revisions where applicable;
- manifest/API/schema compatibility is validated where enterprise mode is involved;
- RAPID records any package extraction, dependency addition, security exception, or scope deferral.
