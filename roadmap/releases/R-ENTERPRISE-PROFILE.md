# R-ENTERPRISE-PROFILE - Enterprise profile

## Outcome

Enterprise distribution, SSO, repository, and accreditation profile after backend foundations are viable.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-SSO-ENTRA` | Microsoft Entra SSO adapter | Registry-owned | no |
| `WP-SSO-OIDC` | Generic OIDC / Keycloak adapter | Registry-owned | no |
| `WP-GITLAB` | GitLab persistence adapter | Registry-owned | no |
| `WP-SSO-SAML` | Generic SAML / enterprise IdP adapter | Registry-owned | no |
| `WP-SSO-KEYCLOAK` | Keycloak adapter | Registry-owned | no |
| `WP-DIST-PWA` | PWA/local packaged variant investigation | Registry-owned | no |

## Excluded / Deferred

Anything not listed in the registry under this release is excluded until `roadmap-state.yaml` is updated.

## Dependency Gates

Dependency gates are resolved from `roadmap-state.yaml` and visualized in `views/dependency-map-full.md`.

## Acceptance Criteria

- All included workpackages have resolved dependencies or explicit waivers.
- Required validation evidence exists under `validation/evidence/`.
- Release-specific risks are recorded in `RAPID.md`.

## Validation Evidence Required

- Workpackage checklist evidence for included workpackages.
- Release cut evidence file if the release moves beyond candidate/defined state.

## Risks

| Risk | Mitigation |
|---|---|
| Registry drift | Regenerate views from `roadmap-state.yaml` and validate references before release. |

## Release Notes Draft

Enterprise distribution, SSO, repository, and accreditation profile after backend foundations are viable.

## Open Decisions

- See `decisions/` and `RAPID.md`.
