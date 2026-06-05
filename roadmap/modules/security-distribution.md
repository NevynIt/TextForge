# Security and distribution

## Registry

- Module ID: `MOD-SECURITY-DISTRIBUTION`
- Authoritative state: `roadmap-state.yaml`
- Registry path: `modules/security-distribution.md`

## Purpose

Security and distribution defines the stable ownership boundary for the workpackages listed below.

## Boundaries

### Owns

- local/offline security profile
- enterprise distribution constraints
- SSO adapter security gates
- PWA/local package investigations

### Does not own

- feature-specific semantics
- backend data model
- resource provider UX

## Public Contracts

- security invariants
- distribution profile constraints
- SSO adapter contracts

## Dependencies

Authoritative dependency data lives in `roadmap-state.yaml`.

## Workpackages

| WP | Title | Status source | Type |
|---|---|---|---|
| `WP-SSO-ENTRA` | Microsoft Entra SSO adapter | Registry-owned | Optional production adapter |
| `WP-SSO-OIDC` | Generic OIDC / Keycloak adapter | Registry-owned | Optional production adapter |
| `WP-SSO-SAML` | Generic SAML / enterprise IdP adapter | Registry-owned | Optional production adapter |
| `WP-SSO-KEYCLOAK` | Keycloak adapter | Registry-owned | Optional production adapter |
| `WP-DIST-PWA` | PWA/local packaged variant investigation | Registry-owned | Optional distribution |

## Current State

See `views/status-dashboard.md` and `views/module-matrix.md` for generated current state.

## Target State

The module is healthy when its workpackages can move independently through the registry without duplicating status or dependency truth in narrative files.

## Key Decisions

- `ADR-0001` governs roadmap structure and authority.

## Validation Approach

Module-level validation is assembled from the workpackage checklists and release evidence linked in `roadmap-state.yaml`.

## Historical Notes

- archive/registers/package-guides/security-profile.md
- archive/registers/specs/legacy-specs/architecture/security-invariants.md
- archive/grilling/legacy-grilling/phase-4.1-grilling.md
