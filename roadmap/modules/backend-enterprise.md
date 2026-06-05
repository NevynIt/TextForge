# Backend and enterprise

## Registry

- Module ID: `MOD-BACKEND-ENTERPRISE`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/backend-enterprise.md`

## Purpose

Backend and enterprise defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- optional backend host/API/persistence
- identity fixture and enterprise profile foundations
- server-side service jobs
- backend-mediated AI and collaboration primitives

### Does not own

- local-only static profile
- frontend package contribution loading
- provider-specific SSO adapters as product default

## Public Contracts

- backend manifest
- provider API contracts
- identity and policy contracts

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-ID-01` | Identity contract | Registry-owned | Core contract |
| `WP-ID-DEV` | Development identity fixture provider | Registry-owned | Development enabler |
| `WP-POLICY-01` | Provider-neutral server policy engine | Registry-owned | Core backend gate |
| `WP-PRIVATE-CONTRACT` | Private/group space contracts | Registry-owned | Core backend contract |
| `WP-BE-HOST` | Enterprise container and app host | Registry-owned | Profile foundation |
| `WP-BE-API` | Backend API contract and frontend provider | Registry-owned | Backend foundation |
| `WP-BE-PERSIST` | Reference persistence server | Registry-owned | Backend foundation |
| `WP-PRIVATE-SERVER` | Private/group spaces server | Registry-owned | Backend feature |
| `WP-GITLAB` | GitLab persistence adapter | Registry-owned | Optional adapter |
| `WP-SERVICES-BE` | Backend-backed service folders | Registry-owned | Backend feature |
| `WP-COLLAB-LEASES` | Soft collaboration leases | Registry-owned | Backend feature |
| `WP-AI-MEDIATOR` | AI contract and backend mediator | Registry-owned | Optional backend capability |
| `WP-AI-PREF` | AI preference integration | Registry-owned | Optional feature |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/backend-optional.md
- archive/registers/specs/legacy-specs/architecture/backend-optional-architecture.md
- archive/grilling/legacy-grilling/backend-grilling.md
