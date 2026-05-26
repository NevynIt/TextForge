# 06 — Backend-Optional Enterprise Workpackages

This cluster enables an optional enterprise profile without making local/offline TextForge depend on backend infrastructure.

## Generic backend path

```text
WP-ID-01 -> WP-ID-DEV -> WP-POLICY-01
WP-BE-HOST -> WP-BE-API -> WP-BE-PERSIST
```

## Workpackages

| WP | Title | Role |
|---|---|---|
| WP-ID-01 | Identity contract | Backend-neutral user/group/claims/session contract. |
| WP-ID-DEV | Development identity fixture provider | Local users/groups/claims from config; keeps development unblocked. |
| WP-POLICY-01 | Provider-neutral server policy engine | Server-side permission decisions behind the identity contract. |
| WP-PRIVATE-CONTRACT | Private/group space contracts | Define roots and ownership metadata before exposing UI. |
| WP-BE-HOST | Enterprise container and app host | One container/origin serving frontend and `/api`. |
| WP-BE-API | Backend API contract and optional frontend provider | One approved backend provider from manifest. |
| WP-BE-PERSIST | Reference persistence server | Data/control plane, manifest, health, audit hooks. |
| WP-PRIVATE-SERVER | Private/group spaces server | Real backend-enforced private/group roots. |
| WP-SET-SYNC | Roaming user settings | Sync preferences only; never permissions. |
| WP-SERVICES-BE | Backend-backed service folders | Server-side jobs with explicit control APIs. |
| WP-COLLAB-LEASES | Soft collaboration leases | Advisory, time-bound locks; no live collaboration. |

## Entra rule

`WP-SSO-ENTRA` is not part of the generic backend path. It is an optional production adapter listed in `09-optional-adapters.md`.

## Development rule

A local Node/container preview server with fixture identity must be enough to develop backend persistence, policy checks, private/group spaces, settings sync, leases, GitLab scaffolding, and AI mediator scaffolding.
