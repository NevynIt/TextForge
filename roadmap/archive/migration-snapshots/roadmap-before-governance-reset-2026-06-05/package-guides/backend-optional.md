> [!IMPORTANT]
> Archived historical roadmap material. This file is non-authoritative after the 2026-06-05 roadmap governance reset. Use oadmap/roadmap-state.yaml and active module/workpackage/release/ADR files for current planning truth.

# Backend-Optional Package Guidance - Roadmap V20

## Purpose

This guide records the package-split and dependency-boundary guidance for the backend-optional TextForge architecture. It is cross-cutting: use it together with the V20 roadmap, backend architecture spec, backend workpackage cluster, and backend grilling record.

Required references:

- `roadmap/specs/architecture/backend-optional-architecture.md`
- `roadmap/grilling/backend-grilling.md`
- `roadmap/ROADMAP_V20.md`
- `roadmap/workpackages/workpackage-register.md`
- `roadmap/workpackages/06-backend-optional-enterprise.md`
- `roadmap/decisions/RAPID.md`

## Core rule

Backend support is optional. Local/offline TextForge remains first-class and must not acquire a backend dependency.

Resource providers are workspace/storage/repository abstractions. They do not register executable contributions, commands, renderers, transformers, validators, pipelines, or UI contributions. Those remain under the contribution/capability model.

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

## Workpackage responsibilities

| Workpackage area | Responsibility |
|---|---|
| `WP-RES-02` / `WP-RES-03` | Revision-aware resources, dirty state, multi-resource changesets, provider allowlists, and local provider seams. |
| `WP-ID-01` / `WP-ID-DEV` | Neutral identity contract, fixture identity, and permission diagnostic shapes. |
| `WP-SET-01` | User settings core and local persistence. |
| `WP-REPO-01` and follow-ons | Provider-backed repository resolver and repository diagnostics. |
| `WP-SERVICES-BE` | Service-folder data-plane conventions and explicit backend job APIs. |
| `WP-SET-SYNC` | User settings UI and roaming settings where a backend profile exists. |
| `WP-POLICY-01` / `WP-PRIVATE-SERVER` | Private/group space contracts and policy-gated UI. |
| `WP-BE-HOST` / `WP-BE-API` / `WP-BE-PERSIST` | Enterprise distribution, backend API contract, and reference persistence server. |
| `WP-SSO-ENTRA` / `WP-SSO-OIDC` / `WP-SSO-SAML` | Enterprise SSO and server-side policy adapters. |
| `WP-GITLAB` | GitLab adapter behind the persistence server. |
| `WP-COLLAB-LEASES` | Advisory, time-bound soft collaboration leases. |
| `WP-AI-MEDIATOR` / `WP-AI-CHAT` / `WP-AI-PREF` | AI contract, backend mediator, non-mutating chat surface, and AI preferences under policy. |

## Definition of done for backend-related workpackages

A backend-related workpackage is done only when:

- the local/offline profile remains buildable and runnable;
- frontend package dependency graphs contain no backend-only adapters;
- capability unavailability produces UI state or diagnostics, not alternate document semantics;
- backend writes use changesets and base revisions where applicable;
- manifest/API/schema compatibility is validated where enterprise mode is involved;
- RAPID records any package extraction, dependency addition, security exception, or scope deferral.
